import { NextRequest, NextResponse } from 'next/server';
import {
  phoneLookupVariants,
  toCanonicalIndiaPhone,
} from '@/lib/auth/phone';
import {
  phonesMatch,
  verifyMsg91AccessToken,
} from '@/lib/msg91/verify-access-token';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

async function findProfileByPhone(phone: string) {
  const admin = getSupabaseAdminClient();
  const variants = phoneLookupVariants(phone);
  if (!variants.length) return null;

  const orFilter = variants.map((variant) => `phone.eq.${variant}`).join(',');
  const { data, error } = await admin
    .from('profiles')
    .select('id, auth_user_id, email, phone')
    .or(orFilter)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function mintSessionForAuthUser(authUserId: string, email?: string | null) {
  const admin = getSupabaseAdminClient();

  let userEmail = email || null;
  if (!userEmail) {
    const { data: userData, error: userError } =
      await admin.auth.admin.getUserById(authUserId);
    if (userError) throw userError;
    userEmail = userData.user?.email || null;
  }

  if (!userEmail) {
    throw new Error(
      'This account has no email on file. Sign in with email or Google instead.'
    );
  }

  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    });

  if (linkError) throw linkError;

  const hashedToken = linkData.properties?.hashed_token;
  if (!hashedToken) {
    throw new Error('Failed to mint a login session');
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase public credentials are not configured');
  }

  const anonClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data: sessionData, error: verifyError } = await anonClient.auth.verifyOtp({
    token_hash: hashedToken,
    type: 'email',
  });

  if (verifyError) throw verifyError;
  if (!sessionData.session) {
    throw new Error('Failed to create a session');
  }

  return {
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phoneInput = String(body?.phone || '');
    const accessToken = String(body?.accessToken || '');

    const phone = toCanonicalIndiaPhone(phoneInput);
    if (!phone) {
      return NextResponse.json(
        { error: 'Enter a valid 10-digit Indian mobile number', code: 'invalid_phone' },
        { status: 400 }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing MSG91 access token', code: 'missing_token' },
        { status: 400 }
      );
    }

    const verified = await verifyMsg91AccessToken(accessToken);
    if (!phonesMatch(phone, verified.phone)) {
      return NextResponse.json(
        { error: 'Phone number does not match the verified OTP session', code: 'phone_mismatch' },
        { status: 401 }
      );
    }

    const profile = await findProfileByPhone(phone);
    if (!profile?.auth_user_id) {
      return NextResponse.json(
        {
          error:
            'No account found for this phone number. Please sign up with email first, then add your phone on your profile.',
          code: 'phone_not_registered',
        },
        { status: 404 }
      );
    }

    const session = await mintSessionForAuthUser(
      profile.auth_user_id,
      profile.email
    );

    return NextResponse.json({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  } catch (error: unknown) {
    console.error('OTP session error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to complete OTP login';
    return NextResponse.json({ error: message, code: 'otp_session_failed' }, { status: 500 });
  }
}
