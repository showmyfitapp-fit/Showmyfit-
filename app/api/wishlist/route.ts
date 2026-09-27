import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser, resolveAccountKeys } from '@/lib/server/request-user';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    const keys = await resolveAccountKeys(user);
    const { data, error } = await getSupabaseAdminClient()
      .from('wishlists')
      .select('*')
      .in('user_id', keys.length ? keys : [user.id])
      .order('added_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ rows: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load wishlist' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    const body = (await request.json()) as { item?: Record<string, unknown> };
    if (!body.item) return NextResponse.json({ error: 'item required' }, { status: 400 });
    const keys = await resolveAccountKeys(user);
    const requestedUserId = String(body.item.user_id || '');
    const userId = keys.includes(requestedUserId) ? requestedUserId : user.id;
    const { error } = await getSupabaseAdminClient()
      .from('wishlists')
      .insert({ ...body.item, user_id: userId });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not add to wishlist' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const keys = await resolveAccountKeys(user);
    const { error } = await getSupabaseAdminClient()
      .from('wishlists')
      .delete()
      .eq('id', id)
      .in('user_id', keys.length ? keys : [user.id]);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not remove wishlist item' },
      { status: 500 }
    );
  }
}
