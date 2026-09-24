import { apiRequest } from '@/lib/api/browser';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { requestOrderAlert } from '@/lib/orders/alerts';
import {
  fetchOrderById,
  markOutForDelivery,
  updateOrderFields,
  verifyDeliveryOtp,
} from '@/lib/orders/store';
import type { OrderRecord } from '@/lib/orders/types';
import { formatProductLine, generatePickupOtp, jobFromOrder } from './helpers';
import type { DeliveryJob, DeliveryPartner } from './types';

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function mapJob(row: Record<string, any>): DeliveryJob {
  return {
    id: String(row.id),
    orderId: String(row.order_id || ''),
    orderNumber: String(row.order_number || ''),
    sellerId: String(row.seller_id || ''),
    sellerName: String(row.seller_name || ''),
    storePhone: row.store_phone ? String(row.store_phone) : undefined,
    pickAddress: String(row.pick_address || ''),
    pickLocation: row.pick_location || null,
    dropAddress: String(row.drop_address || ''),
    dropLocation: row.drop_location || null,
    customerName: String(row.customer_name || ''),
    customerPhone: String(row.customer_phone || ''),
    items: Array.isArray(row.items) ? row.items : [],
    total: Number(row.total || 0),
    pickupOtp: String(row.pickup_otp || ''),
    pickupVerified: Boolean(row.pickup_verified),
    deliveryPartnerId: row.delivery_partner_id ? String(row.delivery_partner_id) : null,
    deliveryPartnerName: row.delivery_partner_name ? String(row.delivery_partner_name) : null,
    status: row.status || 'available',
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

function db() {
  return getSupabaseBrowserClient();
}

function mapPartner(row: Record<string, any>): DeliveryPartner {
  return {
    id: String(row.id),
    authUserId: row.auth_user_id ? String(row.auth_user_id) : undefined,
    name: String(row.name || 'Delivery partner'),
    phone: row.phone ? String(row.phone) : undefined,
    isOnline: Boolean(row.is_online),
    lastOnlineAt: toDate(row.last_online_at),
  };
}

export async function getDeliveryPartner(_userId?: string): Promise<DeliveryPartner | null> {
  const { partner } = await apiRequest<{ partner: DeliveryPartner | null }>('/api/delivery/me');
  return partner;
}

export async function isDeliveryPartner(userId: string): Promise<boolean> {
  return Boolean(await getDeliveryPartner(userId));
}

export async function setDeliveryPartnerOnline(
  _userId: string,
  isOnline: boolean
): Promise<DeliveryPartner> {
  const { partner } = await apiRequest<{ partner: DeliveryPartner }>('/api/delivery/me', {
    method: 'PATCH',
    body: JSON.stringify({ isOnline }),
  });
  return partner;
}

export async function fetchDeliveryPartners(): Promise<DeliveryPartner[]> {
  const { partners } = await apiRequest<{ partners: DeliveryPartner[] }>('/api/delivery/partners');
  return partners;
}

export async function enableDeliveryPartner(params: {
  userId: string;
  name: string;
  phone?: string;
}): Promise<void> {
  await apiRequest('/api/delivery/partners', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function createPickupJob(order: OrderRecord): Promise<string> {
  if (!order.id) throw new Error('Order id is required');

  const { data: existing, error: existingError } = await db()
    .from('delivery_jobs')
    .select('pickup_otp')
    .eq('order_id', order.id)
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.pickup_otp) return String(existing.pickup_otp);

  const pickupOtp = generatePickupOtp();
  const job = jobFromOrder(order, pickupOtp);

  await updateOrderFields(order.id, { pickupOtp, pickupVerified: false });

  const { error } = await db().from('delivery_jobs').insert({
    order_id: job.orderId,
    order_number: job.orderNumber,
    seller_id: job.sellerId,
    seller_name: job.sellerName,
    store_phone: job.storePhone || null,
    pick_address: job.pickAddress,
    pick_location: job.pickLocation || null,
    drop_address: job.dropAddress,
    drop_location: job.dropLocation || null,
    customer_name: job.customerName,
    customer_phone: job.customerPhone,
    items: job.items,
    total: job.total,
    pickup_otp: pickupOtp,
    pickup_verified: false,
    status: 'available',
  });
  if (error) throw error;

  await requestOrderAlert('pickup_ready', order.id);
  return pickupOtp;
}

export async function fetchDeliveryJobs(partnerId?: string): Promise<DeliveryJob[]> {
  const { data, error } = await db()
    .from('delivery_jobs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const partner = partnerId ? await getDeliveryPartner(partnerId) : null;

  return (data || [])
    .map(mapJob)
    .filter((job) => {
      if (job.status === 'cancelled' || job.status === 'delivered') return false;
      if (!partnerId) return true;
      if (job.deliveryPartnerId === partnerId) return true;
      return job.status === 'available' && Boolean(partner?.isOnline);
    });
}

export async function acceptDeliveryJob(
  jobId: string,
  partnerId: string,
  partnerName: string
): Promise<void> {
  const { data, error } = await db()
    .from('delivery_jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Job not found');
  const job = mapJob(data);
  if (job.status !== 'available') throw new Error('Job is no longer available');

  const partner = await getDeliveryPartner(partnerId);
  if (!partner?.isOnline) {
    throw new Error('Go online to accept deliveries');
  }

  const { data: accepted, error: updateError } = await db()
    .from('delivery_jobs')
    .update({
      status: 'assigned',
      delivery_partner_id: partnerId,
      delivery_partner_name: partnerName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('status', 'available')
    .select('id')
    .maybeSingle();
  if (updateError) throw updateError;
  if (!accepted) {
    throw new Error('This pickup was already accepted by another rider');
  }

  if (job.orderId) {
    await updateOrderFields(job.orderId, {
      deliveryPartnerId: partnerId,
      deliveryPartnerName: partnerName,
    });
    await requestOrderAlert('job_assigned', job.orderId);
  }
}

export async function verifyPickupOtp(jobId: string, enteredOtp: string): Promise<boolean> {
  const { data, error } = await db()
    .from('delivery_jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return false;
  const job = mapJob(data);
  if (!job.pickupOtp || job.pickupOtp !== enteredOtp.trim()) return false;

  const { error: updateError } = await db()
    .from('delivery_jobs')
    .update({
      pickup_verified: true,
      status: 'picked_up',
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);
  if (updateError) throw updateError;

  if (job.orderId) {
    await updateOrderFields(job.orderId, {
      pickupVerified: true,
      pickupVerifiedAt: new Date(),
    });
    const order = await fetchOrderById(job.orderId);
    if (order?.status === 'packed') {
      await markOutForDelivery(job.orderId);
    }
    await requestOrderAlert('picked_up', job.orderId);
  }

  return true;
}

export async function completeDeliveryJob(jobId: string, customerOtp: string): Promise<boolean> {
  const { data, error } = await db()
    .from('delivery_jobs')
    .select('order_id')
    .eq('id', jobId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.order_id) return false;

  const ok = await verifyDeliveryOtp(String(data.order_id), customerOtp);
  if (!ok) return false;

  const { error: updateError } = await db()
    .from('delivery_jobs')
    .update({
      status: 'delivered',
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);
  if (updateError) throw updateError;
  await requestOrderAlert('delivered', String(data.order_id));
  return true;
}

export async function notifySellerListedProducts(order: OrderRecord): Promise<void> {
  if (!order.sellerId || !order.id) return;
  const { error } = await db().from('notifications').insert({
    user_id: order.sellerId,
    type: 'seller_listed_items',
    title: 'Pack these listed products',
    message: `${order.orderNumber}: ${formatProductLine(order.items)}`,
    order_id: order.id,
    order_number: order.orderNumber,
    items: order.items,
    read: false,
  });
  if (error) throw error;
}
