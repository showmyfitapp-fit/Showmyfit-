import { NextRequest, NextResponse } from 'next/server';
import { DISPATCH_ASSIGN_TIMEOUT_MINUTES } from '@/lib/ops/rules';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (secret && token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - DISPATCH_ASSIGN_TIMEOUT_MINUTES * 60 * 1000).toISOString();
  const admin = getSupabaseAdminClient();
  const { data: stale } = await admin
    .from('delivery_jobs')
    .select('id')
    .eq('status', 'assigned')
    .lt('updated_at', cutoff);

  if (stale?.length) {
    await admin
      .from('delivery_jobs')
      .update({
        status: 'available',
        delivery_partner_id: null,
        delivery_partner_name: null,
        updated_at: new Date().toISOString(),
      })
      .in('id', stale.map((row) => row.id));
  }

  return NextResponse.json({ released: stale?.length || 0 });
}
