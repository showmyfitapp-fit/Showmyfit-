import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/server/request-user';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

    const orderId = request.nextUrl.searchParams.get('orderId');
    let query = getSupabaseAdminClient()
      .from('delivery_jobs')
      .select('*')
      .order('created_at', { ascending: false });
    if (orderId) query = query.eq('order_id', orderId).limit(1);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ jobs: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    const body = (await request.json()) as { job?: Record<string, unknown> };
    if (!body.job) return NextResponse.json({ error: 'job required' }, { status: 400 });

    const { error } = await getSupabaseAdminClient().from('delivery_jobs').insert(body.job);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not create job' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    const body = (await request.json()) as {
      orderId?: string;
      fields?: Record<string, unknown>;
    };
    if (!body.orderId || !body.fields) {
      return NextResponse.json({ error: 'orderId and fields required' }, { status: 400 });
    }

    const { error } = await getSupabaseAdminClient()
      .from('delivery_jobs')
      .update({ ...body.fields, updated_at: new Date().toISOString() })
      .eq('order_id', body.orderId)
      .in('status', ['available', 'assigned', 'picked_up']);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not update jobs' },
      { status: 500 }
    );
  }
}
