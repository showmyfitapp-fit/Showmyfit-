import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export interface AppUser extends SupabaseUser {
  /** Legacy business/profile id used by migrated foreign keys. */
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  emailVerified: boolean;
}

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'shop' | 'admin';
  phone?: string;
  address?: string;
  profileImage?: string;
  adminEmails?: string[];
  businessName?: string;
  businessType?: string;
  businessDescription?: string;
  businessAddress?: string;
  location?: any;
  stats?: {
    totalProducts?: number;
    totalSales?: number;
    totalOrders?: number;
    rating?: number;
  };
  sellerApplication?: {
    status: 'not_applied' | 'pending' | 'approved' | 'rejected';
    submittedAt?: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
    rejectionReason?: string;
    applicationId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isEmailVerified: boolean;
}

function dateValue(value: unknown): Date {
  if (value instanceof Date) return value;
  const date = value ? new Date(String(value)) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function mapProfile(row: any): UserData {
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
    createdAt: dateValue(row.created_at || raw.createdAt),
    updatedAt: dateValue(row.updated_at || raw.updatedAt),
    lastLoginAt: row.last_login_at
      ? dateValue(row.last_login_at)
      : raw.lastLoginAt
        ? dateValue(raw.lastLoginAt)
        : undefined,
    isEmailVerified: Boolean(
      row.is_email_verified ?? raw.isEmailVerified ?? false
    ),
  };
}

export function toAppUser(user: SupabaseUser, profile?: UserData | null): AppUser {
  const metadata = user.user_metadata || {};
  const firebaseUid = metadata.fbuser?.uid;
  return Object.assign(user, {
    uid: profile?.uid || firebaseUid || user.id,
    displayName:
      profile?.displayName || metadata.display_name || metadata.full_name || null,
    photoURL: profile?.profileImage || metadata.avatar_url || null,
    phoneNumber: profile?.phone || user.phone || null,
    emailVerified: Boolean(user.email_confirmed_at),
  });
}

