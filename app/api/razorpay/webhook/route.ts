import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { logPaymentEvent, safeUpdateOrder } from '@/lib/server/order-side-effects';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';

export const dynamic = 'force-dynamic';

function verifySignature(rawBody: string, signature: string, secret: string) {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return expected === signature;
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';

    if (secret && signature && !verifySignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const event = rawBody ? JSON.parse(rawBody) : {};
    const payment = event?.payload?.payment?.entity || event?.payload?.refund?.entity || {};
    const eventType = String(event?.event || 'unknown');
    const paymentId = payment.payment_id || payment.id || null;
    const razorpayOrderId = payment.order_id || null;
    const amount = payment.amount != null ? Number(payment.amount) / 100 : null;

    await logPaymentEvent({
      eventType,
      paymentId,
      razorpayOrderId,
      amount,
      payload: event,
    });

    const admin = getSupabaseAdminClient();
    let orders: Array<{ id: string }> = [];
    if (paymentId) {
      const byPayment = await admin.from('orders').select('id').eq('payment_id', paymentId);
      orders = byPayment.data || [];
    }
    if (!orders.length && razorpayOrderId) {
      const byRzp = await admin.from('orders').select('id').eq('razorpay_order_id', razorpayOrderId);
      orders = byRzp.data || [];
    }
    const paymentStatus =
      eventType.includes('failed') ? 'failed' : eventType.includes('refund') ? 'refunded' : 'paid';

    for (const order of orders || []) {
      await safeUpdateOrder(order.id, { payment_status: paymentStatus });
    }

    return NextResponse.json({ ok: true, matched: orders?.length || 0 });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }
}
