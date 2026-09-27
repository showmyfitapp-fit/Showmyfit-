import { NextRequest, NextResponse } from 'next/server';
import {
  applySessionCookies,
  clearSessionCookies,
  getAnonAuthClient,
  loadOrRefreshSession,
  sessionJson,
} from '@/lib/server/auth-session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const current = await loadOrRefreshSession(request);
    if (!current) {
      return NextResponse.json({ user: null, access_token: null });
    }

    const response = NextResponse.json({
      user: current.user,
      access_token: current.access_token,
      expires_at: current.expires_at,
    });
    if (current.refreshed && current.session) applySessionCookies(response, current.session);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load session' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      access_token?: string;
      refresh_token?: string;
    };
    if (!body.access_token || !body.refresh_token) {
      return NextResponse.json({ error: 'Session tokens required' }, { status: 400 });
    }

    const { data, error } = await getAnonAuthClient().auth.setSession({
      access_token: body.access_token,
      refresh_token: body.refresh_token,
    });
    if (error || !data.session) {
      return NextResponse.json(
        { error: error?.message || 'Could not apply session' },
        { status: 401 }
      );
    }

    const response = NextResponse.json(sessionJson(data.session, data.user));
    return applySessionCookies(response, data.session);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not apply session' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  return clearSessionCookies(NextResponse.json({ ok: true }));
}
