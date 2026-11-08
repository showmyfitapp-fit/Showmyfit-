import { NextRequest, NextResponse } from 'next/server';
import {
  DISPATCH_ASSIGN_TIMEOUT_MINUTES,
  LOW_STOCK_THRESHOLD,
  RETURN_SLA_HOURS,
  SELLER_ACCEPT_TIMEOUT_MINUTES,
  SUPPORT_SLA_HOURS,
} from '@/lib/ops/rules';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (secret && token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  const now = Date.now();
  const assignCutoff = new Date(now - DISPATCH_ASSIGN_TIMEOUT_MINUTES * 60 * 1000).toISOString();
  const acceptCutoff = new Date(now - SELLER_ACCEPT_TIMEOUT_MINUTES * 60 * 1000).toISOString();
  const returnCutoff = new Date(now - RETURN_SLA_HOURS * 60 * 60 * 1000).toISOString();
  const ticketCutoff = new Date(now - SUPPORT_SLA_HOURS * 60 * 60 * 1000).toISOString();

  const { data: stale } = await admin
    .from('delivery_jobs')
    .select('id, order_id')
    .eq('status', 'assigned')
    .lt('updated_at', assignCutoff);

  if (stale?.length) {
    await admin
      .from('delivery_jobs')
      .update({
        status: 'available',
        delivery_partner_id: null,
        delivery_partner_name: null,
        updated_at: new Date().toISOString(),
      })
      .in('id', stale.map((row) => row.id));
    const orderIds = stale.map((row) => row.order_id).filter(Boolean);
    if (orderIds.length) {
      await admin
        .from('orders')
        .update({
          delivery_partner_id: null,
          delivery_partner_name: null,
          status: 'packed',
          updated_at: new Date().toISOString(),
        })
        .in('id', orderIds)
        .in('status', ['rider_assigned', 'packed', 'ready_for_pickup']);
    }
  }

  const { data: lateAccept } = await admin
    .from('orders')
    .select('id')
    .in('status', ['placed', 'payment_confirmed'])
    .lt('placed_at', acceptCutoff);
  if (lateAccept?.length) {
    await admin
      .from('orders')
      .update({
        status: 'rejected',
        cancel_reason: 'seller_timeout',
        updated_at: new Date().toISOString(),
      })
      .in('id', lateAccept.map((row) => row.id));
  }

  const { data: overdueReturns } = await admin
    .from('return_requests')
    .select('id, user_id, order_id, order_number')
    .in('status', ['requested', 'under_review'])
    .lt('created_at', returnCutoff);
  if (overdueReturns?.length) {
    await admin.from('notifications').insert(
      overdueReturns.flatMap((row) => [
        {
          user_id: row.user_id,
          type: 'return_sla',
          title: 'Return delayed',
          message: `Return for ${row.order_number} is still under review.`,
          order_id: row.order_id,
          order_number: row.order_number,
        },
      ])
    );
  }

  const { data: overdueTickets } = await admin
    .from('support_tickets')
    .select('id')
    .eq('status', 'open')
    .lt('created_at', ticketCutoff);
  if (overdueTickets?.length) {
    await admin
      .from('support_tickets')
      .update({ status: 'escalated' })
      .in('id', overdueTickets.map((row) => row.id));
  }

  const { data: lowStock } = await admin
    .from('products')
    .select('id, name, seller_id, stock')
    .lte('stock', LOW_STOCK_THRESHOLD)
    .gt('stock', 0);
  if (lowStock?.length) {
    await admin.from('notifications').insert(
      lowStock.map((row) => ({
        user_id: row.seller_id,
        type: 'low_stock',
        title: 'Low stock',
        message: `${row.name || 'A product'} is down to ${row.stock} units.`,
      }))
    );
  }

  const { data: delayed } = await admin
    .from('orders')
    .select('id, user_id, order_number, eta_minutes, out_for_delivery_at')
    .eq('status', 'out_for_delivery');
  const lateOrders = (delayed || []).filter((order) => {
    if (!order.out_for_delivery_at || order.eta_minutes == null) return false;
    return Date.now() - new Date(order.out_for_delivery_at).getTime() > Number(order.eta_minutes) * 60 * 1000;
  });
  if (lateOrders.length) {
    await admin.from('notifications').insert(
      lateOrders.map((order) => ({
        user_id: order.user_id,
        type: 'delivery_delayed',
        title: 'Delivery delayed',
        message: `Order ${order.order_number} is running later than the estimated time.`,
        order_id: order.id,
        order_number: order.order_number,
      }))
    );
  }

  return NextResponse.json({
    released: stale?.length || 0,
    sellerTimeouts: lateAccept?.length || 0,
    overdueReturns: overdueReturns?.length || 0,
    overdueTickets: overdueTickets?.length || 0,
    lowStock: lowStock?.length || 0,
    delayed: lateOrders.length,
  });
}
