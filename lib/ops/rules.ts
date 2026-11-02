export const MAX_DELIVERY_RADIUS_KM = 20;
export const SELLER_COMMISSION_RATE = 0.1;
export const DISPATCH_ASSIGN_TIMEOUT_MINUTES = 20;
export const COUPONS: Record<string, { percent: number; label: string }> = {
  LAUNCH10: { percent: 10, label: '10% launch offer' },
};

export function applyCoupon(amount: number, code?: string | null) {
  const coupon = COUPONS[(code || '').trim().toUpperCase()];
  if (!coupon || amount <= 0) return { amount, discount: 0, code: '' };
  const discount = Math.round((amount * coupon.percent) / 100);
  return { amount: Math.max(0, amount - discount), discount, code: code!.trim().toUpperCase() };
}

export function isOutsideDeliveryRadius(distanceKm?: number | null) {
  return distanceKm != null && distanceKm > MAX_DELIVERY_RADIUS_KM;
}

export function sellerPayout(orderTotal: number) {
  const commission = Math.round(orderTotal * SELLER_COMMISSION_RATE);
  return { commission, net: Math.max(0, orderTotal - commission) };
}
