import { apiRequest } from '@/lib/api/browser';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { generateDeliveryOtp } from './helpers';
import { requestOrderAlert } from './alerts';
import { CANCELLABLE_ORDER_STATUSES, type OrderRecord, type OrderStatus } from './types';

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function mapOrderRow(row: Record<string, any>): OrderRecord {
  return {
    id: String(row.id),
    orderNumber: String(row.order_number || row.id),
    orderGroupId: String(row.order_group_id || row.id),
    pickupCode: String(row.pickup_code || ''),
    pickupOtp: row.pickup_otp ? String(row.pickup_otp) : null,
    pickupVerified: Boolean(row.pickup_verified),
    deliveryOtp: row.delivery_otp ? String(row.delivery_otp) : null,
    deliveryPartnerId: row.delivery_partner_id ? String(row.delivery_partner_id) : null,
    deliveryPartnerName: row.delivery_partner_name ? String(row.delivery_partner_name) : null,
    userId: String(row.user_id || ''),
    customerName: String(row.customer_name || ''),
    customerEmail: String(row.customer_email || ''),
    customerPhone: String(row.customer_phone || ''),
    customerAddress: row.customer_address ? String(row.customer_address) : undefined,
    sellerId: String(row.seller_id || ''),
    sellerName: String(row.seller_name || ''),
    storeLocation: row.store_location || null,
    storeAddress: row.store_address ? String(row.store_address) : undefined,
    storePhone: row.store_phone ? String(row.store_phone) : undefined,
    items: Array.isArray(row.items) ? row.items : [],
    status: (row.status || 'placed') as OrderStatus,
    paymentStatus: row.payment_status || 'paid',
    paymentMethod: String(row.payment_method || 'razorpay'),
    paymentId: row.payment_id ? String(row.payment_id) : undefined,
    razorpayOrderId: row.razorpay_order_id ? String(row.razorpay_order_id) : undefined,
    subtotal: Number(row.subtotal || 0),
    discount: Number(row.discount || 0),
    shipping: Number(row.shipping || 0),
    total: Number(row.total || 0),
    distanceKm: row.distance_km != null ? Number(row.distance_km) : null,
    etaMinutes: row.eta_minutes != null ? Number(row.eta_minutes) : null,
    customerLocation: row.customer_location || null,
    packByDeadline: toDate(row.pack_by_deadline),
    placedAt: toDate(row.placed_at || row.created_at),
    acceptedAt: toDate(row.accepted_at),
    packedAt: toDate(row.packed_at),
    outForDeliveryAt: toDate(row.out_for_delivery_at),
    deliveredAt: toDate(row.delivered_at),
    cancelledAt: toDate(row.cancelled_at),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

function toOrderInsert(order: Omit<OrderRecord, 'id'>) {
  return {
    order_number: order.orderNumber,
    order_group_id: order.orderGroupId,
    pickup_code: order.pickupCode,
    pickup_otp: order.pickupOtp || null,
    pickup_verified: Boolean(order.pickupVerified),
    delivery_otp: order.deliveryOtp || null,
    delivery_partner_id: order.deliveryPartnerId || null,
    delivery_partner_name: order.deliveryPartnerName || null,
    user_id: order.userId,
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    customer_phone: order.customerPhone,
    customer_address: order.customerAddress || null,
    customer_location: order.customerLocation || null,
    seller_id: order.sellerId,
    seller_name: order.sellerName,
    store_address: order.storeAddress || null,
    store_phone: order.storePhone || null,
    store_location: order.storeLocation || null,
    items: order.items,
    status: order.status,
    payment_status: order.paymentStatus,
    payment_method: order.paymentMethod,
    payment_id: order.paymentId || null,
    razorpay_order_id: order.razorpayOrderId || null,
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    total: order.total,
    distance_km: order.distanceKm ?? null,
    eta_minutes: order.etaMinutes ?? null,
    pack_by_deadline: order.packByDeadline?.toISOString() || null,
    placed_at: order.placedAt?.toISOString() || new Date().toISOString(),
  };
}

const EXTRA_COLUMN: Record<string, string> = {
  deliveryOtp: 'delivery_otp',
  deliveryOtpVerified: 'delivery_otp_verified',
  pickupOtp: 'pickup_otp',
  pickupVerified: 'pickup_verified',
  pickupVerifiedAt: 'pickup_verified_at',
  deliveryPartnerId: 'delivery_partner_id',
  deliveryPartnerName: 'delivery_partner_name',
};

export async function createOrder(order: Omit<OrderRecord, 'id'>): Promise<string> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('orders')
    .insert(toOrderInsert(order))
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function fetchCustomerOrders(userId: string): Promise<OrderRecord[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapOrderRow);
}

export async function fetchSellerOrders(sellerId: string): Promise<OrderRecord[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('orders')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapOrderRow);
}

