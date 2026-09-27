import { NextRequest, NextResponse } from 'next/server';
import {
  applyPkceCookie,
  getPkceAuthClient,
  requestOrigin,
} from '@/lib/server/auth-session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { provider?: 'google' | 'facebook'; next?: string };
    const provider = body.provider;
    if (provider !== 'google' && provider !== 'facebook') {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    const origin = requestOrigin(request);
    const next = body.next && body.next.startsWith('/') ? body.next : '/profile';
    const bag: { pkce?: string } = {};
    const { data, error } = await getPkceAuthClient(request, bag).auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/api/auth/callback`,
        skipBrowserRedirect: true,
      },
    });
    if (error || !data.url) {
      return NextResponse.json(
        { error: error?.message || 'Could not start OAuth' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ url: data.url });
    applyPkceCookie(response, bag.pkce || '', next);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not start OAuth' },
      { status: 500 }
    );
  }
}
