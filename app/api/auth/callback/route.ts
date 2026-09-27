import { NextRequest, NextResponse } from 'next/server';
import {
  applySessionCookies,
  getPkceAuthClient,
  NEXT_COOKIE,
  requestOrigin,
} from '@/lib/server/auth-session';
import { ensureProfileRow, updateProfileRow } from '@/lib/server/profile';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const origin = requestOrigin(request);
  const nextRaw = request.cookies.get(NEXT_COOKIE)?.value || '/profile';
  const next = nextRaw.startsWith('/') ? nextRaw : '/profile';
  const code = request.nextUrl.searchParams.get('code');
  const errorDescription = request.nextUrl.searchParams.get('error_description');

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(errorDescription || 'OAuth sign in failed')}`
    );
  }

  try {
    const bag: { pkce?: string } = {};
    const { data, error } = await getPkceAuthClient(request, bag).auth.exchangeCodeForSession(code);
    if (error || !data.session || !data.user) {
      throw new Error(error?.message || 'OAuth exchange failed');
    }

    const profile = await ensureProfileRow(data.user);
    await updateProfileRow(String(profile.id), { lastLoginAt: new Date().toISOString() });

    const response = NextResponse.redirect(`${origin}${next}`);
    return applySessionCookies(response, data.session);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OAuth sign in failed';
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(message)}`);
  }
}
