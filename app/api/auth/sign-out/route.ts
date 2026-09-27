import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookies, readAccessToken } from '@/lib/server/auth-session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const token = readAccessToken(request);
    if (token) {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          apikey:
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
            '',
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => undefined);
    }
    return clearSessionCookies(NextResponse.json({ ok: true }));
  } catch {
    return clearSessionCookies(NextResponse.json({ ok: true }));
  }
}
