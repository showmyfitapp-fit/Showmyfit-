import {
  applyCoupon,
  DELIVERY_FEE,
  PAYMENT_FEE_RATE,
  type CouponResult,
} from '@/lib/ops/rules';

export type PricedLine = {
  price: number;
  originalPrice?: number;
  quantity: number;
};

export type CheckoutQuote = {
  subtotal: number;
  itemDiscount: number;
  merchandise: number;
  couponCode: string;
  couponDiscount: number;
  couponError?: string;
  shipping: number;
  paymentFee: number;
  discount: number;
  total: number;
};

function linesTotals(lines: PricedLine[]) {
  const subtotal = lines.reduce(
    (sum, item) => sum + Number(item.originalPrice || item.price || 0) * Number(item.quantity || 0),
    0
  );
  const merchandise = lines.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
  return { subtotal, merchandise, itemDiscount: Math.max(0, subtotal - merchandise) };
}

export function isOnlinePayment(method?: string | null) {
  return !/cod|cash/i.test(method || 'razorpay');
}

export function paymentFeeOn(amount: number, paymentMethod?: string | null) {
  if (!isOnlinePayment(paymentMethod) || amount <= 0) return 0;
  return Math.round(amount * PAYMENT_FEE_RATE);
}

export function quoteCheckout(params: {
  lines: PricedLine[];
  couponCode?: string | null;
  paymentMethod?: string | null;
  shippingUnits?: number;
}): CheckoutQuote {
  const { subtotal, merchandise, itemDiscount } = linesTotals(params.lines);
  const coupon: CouponResult = applyCoupon(merchandise, params.couponCode);
  const shipping = Math.max(0, Math.round(Number(params.shippingUnits ?? 1))) * DELIVERY_FEE;
  const paymentFee = paymentFeeOn(coupon.amount, params.paymentMethod);
  return {
    subtotal,
    itemDiscount,
    merchandise,
    couponCode: coupon.code,
    couponDiscount: coupon.discount,
    couponError: coupon.error,
    shipping,
    paymentFee,
    discount: itemDiscount + coupon.discount,
    total: coupon.amount + shipping + paymentFee,
  };
}

export function quoteGroupedCart<T extends PricedLine>(
  groups: Record<string, T[]>,
  couponCode?: string | null,
  paymentMethod?: string | null
): { combined: CheckoutQuote; bySeller: Record<string, CheckoutQuote> } {
  const sellerIds = Object.keys(groups);
  const combined = quoteCheckout({
    lines: sellerIds.flatMap((id) => groups[id] || []),
    couponCode,
    paymentMethod,
    shippingUnits: sellerIds.length,
  });

  let remainingCoupon = combined.couponDiscount;
  let remainingFee = combined.paymentFee;
  const bySeller: Record<string, CheckoutQuote> = {};

  sellerIds.forEach((sellerId, index) => {
    const lines = groups[sellerId] || [];
    const { subtotal, merchandise, itemDiscount } = linesTotals(lines);
    const last = index === sellerIds.length - 1;
    const share = combined.merchandise > 0 ? merchandise / combined.merchandise : 0;
    const couponDiscount = last ? remainingCoupon : Math.round(combined.couponDiscount * share);
    remainingCoupon -= couponDiscount;
    const afterCoupon = Math.max(0, merchandise - couponDiscount);
    const paymentFee = last
      ? remainingFee
      : combined.merchandise - combined.couponDiscount > 0
        ? Math.round(combined.paymentFee * (afterCoupon / (combined.merchandise - combined.couponDiscount)))
        : 0;
    remainingFee -= paymentFee;
    const shipping = DELIVERY_FEE;
    bySeller[sellerId] = {
      subtotal,
      itemDiscount,
      merchandise,
      couponCode: combined.couponCode,
      couponDiscount,
      couponError: combined.couponError,
      shipping,
      paymentFee,
      discount: itemDiscount + couponDiscount,
      total: afterCoupon + shipping + paymentFee,
    };
  });

  return { combined, bySeller };
}
