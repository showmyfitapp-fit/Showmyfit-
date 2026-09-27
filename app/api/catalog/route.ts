import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const kind = request.nextUrl.searchParams.get('kind') || 'products';
    const sellerId = request.nextUrl.searchParams.get('sellerId');
    const db = getSupabaseAdminClient();

    if (kind === 'sections') {
      const { data, error } = await db
        .from('home_page_sections')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return NextResponse.json({ rows: data || [] });
    }

    if (kind === 'sellers') {
      const { data: sellers, error } = await db.from('sellers').select('*').eq('is_active', true);
      if (error) throw error;
      const userIds = (sellers || []).map((seller) => seller.user_id).filter(Boolean);
      const { data: profiles } = userIds.length
        ? await db.from('profiles').select('*').in('id', userIds)
        : { data: [] };
      return NextResponse.json({ sellers: sellers || [], profiles: profiles || [] });
    }

    let query = db.from('products').select('*').order('created_at', { ascending: false, nullsFirst: false });
    if (sellerId) query = query.eq('seller_user_id', sellerId);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ rows: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load catalog' },
      { status: 500 }
    );
  }
}
