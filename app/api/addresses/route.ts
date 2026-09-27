import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/server/request-user';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';

export const dynamic = 'force-dynamic';

const BASE_COLUMNS =
  'id, label, line1, street, save_as, area, city, receiver_name, receiver_phone, instructions';
const ADDRESS_COLUMNS = `${BASE_COLUMNS}, latitude, longitude, map_address`;

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

    const db = getSupabaseAdminClient();
    const withCoords = await db
      .from('user_addresses')
      .select(ADDRESS_COLUMNS)
      .eq('auth_user_id', user.id)
      .order('created_at', { ascending: false });
    if (!withCoords.error) return NextResponse.json({ rows: withCoords.data || [] });

    const fallback = await db
      .from('user_addresses')
      .select(BASE_COLUMNS)
      .eq('auth_user_id', user.id)
      .order('created_at', { ascending: false });
    if (fallback.error) throw fallback.error;
    return NextResponse.json({ rows: fallback.data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load addresses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    const body = (await request.json()) as { address?: Record<string, unknown>; userId?: string };
    if (!body.address) return NextResponse.json({ error: 'address required' }, { status: 400 });

    const payload = {
      ...body.address,
      auth_user_id: user.id,
      user_id: body.userId || user.id,
      updated_at: new Date().toISOString(),
    };
    const db = getSupabaseAdminClient();
    const withCoords = await db.from('user_addresses').insert(payload).select(ADDRESS_COLUMNS).single();
    if (!withCoords.error) return NextResponse.json({ row: withCoords.data });

    if (!/latitude|longitude|map_address|column/i.test(withCoords.error.message || '')) {
      throw withCoords.error;
    }
    const { latitude: _a, longitude: _b, map_address: _c, ...base } = payload;
    const fallback = await db.from('user_addresses').insert(base).select(BASE_COLUMNS).single();
    if (fallback.error) throw fallback.error;
    return NextResponse.json({ row: fallback.data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not save address' },
      { status: 500 }
    );
  }
}
