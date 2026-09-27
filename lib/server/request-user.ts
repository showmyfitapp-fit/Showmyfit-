import { NextRequest } from 'next/server';
import { readAccessToken } from '@/lib/server/auth-session';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';

export async function getRequestUser(request: NextRequest) {
  const token = readAccessToken(request);
  if (!token) return null;
  const { data, error } = await getSupabaseAdminClient().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const { data } = await getSupabaseAdminClient()
    .from('admins')
    .select('id')
    .ilike('email', email)
    .limit(1);
  return Boolean(data?.length);
}

export async function findByIdOrAuthUserId(
  table: 'delivery_partners' | 'profiles',
  userId: string,
  columns = '*'
) {
  const db = getSupabaseAdminClient();
  const byId = await db.from(table).select(columns).eq('id', userId).maybeSingle();
  if (byId.data) return byId.data as Record<string, unknown>;

  const byAuth = await db.from(table).select(columns).eq('auth_user_id', userId).maybeSingle();
  if (!byAuth.error && byAuth.data) return byAuth.data as Record<string, unknown>;
  return null;
}

export async function resolveAccountKeys(user: {
  id: string;
  email?: string | null;
}): Promise<string[]> {
  const keys = new Set<string>([user.id]);
  const email = user.email?.trim();
  if (email) {
    keys.add(email);
    keys.add(email.toLowerCase());
  }

  const profile = await findByIdOrAuthUserId('profiles', user.id, 'id, auth_user_id, email');
  if (profile?.id) keys.add(String(profile.id));
  if (profile?.auth_user_id) keys.add(String(profile.auth_user_id));
  if (profile?.email) {
    keys.add(String(profile.email));
    keys.add(String(profile.email).toLowerCase());
  }

  const db = getSupabaseAdminClient();
  const sellerRows: Array<Record<string, unknown>> = [];
  const { data: byUser } = await db.from('sellers').select('id, user_id, email').eq('user_id', user.id);
  if (byUser) sellerRows.push(...byUser);
  if (email) {
    const { data: byEmail } = await db.from('sellers').select('id, user_id, email').ilike('email', email);
    if (byEmail) sellerRows.push(...byEmail);
  }

  sellerRows.forEach((seller) => {
    if (seller.id) keys.add(String(seller.id));
    if (seller.user_id) keys.add(String(seller.user_id));
    if (seller.email) {
      keys.add(String(seller.email));
      keys.add(String(seller.email).toLowerCase());
    }
  });

  return Array.from(keys).filter(Boolean);
}
