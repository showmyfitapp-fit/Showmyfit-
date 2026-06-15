import { estimateDeliveryMinutes, getDistance } from '@/utils/distance';
import type { CartItem } from '@/contexts/CartContext';
import type { GeoPoint, OrderItem, OrderRecord, StoreLocation } from './types';

const PACK_SLA_MINUTES = 30;

export function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SMF-${ts.slice(-6)}${rand}`;
}

export function generatePickupCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function generateDeliveryOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function groupCartBySeller(items: CartItem[]): Record<string, CartItem[]> {
  return items.reduce<Record<string, CartItem[]>>((groups, item) => {
    const sellerId = item.sellerId || 'unknown';
    if (!groups[sellerId]) groups[sellerId] = [];
    groups[sellerId].push(item);
    return groups;
  }, {});
}

export function cartItemsToOrderItems(items: CartItem[]): OrderItem[] {
  return items.map((item) => ({
    productId: item.id,
    productName: item.name,
    quantity: item.quantity,
    price: item.price,
    image: item.image,
    brand: item.brand,
    size: item.size,
    color: item.color,
  }));
}

export function computeDistanceAndEta(
  customerLocation: GeoPoint | null | undefined,
  storeLocation: StoreLocation | null | undefined
): { distanceKm: number | null; etaMinutes: number | null } {
  if (!customerLocation || !storeLocation?.lat || !storeLocation?.lng) {
    return { distanceKm: null, etaMinutes: null };
  }

  const distanceKm = getDistance(
    customerLocation.lat,
    customerLocation.lng,
    storeLocation.lat,
    storeLocation.lng
  );

  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    etaMinutes: estimateDeliveryMinutes(distanceKm),
  };
}

export interface SellerShopInfo {
  sellerId: string;
  sellerName: string;
  storeAddress?: string;
  storePhone?: string;
  storeLocation?: StoreLocation | null;
}

export function buildOrderDraft(params: {
  orderGroupId: string;
  seller: SellerShopInfo;
  items: CartItem[];
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  customerLocation?: GeoPoint | null;
  paymentId: string;
  razorpayOrderId: string;
}): Omit<OrderRecord, 'id'> {
  const subtotal = params.items.reduce(
    (sum, item) => sum + (item.originalPrice || item.price) * item.quantity,
    0
  );
  const discount = params.items.reduce(
    (sum, item) => sum + ((item.originalPrice || item.price) - item.price) * item.quantity,
    0
  );
  const total = params.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const { distanceKm, etaMinutes } = computeDistanceAndEta(
    params.customerLocation,
    params.storeLocation
  );
  const now = new Date();
  const packByDeadline = new Date(now.getTime() + PACK_SLA_MINUTES * 60 * 1000);

  return {
    orderNumber: generateOrderNumber(),
    orderGroupId: params.orderGroupId,
    pickupCode: generatePickupCode(),
    deliveryOtp: null,
    userId: params.userId,
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    customerPhone: params.customerPhone,
    customerAddress: params.customerAddress,
    sellerId: params.seller.sellerId,
    sellerName: params.seller.sellerName,
    storeLocation: params.seller.storeLocation || null,
    storeAddress: params.seller.storeAddress,
    storePhone: params.seller.storePhone,
    items: cartItemsToOrderItems(params.items),
    status: 'placed',
    paymentStatus: 'paid',
    paymentMethod: 'razorpay',
    paymentId: params.paymentId,
    razorpayOrderId: params.razorpayOrderId,
    subtotal,
    discount,
    shipping: 0,
    total,
    distanceKm,
    etaMinutes,
    customerLocation: params.customerLocation || null,
    packByDeadline,
    placedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildDeliveryOtpWhatsAppUrl(
  phone: string,
  orderNumber: string,
  pickupCode: string,
  otp: string,
  storeName: string
): string {
  const digits = phone.replace(/\D/g, '');
  const withCountry = digits.startsWith('91') ? digits : `91${digits}`;
  const message =
    `ShowMyFIT Delivery Update\n\n` +
    `Order: ${orderNumber}\n` +
    `Store pickup code: ${pickupCode}\n` +
    `Delivery OTP: ${otp}\n\n` +
    `Share this OTP with the delivery partner from ${storeName} when you receive your package.`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

export function normalizeLegacyOrder(data: Record<string, unknown>): Partial<OrderRecord> {
  const status = (data.status || data.orderStatus || 'placed') as OrderRecord['status'];
  const items = Array.isArray(data.items) ? data.items : [];
  const firstItem = items[0] as Record<string, unknown> | undefined;

  return {
    orderNumber: String(data.orderNumber || data.id || 'LEGACY'),
    orderGroupId: String(data.orderGroupId || data.id || 'legacy'),
    pickupCode: String(data.pickupCode || '------'),
    userId: String(data.userId || ''),
    customerName: String(data.customerName || 'Customer'),
    customerEmail: String(data.customerEmail || ''),
    customerPhone: String(data.customerPhone || ''),
    sellerId: String(data.sellerId || firstItem?.sellerId || ''),
    sellerName: String(data.sellerName || firstItem?.sellerName || 'Store'),
    items: items as OrderItem[],
    status,
    paymentStatus: (data.paymentStatus as OrderRecord['paymentStatus']) || 'paid',
    paymentMethod: String(data.paymentMethod || 'razorpay'),
    total: Number(data.total || 0),
    subtotal: Number(data.subtotal || data.total || 0),
    discount: Number(data.discount || 0),
    shipping: Number(data.shipping || 0),
    distanceKm: data.distanceKm != null ? Number(data.distanceKm) : null,
    etaMinutes: data.etaMinutes != null ? Number(data.etaMinutes) : null,
  };
}
