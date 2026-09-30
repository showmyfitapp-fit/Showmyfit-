import type { User as SupabaseUser } from '@supabase/supabase-js';
import { apiRequest } from '@/lib/api/browser';
import { dataQuery } from '@/lib/api/data';
import { authRequest, clearCachedAccessToken } from '@/lib/auth/session-client';

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

export function toAppUser(user: SupabaseUser, profile?: UserData | null): AppUser {
  const metadata = user.user_metadata || {};
  const legacyUid = metadata.fbuser?.uid;
  return Object.assign(user, {
    uid: profile?.uid || legacyUid || user.id,
    displayName:
      profile?.displayName || metadata.display_name || metadata.full_name || null,
    photoURL: profile?.profileImage || metadata.avatar_url || null,
    phoneNumber: profile?.phone || user.phone || null,
    emailVerified: Boolean(user.email_confirmed_at),
  });
}

function asUserData(profile: any): UserData {
  return {
    ...profile,
    createdAt: dateValue(profile.createdAt),
    updatedAt: dateValue(profile.updatedAt),
    lastLoginAt: profile.lastLoginAt ? dateValue(profile.lastLoginAt) : undefined,
  };
}

async function fetchProfile(uid?: string, email?: string): Promise<UserData | null> {
  const params = new URLSearchParams();
  if (uid) params.set('uid', uid);
  if (email) params.set('email', email);
  const query = params.toString();
  const { profile } = await apiRequest<{ profile: any | null }>(
    `/api/auth/profile${query ? `?${query}` : ''}`
  );
  return profile ? asUserData(profile) : null;
}

export async function signUp(
  email: string,
  password: string,
  displayName: string,
  role: 'user' | 'shop' | 'admin' = 'user',
  phone?: string,
  address?: string
) {
  return authRequest('/api/auth/sign-up', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName, role, phone, address }),
  });
}

export async function signIn(email: string, password: string) {
  return authRequest('/api/auth/sign-in', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function signInWithGoogle() {
  const { url } = await authRequest<{ url: string }>('/api/auth/oauth', {
    method: 'POST',
    body: JSON.stringify({ provider: 'google', next: '/profile' }),
  });
  if (!url) throw new Error('Could not start Google sign in');
  window.location.assign(url);
  return { url };
}

export async function signInWithFacebook() {
  const { url } = await authRequest<{ url: string }>('/api/auth/oauth', {
    method: 'POST',
    body: JSON.stringify({ provider: 'facebook', next: '/profile' }),
  });
  if (!url) throw new Error('Could not start Facebook sign in');
  window.location.assign(url);
  return { url };
}

/**
 * Complete phone OTP login after the server verified MSG91 and minted tokens.
 * Does not create a profile — the account must already exist.
 */
export async function loginWithPhoneOtpSession(
  accessToken: string,
  refreshToken: string
) {
  const data = await authRequest('/api/auth/session', {
    method: 'POST',
    body: JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken,
    }),
  });
  if (!data.user) throw new Error('OTP login did not return a user session');
  const profile = await getUserData(data.user.id, data.user.email || undefined);
  if (profile) {
    await updateUserData(profile.uid, { lastLoginAt: new Date() });
  }
  return data;
}

export async function signOutUser(): Promise<void> {
  try {
    await authRequest('/api/auth/sign-out', { method: 'POST' });
  } finally {
    clearCachedAccessToken();
  }
}

export async function resetPassword(email: string): Promise<void> {
  await authRequest('/api/auth/password', {
    method: 'POST',
    body: JSON.stringify({ action: 'reset', email }),
  });
}

export async function updatePassword(newPassword: string): Promise<void> {
  await authRequest('/api/auth/password', {
    method: 'POST',
    body: JSON.stringify({ action: 'update', password: newPassword }),
  });
}

export async function listAllAdmins() {
  const data = await dataQuery<any[]>({ table: 'admins', action: 'select' });
  return (data || []).map((row) => ({ id: row.id, data: row }));
}

export async function isAdminEmail(email: string): Promise<boolean> {
  try {
    const data = await dataQuery<any[]>({
      table: 'admins',
      action: 'select',
      columns: 'id',
      filters: [{ op: 'ilike', column: 'email', value: email }],
      limit: 1,
    });
    return Boolean(data?.length);
  } catch {
    return false;
  }
}

export async function getUserData(
  uid: string,
  userEmail?: string
): Promise<UserData | null> {
  return fetchProfile(uid, userEmail);
}

export async function updateUserData(
  uid: string,
  data: Partial<UserData>
): Promise<void> {
  const payload: Record<string, unknown> = { ...data };
  if (data.lastLoginAt instanceof Date) payload.lastLoginAt = data.lastLoginAt.toISOString();
  await apiRequest('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify({ uid, data: payload }),
  });
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
    await authRequest('/api/auth/user', {
      method: 'PATCH',
      body: JSON.stringify({ data: { display_name: profileData.displayName } }),
    });
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

  await dataQuery({ table: 'seller_applications', action: 'insert', data: row });

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
  const data = await dataQuery<any>({
    table: 'seller_applications',
    action: 'select',
    columns: 'status',
    filters: [{ op: 'eq', column: 'user_id', value: uid }],
    order: { column: 'created_at', ascending: false },
    limit: 1,
    maybeSingle: true,
  });
  return data?.status || 'not_applied';
}

export async function approveSellerApplication(
  uid: string,
  applicationId: string,
  approvedBy: string
): Promise<void> {
  const user = await getUserData(uid);
  if (!user?.email) throw new Error('User email not found');
  const now = new Date().toISOString();

  const application = await dataQuery<any>({
    table: 'seller_applications',
    action: 'select',
    filters: [{ op: 'eq', column: 'id', value: applicationId }],
    single: true,
  });

  await dataQuery({
    table: 'sellers',
    action: 'upsert',
    data: {
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
    },
  });

  await dataQuery({
    table: 'seller_applications',
    action: 'update',
    data: { status: 'approved', reviewed_at: now, reviewed_by: approvedBy },
    filters: [{ op: 'eq', column: 'id', value: applicationId }],
  });

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
  const now = new Date().toISOString();
  await dataQuery({
    table: 'seller_applications',
    action: 'update',
    data: {
      status: 'rejected',
      reviewed_at: now,
      reviewed_by: rejectedBy,
      raw: {
        status: 'rejected',
        reviewedAt: now,
        reviewedBy: rejectedBy,
        rejectionReason: reason,
      },
    },
    filters: [{ op: 'eq', column: 'id', value: applicationId }],
  });

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
