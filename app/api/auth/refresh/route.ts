import { NextRequest, NextResponse } from 'next/server';
import {
  applySessionCookies,
  loadOrRefreshSession,
} from '@/lib/server/auth-session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const current = await loadOrRefreshSession(request);
    if (!current) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
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
      { error: error instanceof Error ? error.message : 'Refresh failed' },
      { status: 500 }
    );
  }
}
