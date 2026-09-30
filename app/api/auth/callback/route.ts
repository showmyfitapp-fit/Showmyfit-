import { NextRequest, NextResponse } from 'next/server';
import {
  applySessionCookies,
  exchangePkceCode,
  oauthRedirectOrigin,
  readOAuthVerifier,
} from '@/lib/server/auth-session';
import { ensureProfileRow, updateProfileRow } from '@/lib/server/profile';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const origin = oauthRedirectOrigin(request);
  const nextRaw = request.nextUrl.searchParams.get('next') || '/profile';
  const next = nextRaw.startsWith('/') ? nextRaw : '/profile';
  const code = request.nextUrl.searchParams.get('code');
  const errorDescription = request.nextUrl.searchParams.get('error_description');

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(errorDescription || 'OAuth sign in failed')}`
    );
  }

  try {
    const verifier = readOAuthVerifier(request);
    if (!verifier) {
      throw new Error('Sign-in session expired. Please try Google login again.');
    }

    const tokens = await exchangePkceCode(code, verifier);
    let user = tokens.user;
    if (!user) {
      const { getSupabaseAdminClient } = await import('@/lib/supabase/admin-server');
      const { data } = await getSupabaseAdminClient().auth.getUser(tokens.access_token);
      user = data.user || undefined;
    }
    if (!user) throw new Error('Google sign in did not return a user');

    const profile = await ensureProfileRow(user);
    await updateProfileRow(String(profile.id), { lastLoginAt: new Date().toISOString() });

    const response = NextResponse.redirect(`${origin}${next}`);
    return applySessionCookies(response, {
      ...tokens,
      user,
      token_type: tokens.token_type || 'bearer',
      expires_in: tokens.expires_in || 3600,
      expires_at: tokens.expires_at || Math.floor(Date.now() / 1000) + (tokens.expires_in || 3600),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OAuth sign in failed';
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(message)}`);
  }
}
