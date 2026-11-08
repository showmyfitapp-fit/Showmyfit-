import { NextRequest, NextResponse } from 'next/server';
import { canActorSetStatus, canTransitionOrderStatus } from '@/lib/orders/transitions';
import { normalizeOrderStatus, type OrderStatus } from '@/lib/orders/types';
import { redactOrderForActor, resolveOrderActor } from '@/lib/server/order-access';
import {
  adjustProductStock,
  logOrderEvent,
} from '@/lib/server/order-side-effects';
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
    if (!data) return NextResponse.json({ order: null });
    const actor = await resolveOrderActor(user, data);
    if (!actor) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    return NextResponse.json({ order: redactOrderForActor(data, actor) });
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

    const admin = getSupabaseAdminClient();
    const { data: current, error: loadError } = await admin
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (loadError) throw loadError;
    if (!current) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const actor = await resolveOrderActor(user, current);
    if (!actor) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });

    const fields = { ...body.fields };
    if (actor === 'seller') {
      delete fields.customer_address;
      delete fields.customer_location;
      delete fields.delivery_otp;
      delete fields.delivery_partner_id;
    }
    if (actor === 'customer') {
      delete fields.status;
      delete fields.cancelled_at;
      delete fields.cancel_reason;
    }
    if (
      actor !== 'admin' &&
      ['cancelled', 'rejected'].includes(normalizeOrderStatus(current.status))
    ) {
      return NextResponse.json({ error: 'This order is closed' }, { status: 409 });
    }

    const nextStatus = fields.status ? normalizeOrderStatus(fields.status) : null;
    const currentStatus = normalizeOrderStatus(current.status);
    if (nextStatus) {
      if (!canTransitionOrderStatus(currentStatus, nextStatus)) {
        return NextResponse.json(
          { error: `Cannot change order from ${currentStatus} to ${nextStatus}` },
          { status: 409 }
        );
      }
      if (!canActorSetStatus(actor, currentStatus, nextStatus)) {
        return NextResponse.json({ error: 'This role cannot make that status change' }, { status: 403 });
      }
      fields.status = nextStatus;
    }

    const { error } = await admin
      .from('orders')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;

    if (nextStatus && nextStatus !== currentStatus) {
      await logOrderEvent({
        orderId: id,
        actorId: user.id,
        actorRole: actor,
        source: 'order_patch',
        fromStatus: currentStatus,
        toStatus: nextStatus,
        reason: fields.cancel_reason ? String(fields.cancel_reason) : null,
      });
      if (nextStatus === 'cancelled' || nextStatus === 'rejected') {
        const items = Array.isArray(current.items) ? current.items : [];
        await adjustProductStock(
          items.map((item: any) => ({
            productId: item.productId || item.product_id,
            quantity: item.quantity,
          })),
          'release'
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not update order' },
      { status: 500 }
    );
  }
}
