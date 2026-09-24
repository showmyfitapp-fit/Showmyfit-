import { NextRequest, NextResponse } from 'next/server';
import { absoluteUrl } from '@/config/site';
import type { OrderAlertEvent } from '@/lib/orders/alerts';
import { mapOrderRow } from '@/lib/orders/store';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-server';
import type { OrderRecord } from '@/lib/orders/types';

export const dynamic = 'force-dynamic';

const EVENTS: OrderAlertEvent[] = [
  'new_order',
  'pickup_ready',
  'job_assigned',
  'picked_up',
  'cancelled',
  'delivered',
];

type Recipient = {
  userIds: string[];
  phone?: string | null;
  role: 'seller' | 'delivery';
};

function identities(user: { id: string; email?: string | null }) {
  return Array.from(new Set([user.id, user.email?.toLowerCase()].filter(Boolean) as string[]));
}

async function getUserFromRequest(request: NextRequest) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  const { data, error } = await getSupabaseAdminClient().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

async function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const { data } = await getSupabaseAdminClient()
    .from('admins')
    .select('id')
    .ilike('email', email)
    .limit(1);
  return Boolean(data?.length);
}

async function loadOrder(orderId: string): Promise<OrderRecord | null> {
  const { data, error } = await getSupabaseAdminClient()
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();
  if (error || !data) return null;
  return mapOrderRow(data);
}

async function sellerPhones(order: OrderRecord): Promise<string | undefined> {
  if (order.storePhone) return order.storePhone;
  const { data } = await getSupabaseAdminClient()
    .from('profiles')
    .select('phone, raw')
    .or(`id.eq.${order.sellerId},auth_user_id.eq.${order.sellerId}`)
    .maybeSingle();
  const raw = (data?.raw || {}) as Record<string, unknown>;
  return (data?.phone as string | undefined) || (typeof raw.phone === 'string' ? raw.phone : undefined);
}

function partnerUserIds(partner: { id?: string; auth_user_id?: string | null }) {
  return Array.from(
    new Set([partner.id, partner.auth_user_id].filter(Boolean).map(String))
  );
}

function buildMessage(
  event: OrderAlertEvent,
  order: OrderRecord,
  link: string,
  role: Recipient['role'] = 'seller'
) {
  switch (event) {
    case 'new_order':
      return role === 'delivery'
        ? `ShowMyFIT: New order ${order.orderNumber} at ${order.sellerName}. Stay online — pickup appears when the store packs. Open: ${link}`
        : `ShowMyFIT: New order ${order.orderNumber} (₹${order.total}). Pack within 30 minutes. Open: ${link}`;
    case 'pickup_ready':
      return `ShowMyFIT: Pickup ready for ${order.orderNumber} at ${order.sellerName}. Open: ${link}`;
    case 'job_assigned':
      return `ShowMyFIT: A rider accepted ${order.orderNumber} (${order.deliveryPartnerName || 'rider'}). Open: ${link}`;
    case 'picked_up':
      return `ShowMyFIT: ${order.deliveryPartnerName || 'Rider'} picked up ${order.orderNumber}. Open: ${link}`;
    case 'cancelled':
      return `ShowMyFIT: Order ${order.orderNumber} was cancelled. Open: ${link}`;
    case 'delivered':
      return `ShowMyFIT: Order ${order.orderNumber} was delivered. Open: ${link}`;
    default:
      return `ShowMyFIT: Update for ${order.orderNumber}. Open: ${link}`;
  }
}

