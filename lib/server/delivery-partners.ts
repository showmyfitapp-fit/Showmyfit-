import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';
import { findByIdOrAuthUserId } from '@/lib/server/request-user';
import type { DeliveryPartner } from '@/lib/delivery/types';

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function mapPartner(row: Record<string, any>): DeliveryPartner {
  return {
    id: String(row.id),
    authUserId: row.auth_user_id ? String(row.auth_user_id) : undefined,
    name: String(row.name || 'Delivery partner'),
    phone: row.phone ? String(row.phone) : undefined,
    isOnline: Boolean(row.is_online),
    lastOnlineAt: toDate(row.last_online_at),
  };
}

export async function findDeliveryPartner(userId: string): Promise<DeliveryPartner | null> {
  const row = await findByIdOrAuthUserId('delivery_partners', userId);
  return row ? mapPartner(row) : null;
}

export async function setPartnerOnline(userId: string, isOnline: boolean): Promise<DeliveryPartner> {
  const partner = await findDeliveryPartner(userId);
  if (!partner) {
    throw new Error('Your account is not enabled as a delivery partner');
  }

  const { data, error } = await getSupabaseAdminClient()
    .from('delivery_partners')
    .update({
      is_online: isOnline,
      last_online_at: new Date().toISOString(),
    })
    .eq('id', partner.id)
    .select('*')
    .maybeSingle();

  if (error) {
    throw new Error(
      error.message.includes('is_online')
        ? 'Run supabase/delivery-partner-online.sql in Supabase so online status can be saved.'
        : error.message
    );
  }
  if (!data) throw new Error('Could not update online status');
  return mapPartner(data);
}

export async function listDeliveryPartners(): Promise<DeliveryPartner[]> {
  const { data, error } = await getSupabaseAdminClient()
    .from('delivery_partners')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapPartner);
}

export async function upsertDeliveryPartner(params: {
  userId: string;
  name: string;
  phone?: string;
  authUserId?: string;
}): Promise<void> {
  const { error } = await getSupabaseAdminClient().from('delivery_partners').upsert({
    id: params.userId,
    auth_user_id: params.authUserId || params.userId,
    name: params.name,
    phone: params.phone || '',
  });
  if (error) throw error;
}

export async function listOnlinePartnerRows() {
  const query = await getSupabaseAdminClient()
    .from('delivery_partners')
    .select('id, auth_user_id, phone, is_online');
  if (query.error) {
    if (!query.error.message.includes('is_online')) throw query.error;
    return [];
  }
  return (query.data || []).filter((row) => row.is_online === true);
}
