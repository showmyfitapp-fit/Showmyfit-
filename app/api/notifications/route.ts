import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';
import { getRequestUser } from '@/lib/server/request-user';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }

    const unreadOnly = request.nextUrl.searchParams.get('unread') === '1';
    const countOnly = request.nextUrl.searchParams.get('count') === '1';
    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 20), 50);
    const db = getSupabaseAdminClient().from('notifications');

    if (countOnly) {
      let query = db
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (unreadOnly) query = query.eq('read', false);
      const { count, error } = await query;
      if (error) throw error;
      return NextResponse.json({ count: count || 0 });
    }

    let query = db
      .select('id, type, title, message, order_id, read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (unreadOnly) query = query.eq('read', false);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      items: (data || []).map((row) => ({
        id: String(row.id),
        type: row.type ? String(row.type) : undefined,
        title: String(row.title || 'New update'),
        message: String(row.message || ''),
        orderId: row.order_id ? String(row.order_id) : undefined,
        read: Boolean(row.read),
        createdAt: row.created_at ? String(row.created_at) : undefined,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load notifications' },
      { status: 500 }
    );
  }
}