async function notifyInApp(
  userIds: string[],
  payload: {
    type: string;
    title: string;
    message: string;
    orderId: string;
    orderNumber: string;
    items?: OrderRecord['items'];
  }
) {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  if (!unique.length) return;
  const { error } = await getSupabaseAdminClient().from('notifications').insert(
    unique.map((userId) => ({
      user_id: userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      order_id: payload.orderId,
      order_number: payload.orderNumber,
      items: payload.items || [],
      read: false,
    }))
  );
  if (error) console.warn('In-app notification insert failed:', error.message);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }

    const body = (await request.json()) as { event?: OrderAlertEvent; orderId?: string };
    if (!body.event || !EVENTS.includes(body.event) || !body.orderId) {
      return NextResponse.json({ error: 'Invalid alert request' }, { status: 400 });
    }

    const order = await loadOrder(body.orderId);
    if (!order?.id) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const keys = identities(user);
    const admin = await isAdminEmail(user.email);
    const { data: profile } = await getSupabaseAdminClient()
      .from('profiles')
      .select('id, auth_user_id')
      .or(`id.eq.${user.id},auth_user_id.eq.${user.id}`)
      .maybeSingle();
    if (profile?.id) keys.push(String(profile.id));
    if (profile?.auth_user_id) keys.push(String(profile.auth_user_id));

    const isSeller = keys.includes(order.sellerId);
    const isCustomer = keys.includes(order.userId);
    const isAssignedRider = Boolean(
      order.deliveryPartnerId && keys.includes(order.deliveryPartnerId)
    );
    const { data: partnerRow } = await getSupabaseAdminClient()
      .from('delivery_partners')
      .select('id, auth_user_id')
      .or(`id.eq.${user.id},auth_user_id.eq.${user.id}`)
      .maybeSingle();
    const isPartner = Boolean(partnerRow);

    const allowed =
      admin ||
      (body.event === 'new_order' && isCustomer) ||
      (body.event === 'pickup_ready' && isSeller) ||
      (body.event === 'job_assigned' && (isAssignedRider || isPartner)) ||
      (body.event === 'picked_up' && (isAssignedRider || isPartner)) ||
      (body.event === 'cancelled' && (isSeller || isCustomer || isAssignedRider)) ||
      (body.event === 'delivered' && (isAssignedRider || isPartner));

    if (!allowed) {
      return NextResponse.json({ error: 'Not allowed to send this alert' }, { status: 403 });
    }

    const sellerLink = absoluteUrl(`/seller/orders?order=${order.id}`);
    const deliveryLink = absoluteUrl(`/delivery?order=${order.id}`);
    const recipients: Recipient[] = [];

    if (body.event === 'new_order' || body.event === 'job_assigned' || body.event === 'picked_up' || body.event === 'delivered') {
      recipients.push({
        userIds: [order.sellerId],
        phone: await sellerPhones(order),
        role: 'seller',
      });
    }

    if (body.event === 'new_order' || body.event === 'pickup_ready') {
      const { data: partners } = await getSupabaseAdminClient()
        .from('delivery_partners')
        .select('id, auth_user_id, phone, is_online')
        .eq('is_online', true);
      (partners || []).forEach((partner) => {
        recipients.push({
          userIds: partnerUserIds(partner),
          phone: partner.phone,
          role: 'delivery',
        });
      });
    }

    if (body.event === 'cancelled') {
      recipients.push({
        userIds: [order.sellerId],
        phone: await sellerPhones(order),
        role: 'seller',
      });
      if (order.deliveryPartnerId) {
        const { data: assigned } = await getSupabaseAdminClient()
          .from('delivery_partners')
          .select('id, auth_user_id, phone')
          .or(`id.eq.${order.deliveryPartnerId},auth_user_id.eq.${order.deliveryPartnerId}`)
          .maybeSingle();
        recipients.push({
          userIds: assigned ? partnerUserIds(assigned) : [order.deliveryPartnerId],
          phone: assigned?.phone,
          role: 'delivery',
        });
      }
    }

    const titles: Record<OrderAlertEvent, string> = {
      new_order: 'New order received',
      pickup_ready: 'New pickup ready',
      job_assigned: 'Rider assigned',
      picked_up: 'Order picked up',
      cancelled: 'Order cancelled',
      delivered: 'Order delivered',
    };

    await Promise.all(
      recipients.map(async (recipient) => {
        const link = recipient.role === 'delivery' ? deliveryLink : sellerLink;
        const message = buildMessage(body.event!, order, link, recipient.role);
        const skipSellerInApp = body.event === 'new_order' && recipient.role === 'seller';
        if (!skipSellerInApp) {
          await notifyInApp(recipient.userIds, {
            type: recipient.role === 'delivery' && body.event === 'new_order'
              ? 'new_order_delivery'
              : body.event!,
            title: recipient.role === 'delivery' && body.event === 'new_order'
              ? 'New order nearby'
              : titles[body.event!],
            message,
            orderId: order.id!,
            orderNumber: order.orderNumber,
            items: order.items,
          });
        }
      })
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Order alert error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not send alerts' },
      { status: 500 }
    );
  }
}
