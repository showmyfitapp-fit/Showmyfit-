import { NextRequest, NextResponse } from 'next/server';
import { applySessionCookies, getAnonAuthClient, sessionJson } from '@/lib/server/auth-session';
import { ensureProfileRow, updateProfileRow } from '@/lib/server/profile';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const { data, error } = await getAnonAuthClient().auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    if (error || !data.session || !data.user) {
      return NextResponse.json(
        { error: error?.message || 'Sign in failed' },
        { status: 401 }
      );
    }

    const profile = await ensureProfileRow(data.user);
    await updateProfileRow(String(profile.id), { lastLoginAt: new Date().toISOString() });

    const response = NextResponse.json(sessionJson(data.session, data.user));
    return applySessionCookies(response, data.session);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sign in failed' },
      { status: 500 }
    );
  }
}
