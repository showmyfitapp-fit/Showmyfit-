import { findDeliveryPartner } from '@/lib/server/delivery-partners';
import { isAdminEmail, resolveAccountKeys } from '@/lib/server/request-user';
import type { OrderActor } from '@/lib/orders/types';
import type { User } from '@supabase/supabase-js';

export async function resolveOrderActor(
  user: User,
  order: { user_id?: string; seller_id?: string; delivery_partner_id?: string | null }
): Promise<OrderActor | null> {
  if (await isAdminEmail(user.email)) return 'admin';
  const keys = await resolveAccountKeys(user);
  if (order.seller_id && keys.includes(String(order.seller_id))) return 'seller';
  if (order.user_id && keys.includes(String(order.user_id))) return 'customer';
  const partner = await findDeliveryPartner(user.id, user.email);
  if (
    partner &&
    (!order.delivery_partner_id ||
      order.delivery_partner_id === partner.id ||
      order.delivery_partner_id === user.id)
  ) {
    return 'rider';
  }
  return null;
}

export function redactOrderForActor(order: Record<string, unknown>, actor: OrderActor | null) {
  const copy = { ...order };
  if (actor === 'seller') {
    delete copy.customer_address;
    delete copy.customer_location;
    delete copy.delivery_otp;
  }
  if (actor === 'customer') {
    delete copy.pickup_code;
    delete copy.pickup_otp;
  }
  return copy;
}

export function redactDeliveryJob(job: Record<string, unknown>) {
  if (String(job.status || '') !== 'available') return job;
  return {
    ...job,
    drop_address: '',
    drop_location: null,
  };
}
