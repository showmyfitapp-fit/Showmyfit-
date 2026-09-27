import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAnonAuthClient, readAccessToken, requestOrigin } from '@/lib/server/auth-session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      action?: 'reset' | 'update';
      email?: string;
      password?: string;
    };

    if (body.action === 'update') {
      const token = readAccessToken(request);
      if (!token || !body.password) {
        return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
      }
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !anonKey) throw new Error('Supabase public credentials are not configured');
      const client = createClient(url, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      const { error } = await client.auth.updateUser({ password: body.password });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    if (!body.email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    const origin = requestOrigin(request);
    const { error } = await getAnonAuthClient().auth.resetPasswordForEmail(body.email, {
      redirectTo: `${origin}/auth?mode=reset`,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Password request failed' },
      { status: 500 }
    );
  }
}
