import { NextRequest, NextResponse } from 'next/server';
import { resolveOrderActor } from '@/lib/server/order-access';
import { getRequestUser } from '@/lib/server/request-user';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    const { id } = await params;
    const admin = getSupabaseAdminClient();
    const { data: order } = await admin.from('orders').select('*').eq('id', id).maybeSingle();
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const actor = await resolveOrderActor(user, order);
    if (!actor) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });

    const { data, error } = await admin
      .from('order_events')
      .select('id, from_status, to_status, actor_role, source, reason, created_at')
      .eq('order_id', id)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ events: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load history' },
      { status: 500 }
    );
  }
}
