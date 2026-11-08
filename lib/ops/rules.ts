export const MAX_DELIVERY_RADIUS_KM = 20;
export const SELLER_COMMISSION_RATE = 0.1;
export const DISPATCH_ASSIGN_TIMEOUT_MINUTES = 20;
export const SELLER_ACCEPT_TIMEOUT_MINUTES = 30;
export const SUPPORT_SLA_HOURS = 24;
export const RETURN_SLA_HOURS = 48;
export const LOW_STOCK_THRESHOLD = 3;
export const MIN_ORDER_VALUE = 1;
export const DELIVERY_FEE = 0;
export const CART_EXPIRY_HOURS = 48;
export const CUSTOMER_CANCEL_WINDOW_MINUTES = 0;

export const FAIL_REASONS = [
  'customer_unreachable',
  'address_invalid',
  'refused',
  'rider_unavailable',
  'other',
] as const;

export const SUPPORT_CATEGORIES = [
  'order',
  'payment',
  'delivery',
  'return',
  'refund',
  'account',
  'other',
] as const;

export const COUPONS: Record<string, { percent: number; label: string; expiresAt?: string; maxUses?: number }> = {
  LAUNCH10: { percent: 10, label: '10% launch offer' },
};

export function applyCoupon(amount: number, code?: string | null) {
  const coupon = COUPONS[(code || '').trim().toUpperCase()];
  if (!coupon || amount <= 0) return { amount, discount: 0, code: '' };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { amount, discount: 0, code: '' };
  }
  const discount = Math.round((amount * coupon.percent) / 100);
  return { amount: Math.max(0, amount - discount), discount, code: code!.trim().toUpperCase() };
}

export function isOutsideDeliveryRadius(distanceKm?: number | null) {
  return distanceKm != null && distanceKm > MAX_DELIVERY_RADIUS_KM;
}

export function deliveryFeeFor(distanceKm?: number | null) {
  if (distanceKm == null || isOutsideDeliveryRadius(distanceKm)) return DELIVERY_FEE;
  return DELIVERY_FEE;
}

export function sellerPayout(orderTotal: number) {
  const commission = Math.round(orderTotal * SELLER_COMMISSION_RATE);
  return { commission, net: Math.max(0, orderTotal - commission) };
}

export function refundPolicy(reason: string, orderTotal: number) {
  if (/reject|seller_timeout|payment_failed/i.test(reason)) {
    return { amount: orderTotal, method: 'original', slaHours: 24 };
  }
  if (/customer/i.test(reason)) {
    return { amount: orderTotal, method: 'original', slaHours: 48 };
  }
  return { amount: orderTotal, method: 'original', slaHours: 72 };
}
