import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { readAccessToken } from '@/lib/server/auth-session';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const token = readAccessToken(request);
    if (!token) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

    const body = (await request.json()) as { data?: Record<string, unknown> };
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !anonKey) throw new Error('Supabase public credentials are not configured');

    const client = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { error } = await client.auth.updateUser({ data: body.data || {} });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not update auth user' },
      { status: 500 }
    );
  }
}
