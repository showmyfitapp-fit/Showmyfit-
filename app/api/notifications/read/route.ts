import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';
import { getRequestUser } from '@/lib/server/request-user';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { orderId?: string };
    let query = getSupabaseAdminClient()
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    if (body.orderId) query = query.eq('order_id', body.orderId);

    const { error } = await query;
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not mark notifications read' },
      { status: 500 }
    );
  }
}
