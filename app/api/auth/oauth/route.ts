import { NextRequest, NextResponse } from 'next/server';
import {
  applyPkceCookie,
  buildOAuthAuthorizeUrl,
  createPkcePair,
  oauthRedirectOrigin,
} from '@/lib/server/auth-session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { provider?: 'google' | 'facebook'; next?: string };
    const provider = body.provider;
    if (provider !== 'google' && provider !== 'facebook') {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    const origin = oauthRedirectOrigin(request);
    const next = body.next && body.next.startsWith('/') ? body.next : '/profile';
    const { verifier, challenge } = createPkcePair();
    const redirectTo = `${origin}/api/auth/callback?cv=${encodeURIComponent(verifier)}&next=${encodeURIComponent(next)}`;
    const url = buildOAuthAuthorizeUrl(provider, redirectTo, challenge);

    const response = NextResponse.json({ url });
    applyPkceCookie(response, verifier, next);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not start OAuth' },
      { status: 500 }
    );
  }
}
