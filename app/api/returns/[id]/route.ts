import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser, isAdminEmail } from '@/lib/server/request-user';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';

export const dynamic = 'force-dynamic';

const NEXT: Record<string, string[]> = {
  requested: ['under_review', 'rejected'],
  under_review: ['approved', 'rejected'],
  approved: ['pickup_scheduled', 'rejected'],
  pickup_scheduled: ['item_received'],
  item_received: ['processing', 'rejected'],
  processing: ['completed'],
  rejected: [],
  completed: [],
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    if (!(await isAdminEmail(user.email))) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }
    const { id } = await params;
    const body = (await request.json()) as { status?: string; rejectionReason?: string };
    if (!body.status) return NextResponse.json({ error: 'status required' }, { status: 400 });

    const admin = getSupabaseAdminClient();
    const { data: current } = await admin.from('return_requests').select('*').eq('id', id).maybeSingle();
    if (!current) return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    if (!(NEXT[current.status] || []).includes(body.status) && current.status !== body.status) {
      return NextResponse.json({ error: 'Invalid return status change' }, { status: 409 });
    }

    const { error } = await admin
      .from('return_requests')
      .update({
        status: body.status,
        rejection_reason: body.rejectionReason || current.rejection_reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
    if (body.status === 'completed' && current.product_id) {
      try {
        const { data: product } = await admin
          .from('products')
          .select('id, stock, stock_returned')
          .eq('id', current.product_id)
          .maybeSingle();
        if (product) {
          await admin
            .from('products')
            .update({
              stock: Number(product.stock || 0) + 1,
              stock_returned: Number(product.stock_returned || 0) + 1,
            })
            .eq('id', current.product_id);
        }
      } catch (ledgerError) {
        console.warn('return stock ledger skipped:', ledgerError);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not update return' },
      { status: 500 }
    );
  }
}
