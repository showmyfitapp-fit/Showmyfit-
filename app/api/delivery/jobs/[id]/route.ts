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
      .from('delivery_jobs')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ job: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load job' },
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
    const body = (await request.json()) as {
      fields?: Record<string, unknown>;
      matchStatus?: string;
    };
    if (!body.fields) return NextResponse.json({ error: 'fields required' }, { status: 400 });

    let query = getSupabaseAdminClient()
      .from('delivery_jobs')
      .update({ ...body.fields, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (body.matchStatus) query = query.eq('status', body.matchStatus);

    const { data, error } = await query.select('id').maybeSingle();
    if (error) throw error;
    return NextResponse.json({ job: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not update job' },
      { status: 500 }
    );
  }
}
