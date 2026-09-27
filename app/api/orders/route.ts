import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser, isAdminEmail, resolveAccountKeys } from '@/lib/server/request-user';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

    const scope = request.nextUrl.searchParams.get('scope') || 'mine';
    const admin = await isAdminEmail(user.email);
    let query = getSupabaseAdminClient()
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (scope === 'all' || (admin && (scope === 'seller' || scope === 'mine'))) {
      if (!admin) {
        return NextResponse.json({ error: 'Admin only' }, { status: 403 });
      }
    } else if (scope === 'seller') {
      const keys = await resolveAccountKeys(user);
      query = query.in('seller_id', keys.length ? keys : [user.id]);
    } else {
      const keys = await resolveAccountKeys(user);
      query = query.in('user_id', keys.length ? keys : [user.id]);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ orders: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

    const body = (await request.json()) as { order?: Record<string, unknown> };
    if (!body.order) return NextResponse.json({ error: 'Order is required' }, { status: 400 });

    const { data, error } = await getSupabaseAdminClient()
      .from('orders')
      .insert({ ...body.order, user_id: body.order.user_id || user.id })
      .select('id')
      .single();
    if (error) throw error;
    return NextResponse.json({ id: data.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not create order' },
      { status: 500 }
    );
  }
}
