import { NextRequest, NextResponse } from 'next/server';
import {
  applyProfileRoles,
  ensureProfileRow,
  loadProfileRow,
  mapProfile,
  updateProfileRow,
} from '@/lib/server/profile';
import { getRequestUser, isAdminEmail } from '@/lib/server/request-user';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

    const uid = request.nextUrl.searchParams.get('uid') || user.id;
    const admin = await isAdminEmail(user.email);
    const own = await ensureProfileRow(user);
    const ownsRequested =
      uid === user.id ||
      uid === user.email ||
      uid === own.id ||
      uid === own.auth_user_id;

    let row = ownsRequested ? own : admin ? await loadProfileRow(uid) : null;
    if (!ownsRequested && !admin) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }
    if (!row) return NextResponse.json({ profile: null });

    const profile = await applyProfileRoles(
      mapProfile(row),
      request.nextUrl.searchParams.get('email') || (row.email as string) || user.email
    );
    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

    const body = (await request.json()) as { uid?: string; data?: Record<string, unknown> };
    const uid = body.uid || user.id;
    const admin = await isAdminEmail(user.email);
    const own = await ensureProfileRow(user);
    const ownsRequested =
      uid === user.id || uid === user.email || uid === own.id || uid === own.auth_user_id;
    if (!ownsRequested && !admin) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    }
    if (!body.data) return NextResponse.json({ error: 'data required' }, { status: 400 });

    await updateProfileRow(uid, body.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not update profile' },
      { status: 500 }
    );
  }
}
