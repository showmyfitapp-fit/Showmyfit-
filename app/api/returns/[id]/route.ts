import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser, isAdminEmail } from '@/lib/server/request-user';
import { applyVariantStockChange } from '@/lib/products/variants';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';

export const dynamic = 'force-dynamic';

const NEXT: Record<string, string[]> = {
  requested: ['under_review', 'rejected', 'more_info'],
  under_review: ['approved', 'rejected', 'more_info'],
  more_info: ['under_review', 'rejected'],
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
    const body = (await request.json()) as {
      status?: string;
      rejectionReason?: string;
      inspectionOutcome?: string;
      adminNote?: string;
      customerMessage?: string;
    };
    if (!body.status) return NextResponse.json({ error: 'status required' }, { status: 400 });

    const admin = getSupabaseAdminClient();
    const { data: current } = await admin.from('return_requests').select('*').eq('id', id).maybeSingle();
    if (!current) return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    if (!(NEXT[current.status] || []).includes(body.status) && current.status !== body.status) {
      return NextResponse.json({ error: 'Invalid return status change' }, { status: 409 });
    }

    const reviewed = ['approved', 'rejected', 'more_info'].includes(body.status);
    const baseUpdate = {
      status: body.status,
      rejection_reason: body.rejectionReason || current.rejection_reason,
      inspection_outcome: body.inspectionOutcome || current.inspection_outcome,
      updated_at: new Date().toISOString(),
    };
    const extraUpdate = {
      admin_note: body.adminNote ?? current.admin_note,
      customer_message: body.customerMessage ?? current.customer_message,
      ...(reviewed ? { reviewed_by: user.id, reviewed_at: new Date().toISOString() } : {}),
    };
    let { error } = await admin
      .from('return_requests')
      .update({ ...baseUpdate, ...extraUpdate })
      .eq('id', id);
    if (error) {
      ({ error } = await admin.from('return_requests').update(baseUpdate).eq('id', id));
    }
    if (error) throw error;
    if (body.status === 'rejected' && current.order_id) {
      await admin
        .from('orders')
        .update({ status: 'delivered', updated_at: new Date().toISOString() })
        .eq('id', current.order_id)
        .eq('status', 'return_requested');
    }
    if (body.status === 'completed' && current.order_id) {
      const exchanged = Boolean(current.answers?.exchangeSize || current.answers?.exchange);
      await admin
        .from('orders')
        .update({
          status: exchanged ? 'exchanged' : 'returned',
          updated_at: new Date().toISOString(),
        })
        .eq('id', current.order_id);
    }
    if (current.user_id) {
      await admin.from('notifications').insert({
        user_id: current.user_id,
        type: 'return_update',
        title: 'Return update',
        message: `Return for ${current.order_number} is now ${body.status}.`,
        order_id: current.order_id,
        order_number: current.order_number,
      });
    }
    if (body.status === 'completed' && current.product_id) {
      try {
        const { data: product } = await admin
          .from('products')
          .select('id, stock, stock_returned, category_specific_data')
          .eq('id', current.product_id)
          .maybeSingle();
        if (product) {
          const qty = Math.max(1, Number(current.quantity || 1));
          const next = applyVariantStockChange(
            {
              stock: Number(product.stock || 0),
              categorySpecificData: (product.category_specific_data || {}) as Record<string, unknown>,
            },
            current.answers?.size || current.answers?.exchangeSize,
            qty,
            'release'
          );
          await admin
            .from('products')
            .update({
              stock: next.stock,
              category_specific_data: next.categorySpecificData,
              stock_returned: Number(product.stock_returned || 0) + qty,
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
