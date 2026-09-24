import { NextRequest } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';

export async function getRequestUser(request: NextRequest) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
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
