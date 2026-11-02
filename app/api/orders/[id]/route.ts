import { NextRequest, NextResponse } from 'next/server';
import { canTransitionOrderStatus } from '@/lib/orders/transitions';
import type { OrderStatus } from '@/lib/orders/types';
import {
  adjustProductStock,
  logOrderEvent,
} from '@/lib/server/order-side-effects';
import { getRequestUser } from '@/lib/server/request-user';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    const { id } = await params;
    const { data, error } = await getSupabaseAdminClient()
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ order: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load order' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    const { id } = await params;
    const body = (await request.json()) as { fields?: Record<string, unknown> };
    if (!body.fields) return NextResponse.json({ error: 'fields required' }, { status: 400 });

    const admin = getSupabaseAdminClient();
    const { data: current, error: loadError } = await admin
      .from('orders')
      .select('id, status, items')
      .eq('id', id)
      .maybeSingle();
    if (loadError) throw loadError;
    if (!current) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const nextStatus = body.fields.status ? String(body.fields.status) as OrderStatus : null;
    const currentStatus = String(current.status || 'placed') as OrderStatus;
    if (nextStatus && !canTransitionOrderStatus(currentStatus, nextStatus)) {
      return NextResponse.json(
        { error: `Cannot change order from ${currentStatus} to ${nextStatus}` },
        { status: 409 }
      );
    }

    const { error } = await admin
      .from('orders')
      .update({ ...body.fields, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;

    if (nextStatus && nextStatus !== currentStatus) {
      await logOrderEvent({
        orderId: id,
        actorId: user.id,
        actorRole: 'user',
        source: 'order_patch',
        fromStatus: currentStatus,
        toStatus: nextStatus,
        reason: body.fields.cancel_reason ? String(body.fields.cancel_reason) : null,
      });
      if (nextStatus === 'cancelled') {
        const items = Array.isArray(current.items) ? current.items : [];
        await adjustProductStock(
          items.map((item: any) => ({
            productId: item.productId || item.product_id,
            quantity: item.quantity,
          })),
          'release'
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not update order' },
      { status: 500 }
    );
  }
}
