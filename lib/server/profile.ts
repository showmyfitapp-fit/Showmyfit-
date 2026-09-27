import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';
import { findByIdOrAuthUserId } from './request-user';

export function mapProfile(row: any) {
  const raw = row.raw || {};
  return {
    ...raw,
    uid: row.id,
    email: row.email || raw.email || '',
    displayName: row.display_name || raw.displayName || '',
    role: row.role || raw.role || 'user',
    phone: row.phone || raw.phone || '',
    address: row.address || raw.address || '',
    profileImage: row.avatar_path || row.avatar_url || raw.profileImage || '',
    createdAt: row.created_at || raw.createdAt,
    updatedAt: row.updated_at || raw.updatedAt,
    lastLoginAt: row.last_login_at || raw.lastLoginAt,
    isEmailVerified: Boolean(row.is_email_verified ?? raw.isEmailVerified ?? false),
  };
}

export async function loadProfileRow(uid: string) {
  return findByIdOrAuthUserId('profiles', uid);
}

export async function ensureProfileRow(user: {
  id: string;
  email?: string | null;
  phone?: string | null;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, any>;
}) {
  let row = await loadProfileRow(user.id);
  if (row) return row;

  const metadata = user.user_metadata || {};
  const profileId = metadata.fbuser?.uid || user.id;
  const now = new Date().toISOString();
  const newProfile = {
    id: profileId,
    auth_user_id: user.id,
    email: user.email || '',
    display_name: metadata.display_name || metadata.full_name || 'User',
    avatar_url: metadata.avatar_url || null,
    phone: user.phone || '',
    role: 'user',
    is_email_verified: Boolean(user.email_confirmed_at),
    created_at: now,
    updated_at: now,
    last_login_at: now,
    raw: {
      uid: profileId,
      email: user.email || '',
      displayName: metadata.display_name || metadata.full_name || 'User',
      role: 'user',
    },
  };

  const { data, error } = await getSupabaseAdminClient()
    .from('profiles')
    .insert(newProfile)
    .select('*')
    .single();
  if (error) throw error;
  return data as Record<string, unknown>;
}

export async function applyProfileRoles(profile: ReturnType<typeof mapProfile>, email?: string) {
  const db = getSupabaseAdminClient();
  if (email) {
    const { data: admin } = await db.from('admins').select('id').ilike('email', email).limit(1);
    if (admin?.length) {
      profile.role = 'admin';
      return profile;
    }
  }
  const { data: seller } = await db
    .from('sellers')
    .select('id')
    .eq('user_id', profile.uid)
    .eq('is_active', true)
    .maybeSingle();
  if (seller) profile.role = 'shop';
  return profile;
}

export async function updateProfileRow(uid: string, data: Record<string, any>) {
  const existing = await loadProfileRow(uid);
  if (!existing) throw new Error('Profile not found');

  const rawUpdates: Record<string, unknown> = { ...data };
  for (const [key, value] of Object.entries(rawUpdates)) {
    if (value instanceof Date) rawUpdates[key] = value.toISOString();
  }

  const update: Record<string, unknown> = {
    raw: { ...((existing.raw as Record<string, unknown>) || {}), ...rawUpdates },
    updated_at: new Date().toISOString(),
  };
  if (data.email !== undefined) update.email = data.email;
  if (data.displayName !== undefined) update.display_name = data.displayName;
  if (data.phone !== undefined) update.phone = data.phone;
  if (data.address !== undefined) update.address = data.address;
  if (data.profileImage !== undefined) update.avatar_url = data.profileImage;
  if (data.role !== undefined) update.role = data.role;
  if (data.isEmailVerified !== undefined) update.is_email_verified = data.isEmailVerified;
  if (data.lastLoginAt !== undefined) {
    update.last_login_at =
      data.lastLoginAt instanceof Date ? data.lastLoginAt.toISOString() : data.lastLoginAt;
  }

  const { error } = await getSupabaseAdminClient().from('profiles').update(update).eq('id', existing.id);
  if (error) throw error;
}
