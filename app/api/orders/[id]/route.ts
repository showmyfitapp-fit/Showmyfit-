import { NextRequest, NextResponse } from 'next/server';
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
    const { data, error } = await getSupabaseAdminClient()
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ order: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load order' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    const { id } = await params;
    const body = (await request.json()) as { fields?: Record<string, unknown> };
    if (!body.fields) return NextResponse.json({ error: 'fields required' }, { status: 400 });

    const { error } = await getSupabaseAdminClient()
      .from('orders')
      .update({ ...body.fields, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not update order' },
      { status: 500 }
    );
  }
}
