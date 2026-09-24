import { apiRequest } from '@/lib/api/browser';
import { requestOrderAlert } from '@/lib/orders/alerts';
import {
  fetchOrderById,
  markOutForDelivery,
  updateOrderFields,
  verifyDeliveryOtp,
} from '@/lib/orders/store';
import type { OrderRecord } from '@/lib/orders/types';
import { generatePickupOtp, jobFromOrder } from './helpers';
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

  const { jobs } = await apiRequest<{ jobs: Record<string, any>[] }>(
    `/api/delivery/jobs?orderId=${order.id}`
  );
  if (jobs?.[0]?.pickup_otp) return String(jobs[0].pickup_otp);

  const pickupOtp = generatePickupOtp();
  const job = jobFromOrder(order, pickupOtp);
  await updateOrderFields(order.id, { pickupOtp, pickupVerified: false });
  await apiRequest('/api/delivery/jobs', {
    method: 'POST',
    body: JSON.stringify({
      job: {
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
      },
    }),
  });
  await requestOrderAlert('pickup_ready', order.id);
  return pickupOtp;
}

export async function fetchDeliveryJobs(partnerId?: string): Promise<DeliveryJob[]> {
  const { jobs } = await apiRequest<{ jobs: Record<string, any>[] }>('/api/delivery/jobs');
  const partner = partnerId ? await getDeliveryPartner(partnerId) : null;
  return (jobs || [])
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
  const { job: row } = await apiRequest<{ job: Record<string, any> | null }>(
    `/api/delivery/jobs/${jobId}`
  );
  if (!row) throw new Error('Job not found');
  const job = mapJob(row);
  if (job.status !== 'available') throw new Error('Job is no longer available');

  const partner = await getDeliveryPartner(partnerId);
  if (!partner?.isOnline) throw new Error('Go online to accept deliveries');

  const { job: accepted } = await apiRequest<{ job: { id?: string } | null }>(
    `/api/delivery/jobs/${jobId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        matchStatus: 'available',
        fields: {
          status: 'assigned',
          delivery_partner_id: partnerId,
          delivery_partner_name: partnerName,
        },
      }),
    }
  );
  if (!accepted) throw new Error('This pickup was already accepted by another rider');

  if (job.orderId) {
    await updateOrderFields(job.orderId, {
      deliveryPartnerId: partnerId,
      deliveryPartnerName: partnerName,
    });
    await requestOrderAlert('job_assigned', job.orderId);
  }
}

export async function verifyPickupOtp(jobId: string, enteredOtp: string): Promise<boolean> {
  const { job: row } = await apiRequest<{ job: Record<string, any> | null }>(
    `/api/delivery/jobs/${jobId}`
  );
  if (!row) return false;
  const job = mapJob(row);
  if (!job.pickupOtp || job.pickupOtp !== enteredOtp.trim()) return false;

  await apiRequest(`/api/delivery/jobs/${jobId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      fields: { pickup_verified: true, status: 'picked_up' },
    }),
  });

  if (job.orderId) {
    await updateOrderFields(job.orderId, {
      pickupVerified: true,
      pickupVerifiedAt: new Date(),
    });
    const order = await fetchOrderById(job.orderId);
    if (order?.status === 'packed') await markOutForDelivery(job.orderId);
    await requestOrderAlert('picked_up', job.orderId);
  }
  return true;
}

export async function completeDeliveryJob(jobId: string, customerOtp: string): Promise<boolean> {
  const { job: row } = await apiRequest<{ job: { order_id?: string } | null }>(
    `/api/delivery/jobs/${jobId}`
  );
  if (!row?.order_id) return false;
  const ok = await verifyDeliveryOtp(String(row.order_id), customerOtp);
  if (!ok) return false;
  await apiRequest(`/api/delivery/jobs/${jobId}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields: { status: 'delivered' } }),
  });
  await requestOrderAlert('delivered', String(row.order_id));
  return true;
}