async function getProfileByAuthId(authUserId: string) {
  const { data, error } = await getSupabaseBrowserClient()
    .from('profiles')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function ensureProfile(user: SupabaseUser): Promise<UserData> {
  let row = await getProfileByAuthId(user.id);
  if (!row) {
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

    const { data, error } = await getSupabaseBrowserClient()
      .from('profiles')
      .insert(newProfile)
      .select('*')
      .single();
    if (error) throw error;
    row = data;
  }

  return mapProfile(row);
}

export async function signUp(
  email: string,
  password: string,
  displayName: string,
  role: 'user' | 'shop' | 'admin' = 'user',
  phone?: string,
  address?: string
) {
  const client = getSupabaseBrowserClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });
  if (error) throw error;
  if (!data.user) throw new Error('Supabase did not create the user.');

  if (data.session) {
    const profile = await ensureProfile(data.user);
    await updateUserData(profile.uid, {
      displayName,
      role,
      phone: phone || '',
      address: address || '',
    });
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const client = getSupabaseBrowserClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  if (data.user) {
    const profile = await ensureProfile(data.user);
    await updateUserData(profile.uid, { lastLoginAt: new Date() });
  }
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await getSupabaseBrowserClient().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/profile` },
  });
  if (error) throw error;
  return data;
}

export async function signInWithFacebook() {
  const { data, error } = await getSupabaseBrowserClient().auth.signInWithOAuth({
    provider: 'facebook',
    options: { redirectTo: `${window.location.origin}/profile` },
  });
  if (error) throw error;
  return data;
}

export async function signOutUser(): Promise<void> {
  const { error } = await getSupabaseBrowserClient().auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string): Promise<void> {
  const { error } = await getSupabaseBrowserClient().auth.resetPasswordForEmail(
    email,
    { redirectTo: `${window.location.origin}/auth?mode=reset` }
  );
  if (error) throw error;
}

export async function listAllAdmins() {
  const { data, error } = await getSupabaseBrowserClient()
    .from('admins')
    .select('*');
  if (error) throw error;
  return (data || []).map((row) => ({ id: row.id, data: row }));
}

export async function isAdminEmail(email: string): Promise<boolean> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('admins')
    .select('id')
    .ilike('email', email)
    .limit(1);
  if (error) return false;
  return Boolean(data?.length);
}

export async function getUserData(
  uid: string,
  userEmail?: string
): Promise<UserData | null> {
  const client = getSupabaseBrowserClient();
  let query = client.from('profiles').select('*');
  query = uid.includes('-') && uid.length === 36
    ? query.or(`id.eq.${uid},auth_user_id.eq.${uid}`)
    : query.eq('id', uid);

  const { data: row, error } = await query.maybeSingle();
  if (error) throw error;
  if (!row) {
    const {
      data: { user },
    } = await client.auth.getUser();
    if (user && user.id === uid) {
      return ensureProfile(user);
    }
    return null;
  }

  const profile = mapProfile(row);
  const email = userEmail || profile.email;

  if (email && (await isAdminEmail(email))) {
    profile.role = 'admin';
  } else {
    const { data: seller } = await client
      .from('sellers')
      .select('id')
      .eq('user_id', profile.uid)
      .eq('is_active', true)
      .maybeSingle();
    if (seller) profile.role = 'shop';
  }

  return profile;
}

export async function updateUserData(
  uid: string,
  data: Partial<UserData>
): Promise<void> {
  const client = getSupabaseBrowserClient();
  const { data: existing, error: readError } = await client
    .from('profiles')
    .select('raw')
    .eq('id', uid)
    .single();
  if (readError) throw readError;

  const rawUpdates: Record<string, unknown> = { ...data };
  for (const [key, value] of Object.entries(rawUpdates)) {
    if (value instanceof Date) rawUpdates[key] = value.toISOString();
  }

  const update: Record<string, unknown> = {
    raw: { ...(existing.raw || {}), ...rawUpdates },
    updated_at: new Date().toISOString(),
  };
  if (data.email !== undefined) update.email = data.email;
  if (data.displayName !== undefined) update.display_name = data.displayName;
  if (data.phone !== undefined) update.phone = data.phone;
  if (data.address !== undefined) update.address = data.address;
  if (data.profileImage !== undefined) update.avatar_url = data.profileImage;
  if (data.role !== undefined) update.role = data.role;
  if (data.isEmailVerified !== undefined) {
    update.is_email_verified = data.isEmailVerified;
  }
  if (data.lastLoginAt !== undefined) {
    update.last_login_at = data.lastLoginAt.toISOString();
  }

  const { error } = await client.from('profiles').update(update).eq('id', uid);
  if (error) throw error;
}

export async function updateUserProfile(
  uid: string,
  profileData: {
    displayName?: string;
    phone?: string;
    address?: string;
    profileImage?: string;
    bannerImage?: string;
    businessName?: string;
    businessType?: string;
    businessDescription?: string;
    businessAddress?: string;
    location?: any;
    instagramUrl?: string;
    facebookUrl?: string;
  }
): Promise<void> {
  await updateUserData(uid, profileData as Partial<UserData>);

  if (profileData.displayName) {
    const { error } = await getSupabaseBrowserClient().auth.updateUser({
      data: { display_name: profileData.displayName },
    });
    if (error) throw error;
  }
}

export async function submitSellerApplication(
  uid: string,
  applicationData: any
): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const row = {
    id,
    user_id: uid,
    business_name: applicationData.businessName || null,
    business_email: applicationData.businessEmail || applicationData.email || null,
    business_phone: applicationData.businessPhone || applicationData.phone || null,
    business_address: applicationData.businessAddress || null,
    business_description: applicationData.businessDescription || null,
    business_type: applicationData.businessType || null,
    categories: applicationData.categories || null,
    documents: applicationData.documents || null,
    location: applicationData.location || null,
    status: 'pending',
    created_at: now,
    updated_at: now,
    raw: {
      ...applicationData,
      userId: uid,
      status: 'pending',
      submittedAt: now,
    },
  };

  const { error } = await getSupabaseBrowserClient()
    .from('seller_applications')
    .insert(row);
  if (error) throw error;

  await updateUserData(uid, {
    sellerApplication: {
      status: 'pending',
      submittedAt: new Date(),
      applicationId: id,
    },
  });
  return id;
}

export async function hasSellerApplication(uid: string): Promise<boolean> {
  return (await getSellerApplicationStatus(uid)) !== 'not_applied';
}

export async function getSellerApplicationStatus(
  uid: string
): Promise<'not_applied' | 'pending' | 'approved' | 'rejected'> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('seller_applications')
    .select('status')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.status || 'not_applied';
}

export async function approveSellerApplication(
  uid: string,
  applicationId: string,
  approvedBy: string
): Promise<void> {
  const client = getSupabaseBrowserClient();
  const user = await getUserData(uid);
  if (!user?.email) throw new Error('User email not found');
  const now = new Date().toISOString();

  const { data: application, error: appReadError } = await client
    .from('seller_applications')
    .select('*')
    .eq('id', applicationId)
    .single();
  if (appReadError) throw appReadError;

  const { error: sellerError } = await client.from('sellers').upsert({
    id: user.email,
    email: user.email,
    user_id: uid,
    application_id: applicationId,
    approved_at: now,
    approved_by: approvedBy,
    is_active: true,
    role: 'seller',
    raw: {
      email: user.email,
      uid,
      applicationId,
      approvedAt: now,
      approvedBy,
      isActive: true,
      role: 'seller',
    },
  });
  if (sellerError) throw sellerError;

  const { error: appError } = await client
    .from('seller_applications')
    .update({ status: 'approved', reviewed_at: now, reviewed_by: approvedBy })
    .eq('id', applicationId);
  if (appError) throw appError;

  await updateUserData(uid, {
    role: 'shop',
    businessName: application.business_name || '',
    businessType: application.business_type || '',
    businessDescription: application.business_description || '',
    businessAddress: application.business_address || '',
    sellerApplication: {
      status: 'approved',
      reviewedAt: new Date(),
      reviewedBy: approvedBy,
      applicationId,
    },
  });
}

export async function rejectSellerApplication(
  uid: string,
  applicationId: string,
  rejectedBy: string,
  reason: string
): Promise<void> {
  const client = getSupabaseBrowserClient();
  const now = new Date().toISOString();
  const { error } = await client
    .from('seller_applications')
    .update({
      status: 'rejected',
      reviewed_at: now,
      reviewed_by: rejectedBy,
      raw: {
        status: 'rejected',
        reviewedAt: now,
        reviewedBy: rejectedBy,
        rejectionReason: reason,
      },
    })
    .eq('id', applicationId);
  if (error) throw error;

  await updateUserData(uid, {
    role: 'user',
    sellerApplication: {
      status: 'rejected',
      reviewedAt: new Date(),
      reviewedBy: rejectedBy,
      rejectionReason: reason,
      applicationId,
    },
  });
}
