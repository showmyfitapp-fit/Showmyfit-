import { getSupabaseBrowserClient } from '@/lib/supabase/client';
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

export async function isDeliveryPartner(userId: string): Promise<boolean> {
  const { data, error } = await db()
    .from('delivery_partners')
    .select('id')
    .or(`id.eq.${userId},auth_user_id.eq.${userId}`)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function fetchDeliveryPartners(): Promise<DeliveryPartner[]> {
  const { data, error } = await db().from('delivery_partners').select('*');
  if (error) throw error;
  return (data || []).map((row) => ({
    id: String(row.id),
    name: String(row.name || 'Delivery partner'),
    phone: row.phone ? String(row.phone) : undefined,
  }));
}

export async function enableDeliveryPartner(params: {
  userId: string;
  name: string;
  phone?: string;
}): Promise<void> {
  const { data: session } = await db().auth.getUser();
  const { error } = await db().from('delivery_partners').upsert({
    id: params.userId,
    auth_user_id: session.user?.id || params.userId,
    name: params.name,
    phone: params.phone || '',
  });
  if (error) throw error;
}

async function notifyUsers(
  userIds: string[],
  payload: {
    type: string;
    title: string;
    message: string;
    orderId: string;
    orderNumber: string;
    items?: DeliveryJob['items'];
  }
) {
  if (!userIds.length) return;
  const { error } = await db().from('notifications').insert(
    userIds.map((userId) => ({
      user_id: userId,
      read: false,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      order_id: payload.orderId,
      order_number: payload.orderNumber,
      items: payload.items || [],
    }))
  );
  if (error) throw error;
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

  const partners = await fetchDeliveryPartners();
  await notifyUsers(
    partners.map((partner) => partner.id),
    {
      type: 'delivery_pickup',
      title: 'New pickup ready',
      message: `Pickup ${order.sellerName} → drop ${order.customerAddress || 'customer'}. ${formatProductLine(order.items)}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      items: order.items,
    }
  );

  return pickupOtp;
}

export async function fetchDeliveryJobs(partnerId?: string): Promise<DeliveryJob[]> {
  const { data, error } = await db()
    .from('delivery_jobs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data || [])
    .map(mapJob)
    .filter((job) => {
      if (job.status === 'cancelled' || job.status === 'delivered') return false;
      if (!partnerId) return true;
      return job.status === 'available' || job.deliveryPartnerId === partnerId;
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

  const { error: updateError } = await db()
    .from('delivery_jobs')
    .update({
      status: 'assigned',
      delivery_partner_id: partnerId,
      delivery_partner_name: partnerName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);
  if (updateError) throw updateError;

  if (job.orderId) {
    await updateOrderFields(job.orderId, {
      deliveryPartnerId: partnerId,
      deliveryPartnerName: partnerName,
    });
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
