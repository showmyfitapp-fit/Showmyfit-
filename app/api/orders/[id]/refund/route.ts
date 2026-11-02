import { NextRequest, NextResponse } from 'next/server';
import { logOrderEvent, logPaymentEvent, safeUpdateOrder } from '@/lib/server/order-side-effects';
import { getRequestUser, isAdminEmail } from '@/lib/server/request-user';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    if (!(await isAdminEmail(user.email))) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { amount?: number; reason?: string };
    const { data: order } = await getSupabaseAdminClient()
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.payment_status === 'refunded') {
      return NextResponse.json({ id, refundId: order.refund_id || 'already_refunded' });
    }

    let refundId = `cod_${id}`;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const amount = Number(body.amount || order.total || 0);

    if (order.payment_method !== 'cod' && order.payment_id && keyId && keySecret) {
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const response = await fetch(`https://api.razorpay.com/v1/payments/${order.payment_id}/refund`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          notes: { order_id: id, reason: body.reason || 'admin_refund' },
        }),
      });
      const refund = await response.json();
      if (!response.ok) {
        return NextResponse.json(
          { error: refund?.error?.description || 'Refund failed' },
          { status: 400 }
        );
      }
      refundId = refund.id || refundId;
    }

    await safeUpdateOrder(id, {
      payment_status: 'refunded',
      refund_id: refundId,
      refund_amount: amount,
    });
    await logOrderEvent({
      orderId: id,
      actorId: user.id,
      actorRole: 'admin',
      source: 'refund',
      reason: body.reason || 'refund',
    });
    await logPaymentEvent({
      eventType: 'refund.manual',
      paymentId: order.payment_id,
      razorpayOrderId: order.razorpay_order_id,
      amount,
      payload: { refundId },
    });

    return NextResponse.json({ id, refundId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Refund failed' },
      { status: 500 }
    );
  }
}
