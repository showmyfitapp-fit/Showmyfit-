import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser, isAdminEmail } from '@/lib/server/request-user';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    const admin = await isAdminEmail(user.email);
    let query = getSupabaseAdminClient()
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    if (!admin) query = query.eq('user_id', user.id);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ tickets: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load tickets' },
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
      category?: string;
      message?: string;
    };
    if (!body.message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    const { data, error } = await getSupabaseAdminClient()
      .from('support_tickets')
      .insert({
        order_id: body.orderId || null,
        user_id: user.id,
        category: body.category || 'general',
        message: body.message,
        status: 'open',
      })
      .select('id, status')
      .single();
    if (error) throw error;
    return NextResponse.json({ ticket: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not create ticket' },
      { status: 500 }
    );
  }
}
