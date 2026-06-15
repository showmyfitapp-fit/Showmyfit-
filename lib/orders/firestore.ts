import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { generateDeliveryOtp } from './helpers';
import type { OrderRecord, OrderStatus } from './types';

function mapOrderDoc(id: string, data: Record<string, unknown>): OrderRecord {
  const toDate = (value: unknown) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof (value as Timestamp).toDate === 'function') {
      return (value as Timestamp).toDate();
    }
    return new Date(String(value));
  };

  return {
    id,
    orderNumber: String(data.orderNumber || id),
    orderGroupId: String(data.orderGroupId || id),
    pickupCode: String(data.pickupCode || ''),
    deliveryOtp: data.deliveryOtp ? String(data.deliveryOtp) : null,
    userId: String(data.userId || ''),
    customerName: String(data.customerName || ''),
    customerEmail: String(data.customerEmail || ''),
    customerPhone: String(data.customerPhone || ''),
    customerAddress: data.customerAddress ? String(data.customerAddress) : undefined,
    sellerId: String(data.sellerId || ''),
    sellerName: String(data.sellerName || ''),
    storeLocation: (data.storeLocation as OrderRecord['storeLocation']) || null,
    storeAddress: data.storeAddress ? String(data.storeAddress) : undefined,
    storePhone: data.storePhone ? String(data.storePhone) : undefined,
    items: Array.isArray(data.items) ? (data.items as OrderRecord['items']) : [],
    status: (data.status || data.orderStatus || 'placed') as OrderStatus,
    paymentStatus: (data.paymentStatus || 'paid') as OrderRecord['paymentStatus'],
    paymentMethod: String(data.paymentMethod || 'razorpay'),
    paymentId: data.paymentId ? String(data.paymentId) : undefined,
    razorpayOrderId: data.razorpayOrderId ? String(data.razorpayOrderId) : undefined,
    subtotal: Number(data.subtotal || 0),
    discount: Number(data.discount || 0),
    shipping: Number(data.shipping || 0),
    total: Number(data.total || 0),
    distanceKm: data.distanceKm != null ? Number(data.distanceKm) : null,
    etaMinutes: data.etaMinutes != null ? Number(data.etaMinutes) : null,
    customerLocation: (data.customerLocation as OrderRecord['customerLocation']) || null,
    packByDeadline: toDate(data.packByDeadline),
    placedAt: toDate(data.placedAt || data.createdAt),
    acceptedAt: toDate(data.acceptedAt),
    packedAt: toDate(data.packedAt),
    outForDeliveryAt: toDate(data.outForDeliveryAt),
    deliveredAt: toDate(data.deliveredAt),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function createOrder(order: Omit<OrderRecord, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'orders'), {
    ...order,
    packByDeadline: order.packByDeadline || null,
    placedAt: order.placedAt || serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function fetchCustomerOrders(userId: string): Promise<OrderRecord[]> {
  const snapshot = await getDocs(
    query(collection(db, 'orders'), where('userId', '==', userId), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((entry) => mapOrderDoc(entry.id, entry.data()));
}

export async function fetchSellerOrders(sellerId: string): Promise<OrderRecord[]> {
  const snapshot = await getDocs(
    query(collection(db, 'orders'), where('sellerId', '==', sellerId), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((entry) => mapOrderDoc(entry.id, entry.data()));
}

export async function fetchAllOrders(): Promise<OrderRecord[]> {
  const snapshot = await getDocs(
    query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((entry) => mapOrderDoc(entry.id, entry.data()));
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  extra: Record<string, unknown> = {}
): Promise<void> {
  const timestamps: Record<string, unknown> = { updatedAt: serverTimestamp() };

  if (status === 'accepted') timestamps.acceptedAt = serverTimestamp();
  if (status === 'packed') timestamps.packedAt = serverTimestamp();
  if (status === 'out_for_delivery') timestamps.outForDeliveryAt = serverTimestamp();
  if (status === 'delivered') timestamps.deliveredAt = serverTimestamp();

  await updateDoc(doc(db, 'orders', orderId), {
    status,
    ...timestamps,
    ...extra,
  });
}

export async function markOutForDelivery(orderId: string): Promise<string> {
  const otp = generateDeliveryOtp();
  await updateOrderStatus(orderId, 'out_for_delivery', { deliveryOtp: otp });
  return otp;
}

export async function verifyDeliveryOtp(orderId: string, enteredOtp: string): Promise<boolean> {
  const snapshot = await getDoc(doc(db, 'orders', orderId));
  if (!snapshot.exists()) return false;
  const stored = String(snapshot.data().deliveryOtp || '');
  if (!stored || stored !== enteredOtp.trim()) return false;
  await updateOrderStatus(orderId, 'delivered', { deliveryOtpVerified: true });
  return true;
}

export async function createSellerNotification(params: {
  sellerId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  total: number;
  message: string;
}) {
  await addDoc(collection(db, 'notifications'), {
    userId: params.sellerId,
    type: 'new_order',
    orderId: params.orderId,
    orderNumber: params.orderNumber,
    title: 'New order received',
    message: params.message,
    customerName: params.customerName,
    total: params.total,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function fetchUnreadNotificationCount(userId: string): Promise<number> {
  const snapshot = await getDocs(
    query(collection(db, 'notifications'), where('userId', '==', userId), where('read', '==', false))
  );
  return snapshot.size;
}

export async function markNotificationsRead(userId: string, orderId?: string) {
  const snapshot = await getDocs(
    query(collection(db, 'notifications'), where('userId', '==', userId), where('read', '==', false))
  );

  await Promise.all(
    snapshot.docs
      .filter((entry) => !orderId || entry.data().orderId === orderId)
      .map((entry) => updateDoc(entry.ref, { read: true }))
  );
}