export async function fetchAllOrders(): Promise<OrderRecord[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapOrderRow);
}

export async function fetchOrderById(orderId: string): Promise<OrderRecord | null> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapOrderRow(data) : null;
}

export async function updateOrderFields(
  orderId: string,
  fields: Record<string, unknown>
): Promise<void> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  for (const [key, value] of Object.entries(fields)) {
    const column = EXTRA_COLUMN[key] || key;
    payload[column] = value instanceof Date ? value.toISOString() : value;
  }

  const { error } = await getSupabaseBrowserClient()
    .from('orders')
    .update(payload)
    .eq('id', orderId);
  if (error) throw error;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  extra: Record<string, unknown> = {}
): Promise<void> {
  const now = new Date().toISOString();
  const timestamps: Record<string, unknown> = {};
  if (status === 'accepted') timestamps.accepted_at = now;
  if (status === 'packed') timestamps.packed_at = now;
  if (status === 'out_for_delivery') timestamps.out_for_delivery_at = now;
  if (status === 'delivered') timestamps.delivered_at = now;
  if (status === 'cancelled') timestamps.cancelled_at = now;

  await updateOrderFields(orderId, { status, ...timestamps, ...extra });
}

export async function markOutForDelivery(orderId: string): Promise<string> {
  const otp = generateDeliveryOtp();
  await updateOrderStatus(orderId, 'out_for_delivery', { deliveryOtp: otp });
  return otp;
}

export async function verifyDeliveryOtp(orderId: string, enteredOtp: string): Promise<boolean> {
  const order = await fetchOrderById(orderId);
  if (order?.status !== 'out_for_delivery') return false;
  if (!order.deliveryPartnerId) return false;
  if (!order.deliveryOtp || order.deliveryOtp !== enteredOtp.trim()) return false;
  await updateOrderStatus(orderId, 'delivered', { deliveryOtpVerified: true });
  return true;
}

export async function cancelOrder(orderId: string, options?: { force?: boolean }): Promise<void> {
  const order = await fetchOrderById(orderId);
  if (!order) throw new Error('Order not found');
  if (order.status === 'cancelled' || order.status === 'delivered') {
    throw new Error('This order can no longer be cancelled');
  }
  if (!options?.force) {
    if (!CANCELLABLE_ORDER_STATUSES.includes(order.status) || order.pickupVerified) {
      throw new Error('Cancel is only available before the rider picks up the order');
    }
  }

  await updateOrderStatus(orderId, 'cancelled');
  const { error } = await getSupabaseBrowserClient()
    .from('delivery_jobs')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', orderId)
    .in('status', ['available', 'assigned', 'picked_up']);
  if (error) throw error;
  await requestOrderAlert('cancelled', orderId);
}

export async function fetchUnreadNotificationCount(_userId?: string): Promise<number> {
  const { count } = await apiRequest<{ count: number }>('/api/notifications?count=1&unread=1');
  return count || 0;
}

export async function markNotificationsRead(_userId?: string, orderId?: string) {
  await apiRequest('/api/notifications/read', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}
