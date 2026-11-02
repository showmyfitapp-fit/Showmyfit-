import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser, isAdminEmail, resolveAccountKeys } from '@/lib/server/request-user';
import { adjustProductStock, logOrderEvent } from '@/lib/server/order-side-effects';
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

    const paymentId = body.order.payment_id ? String(body.order.payment_id) : '';
    const admin = getSupabaseAdminClient();
    if (paymentId) {
      const { data: existing } = await admin
        .from('orders')
        .select('id')
        .eq('payment_id', paymentId)
        .eq('seller_id', body.order.seller_id || '')
        .maybeSingle();
      if (existing?.id) {
        return NextResponse.json({ id: existing.id });
      }
    }

    const { data, error } = await admin
      .from('orders')
      .insert({ ...body.order, user_id: body.order.user_id || user.id })
      .select('id')
      .single();
    if (error) throw error;
    const items = Array.isArray(body.order.items) ? body.order.items : [];
    await adjustProductStock(
      items.map((item: any) => ({
        productId: item.productId || item.product_id,
        quantity: item.quantity,
      })),
      'reserve'
    );
    await logOrderEvent({
      orderId: data.id,
      actorId: user.id,
      actorRole: 'customer',
      source: 'checkout',
      toStatus: String(body.order.status || 'placed'),
      reason: String(body.order.payment_method || 'razorpay'),
    });
    return NextResponse.json({ id: data.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not create order' },
      { status: 500 }
    );
  }
}
