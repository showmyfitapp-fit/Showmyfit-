import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';

export async function logOrderEvent(params: {
  orderId: string;
  actorId?: string | null;
  actorRole?: string;
  source?: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  reason?: string | null;
}) {
  try {
    await getSupabaseAdminClient().from('order_events').insert({
      order_id: params.orderId,
      actor_id: params.actorId || null,
      actor_role: params.actorRole || 'system',
      source: params.source || 'api',
      from_status: params.fromStatus || null,
      to_status: params.toStatus || null,
      reason: params.reason || null,
    });
  } catch (error) {
    console.warn('order_events insert skipped:', error);
  }
}

export async function logPaymentEvent(params: {
  eventType: string;
  paymentId?: string | null;
  razorpayOrderId?: string | null;
  amount?: number | null;
  payload?: Record<string, unknown>;
}) {
  try {
    await getSupabaseAdminClient().from('payment_events').insert({
      event_type: params.eventType,
      payment_id: params.paymentId || null,
      razorpay_order_id: params.razorpayOrderId || null,
      amount: params.amount ?? null,
      payload: params.payload || {},
    });
  } catch (error) {
    console.warn('payment_events insert skipped:', error);
  }
}

export async function adjustProductStock(
  items: Array<{ productId?: string; quantity?: number }>,
  direction: 'reserve' | 'release'
) {
  const admin = getSupabaseAdminClient();
  for (const item of items) {
    if (!item.productId || !item.quantity) continue;
    const delta = direction === 'reserve' ? -Math.abs(item.quantity) : Math.abs(item.quantity);
    try {
      const { data } = await admin
        .from('products')
        .select('id, stock')
        .eq('id', item.productId)
        .maybeSingle();
      if (!data) continue;
      const next = Math.max(0, Number(data.stock || 0) + delta);
      await admin.from('products').update({ stock: next }).eq('id', item.productId);
    } catch (error) {
      console.warn('stock adjust skipped:', item.productId, error);
    }
  }
}

export async function safeUpdateOrder(
  orderId: string,
  fields: Record<string, unknown>
) {
  try {
    await getSupabaseAdminClient()
      .from('orders')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', orderId);
  } catch (error) {
    console.warn('optional order field update skipped:', error);
  }
}

const otpHits = new Map<string, number[]>();

export function allowOtpAttempt(key: string, limit = 8, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const recent = (otpHits.get(key) || []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) return false;
  recent.push(now);
  otpHits.set(key, recent);
  return true;
}
