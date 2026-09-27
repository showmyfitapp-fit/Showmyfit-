import { NextRequest, NextResponse } from 'next/server';
import { applySessionCookies, getAnonAuthClient, sessionJson } from '@/lib/server/auth-session';
import { ensureProfileRow, updateProfileRow } from '@/lib/server/profile';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      displayName?: string;
      role?: 'user' | 'shop' | 'admin';
      phone?: string;
      address?: string;
    };
    if (!body.email || !body.password || !body.displayName) {
      return NextResponse.json({ error: 'Email, password, and name required' }, { status: 400 });
    }

    const { data, error } = await getAnonAuthClient().auth.signUp({
      email: body.email,
      password: body.password,
      options: { data: { display_name: body.displayName } },
    });
    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message || 'Sign up failed' },
        { status: 400 }
      );
    }

    if (data.session) {
      const profile = await ensureProfileRow(data.user);
      await updateProfileRow(String(profile.id), {
        displayName: body.displayName,
        role: body.role || 'user',
        phone: body.phone || '',
        address: body.address || '',
      });
      const response = NextResponse.json(sessionJson(data.session, data.user));
      return applySessionCookies(response, data.session);
    }

    return NextResponse.json({ user: data.user, access_token: null });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sign up failed' },
      { status: 500 }
    );
  }
}
