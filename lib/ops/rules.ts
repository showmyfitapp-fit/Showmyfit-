export const MAX_DELIVERY_RADIUS_KM = 20;
export const SELLER_COMMISSION_RATE = 0.1;
export const DISPATCH_ASSIGN_TIMEOUT_MINUTES = 20;
export const SELLER_ACCEPT_TIMEOUT_MINUTES = 30;
export const SUPPORT_SLA_HOURS = 24;
export const RETURN_SLA_HOURS = 48;
export const LOW_STOCK_THRESHOLD = 3;
export const MIN_ORDER_VALUE = 1;
export const DELIVERY_FEE = 50;
export const PAYMENT_FEE_RATE = 0.025;
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

export type CouponConfig = {
  type: 'percent' | 'fixed';
  value: number;
  label: string;
  active?: boolean;
  startsAt?: string;
  expiresAt?: string;
  minCart?: number;
  maxDiscount?: number;
};

export const COUPONS: Record<string, CouponConfig> = {
  LAUNCH10: { type: 'percent', value: 10, label: '10% launch offer', active: true },
};

export type CouponResult = {
  amount: number;
  discount: number;
  code: string;
  error?: string;
};

export function applyCoupon(amount: number, code?: string | null): CouponResult {
  const normalized = (code || '').trim().toUpperCase();
  if (!normalized) return { amount, discount: 0, code: '' };
  const coupon = COUPONS[normalized];
  if (!coupon || coupon.active === false) {
    return { amount, discount: 0, code: '', error: 'This coupon code is invalid.' };
  }
  const now = Date.now();
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) {
    return { amount, discount: 0, code: '', error: 'This coupon is not active yet.' };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now) {
    return { amount, discount: 0, code: '', error: 'This coupon has expired.' };
  }
  if (coupon.minCart && amount < coupon.minCart) {
    return {
      amount,
      discount: 0,
      code: '',
      error: `Add ₹${coupon.minCart - amount} more to use this coupon.`,
    };
  }
  if (amount <= 0) return { amount, discount: 0, code: '', error: 'This coupon cannot be applied.' };

  const raw =
    coupon.type === 'fixed'
      ? coupon.value
      : Math.round((amount * coupon.value) / 100);
  const discount = Math.max(
    0,
    Math.min(amount, coupon.maxDiscount != null ? Math.min(raw, coupon.maxDiscount) : raw)
  );
  if (discount <= 0) {
    return { amount, discount: 0, code: '', error: 'This coupon cannot be applied.' };
  }
  return { amount: Math.max(0, amount - discount), discount, code: normalized };
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
