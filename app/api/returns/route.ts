import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser, isAdminEmail, resolveAccountKeys } from '@/lib/server/request-user';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';

export const dynamic = 'force-dynamic';

const RETURN_WINDOW_DAYS = 7;

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    const admin = await isAdminEmail(user.email);
    const scope = request.nextUrl.searchParams.get('scope') || 'mine';
    let query = getSupabaseAdminClient()
      .from('return_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (scope === 'all') {
      if (!admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    } else if (scope === 'seller') {
      const keys = await resolveAccountKeys(user);
      query = query.in('seller_id', keys.length ? keys : [user.id]);
    } else {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ returns: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load returns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    const body = (await request.json()) as {
      orderId?: string;
      productId?: string;
      productName?: string;
      answers?: Record<string, string>;
      images?: string[];
    };
    if (!body.orderId || !body.answers?.reason) {
      return NextResponse.json({ error: 'Order and return reason are required' }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    const { data: order } = await admin.from('orders').select('*').eq('id', body.orderId).maybeSingle();
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.status !== 'delivered') {
      return NextResponse.json({ error: 'Only delivered items can be returned' }, { status: 400 });
    }

    const deliveredAt = order.delivered_at ? new Date(order.delivered_at) : null;
    if (deliveredAt) {
      const elapsed = Date.now() - deliveredAt.getTime();
      if (elapsed > RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000) {
        return NextResponse.json({ error: `Return window is ${RETURN_WINDOW_DAYS} days` }, { status: 400 });
      }
    }

    const { data, error } = await admin
      .from('return_requests')
      .insert({
        order_id: body.orderId,
        order_number: order.order_number,
        product_id: body.productId || null,
        product_name: body.productName || null,
        user_id: user.id,
        seller_id: order.seller_id,
        status: 'requested',
        answers: body.answers,
        images: body.images || [],
      })
      .select('id, status')
      .single();
    if (error) throw error;

    await admin.from('notifications').insert({
      user_id: order.seller_id,
      type: 'return_requested',
      title: 'Return requested',
      message: `Return requested for ${order.order_number}`,
      order_id: body.orderId,
      order_number: order.order_number,
    });

    return NextResponse.json({ returnRequest: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not create return' },
      { status: 500 }
    );
  }
}
