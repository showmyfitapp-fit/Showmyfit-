import { absoluteUrl } from '@/config/site';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export type OrderAlertEvent =
  | 'new_order'
  | 'pickup_ready'
  | 'job_assigned'
  | 'picked_up'
  | 'cancelled'
  | 'delivered';

type Role = 'seller' | 'delivery';

function uniqueIds(ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
}

function messageFor(
  event: OrderAlertEvent,
  role: Role,
  order: {
    orderNumber: string;
    sellerName: string;
    total: number;
    deliveryPartnerName?: string | null;
  },
  link: string
) {
  if (event === 'new_order' && role === 'delivery') {
    return `New order ${order.orderNumber} at ${order.sellerName}. Pickup appears when the store packs. ${link}`;
  }
  if (event === 'new_order') {
    return `${order.orderNumber} for ₹${order.total.toLocaleString()}. Pack within 30 minutes. ${link}`;
  }
  if (event === 'pickup_ready') {
    return `Pickup ready for ${order.orderNumber} at ${order.sellerName}. ${link}`;
  }
  if (event === 'job_assigned') {
    return `${order.deliveryPartnerName || 'A rider'} accepted ${order.orderNumber}. ${link}`;
  }
  if (event === 'picked_up') {
    return `${order.deliveryPartnerName || 'Rider'} picked up ${order.orderNumber}. ${link}`;
  }
  if (event === 'cancelled') {
    return `Order ${order.orderNumber} was cancelled. ${link}`;
  }
  if (event === 'delivered') {
    return `Order ${order.orderNumber} was delivered. ${link}`;
  }
  return `Update for ${order.orderNumber}. ${link}`;
}

async function resolveSellerUserIds(sellerId: string) {
  const ids = [sellerId];
  const { data } = await getSupabaseBrowserClient()
    .from('profiles')
    .select('id, auth_user_id')
    .or(`id.eq.${sellerId},auth_user_id.eq.${sellerId}`)
    .maybeSingle();
  if (data?.id) ids.push(String(data.id));
  if (data?.auth_user_id) ids.push(String(data.auth_user_id));
  return uniqueIds(ids);
}

async function resolveOnlinePartnerUserIds() {
  const { data, error } = await getSupabaseBrowserClient()
    .from('delivery_partners')
    .select('id, auth_user_id')
    .eq('is_online', true);
  if (error) {
    console.warn('Could not load online riders for alerts:', error.message);
    return [];
  }
  return uniqueIds(
    (data || []).flatMap((partner) => [partner.id, partner.auth_user_id])
  );
}

async function insertNotifications(
  userIds: string[],
  payload: {
    type: string;
    title: string;
    message: string;
    orderId: string;
    orderNumber: string;
    items?: unknown[];
  }
) {
  const ids = uniqueIds(userIds);
  if (!ids.length) return;
  const { error } = await getSupabaseBrowserClient().from('notifications').insert(
    ids.map((userId) => ({
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
  if (error) {
    console.warn('In-app notification insert failed:', error.message);
  }
}

async function insertInAppOrderAlerts(event: OrderAlertEvent, orderId: string) {
  const { data, error } = await getSupabaseBrowserClient()
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();
  if (error || !data) {
    console.warn('Could not load order for in-app alert:', error?.message || 'missing order');
    return;
  }

  const order = {
    id: String(data.id),
    orderNumber: String(data.order_number || data.id),
    sellerId: String(data.seller_id || ''),
    sellerName: String(data.seller_name || 'Store'),
    total: Number(data.total || 0),
    deliveryPartnerId: data.delivery_partner_id ? String(data.delivery_partner_id) : null,
    deliveryPartnerName: data.delivery_partner_name ? String(data.delivery_partner_name) : null,
    items: Array.isArray(data.items) ? data.items : [],
  };

  const sellerLink = absoluteUrl(`/seller/orders?order=${order.id}`);
  const deliveryLink = absoluteUrl(`/delivery?order=${order.id}`);
  const sellerIds = await resolveSellerUserIds(order.sellerId);
  const riderIds = await resolveOnlinePartnerUserIds();

  const titles: Record<OrderAlertEvent, string> = {
    new_order: 'New order received',
    pickup_ready: 'New pickup ready',
    job_assigned: 'Rider assigned',
    picked_up: 'Order picked up',
    cancelled: 'Order cancelled',
    delivered: 'Order delivered',
  };

  if (event === 'new_order') {
    await insertNotifications(sellerIds, {
      type: 'new_order',
      title: titles.new_order,
      message: messageFor(event, 'seller', order, sellerLink),
      orderId: order.id,
      orderNumber: order.orderNumber,
      items: order.items,
    });
    await insertNotifications(riderIds, {
      type: 'new_order_delivery',
      title: 'New order nearby',
      message: messageFor(event, 'delivery', order, deliveryLink),
      orderId: order.id,
      orderNumber: order.orderNumber,
      items: order.items,
    });
    return;
  }

  if (event === 'pickup_ready') {
    await insertNotifications(riderIds, {
      type: 'pickup_ready',
      title: titles.pickup_ready,
      message: messageFor(event, 'delivery', order, deliveryLink),
      orderId: order.id,
      orderNumber: order.orderNumber,
      items: order.items,
    });
    return;
  }

  if (event === 'job_assigned' || event === 'picked_up' || event === 'delivered') {
    await insertNotifications(sellerIds, {
      type: event,
      title: titles[event],
      message: messageFor(event, 'seller', order, sellerLink),
      orderId: order.id,
      orderNumber: order.orderNumber,
      items: order.items,
    });
    return;
  }

  if (event === 'cancelled') {
    await insertNotifications(sellerIds, {
      type: 'cancelled',
      title: titles.cancelled,
      message: messageFor(event, 'seller', order, sellerLink),
      orderId: order.id,
      orderNumber: order.orderNumber,
      items: order.items,
    });
    if (order.deliveryPartnerId) {
      const { data: assigned } = await getSupabaseBrowserClient()
        .from('delivery_partners')
        .select('id, auth_user_id')
        .or(`id.eq.${order.deliveryPartnerId},auth_user_id.eq.${order.deliveryPartnerId}`)
        .maybeSingle();
      await insertNotifications(
        uniqueIds([order.deliveryPartnerId, assigned?.id, assigned?.auth_user_id]),
        {
          type: 'cancelled',
          title: titles.cancelled,
          message: messageFor(event, 'delivery', order, deliveryLink),
          orderId: order.id,
          orderNumber: order.orderNumber,
          items: order.items,
        }
      );
    }
  }
}

export async function requestOrderAlert(event: OrderAlertEvent, orderId: string): Promise<void> {
  if (!orderId) return;
  try {
    await insertInAppOrderAlerts(event, orderId);
  } catch (error) {
    console.warn('In-app order alert failed:', error);
  }
}
