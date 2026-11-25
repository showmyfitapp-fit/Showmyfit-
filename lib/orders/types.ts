export type OrderStatus =
  | 'placed'
  | 'payment_confirmed'
  | 'accepted'
  | 'preparing'
  | 'packed'
  | 'ready_for_pickup'
  | 'rider_assigned'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'failed_delivery'
  | 'rejected'
  | 'payment_failed'
  | 'return_requested'
  | 'returned'
  | 'refunded'
  | 'exchanged';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderActor = 'customer' | 'seller' | 'rider' | 'admin';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image: string;
  brand?: string;
  size?: string;
  color?: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface StoreLocation extends GeoPoint {
  address: string;
}

export interface OrderRecord {
  id?: string;
  orderNumber: string;
  orderGroupId: string;
  pickupCode: string;
  pickupOtp?: string | null;
  pickupVerified?: boolean;
  deliveryOtp?: string | null;
  deliveryPartnerId?: string | null;
  deliveryPartnerName?: string | null;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  sellerId: string;
  sellerName: string;
  storeLocation?: StoreLocation | null;
  storeAddress?: string;
  storePhone?: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  paymentId?: string;
  razorpayOrderId?: string;
  paymentAttemptId?: string;
  refundId?: string;
  refundAmount?: number;
  codCollected?: boolean;
  cancelReason?: string;
  tax?: number;
  fees?: number;
  paymentFee?: number;
  couponCode?: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  distanceKm?: number | null;
  etaMinutes?: number | null;
  customerLocation?: GeoPoint | null;
  packByDeadline?: Date | null;
  placedAt?: Date | null;
  acceptedAt?: Date | null;
  packedAt?: Date | null;
  outForDeliveryAt?: Date | null;
  deliveredAt?: Date | null;
  cancelledAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Order Placed',
  payment_confirmed: 'Payment Confirmed',
  accepted: 'Seller Accepted',
  preparing: 'Preparing',
  packed: 'Ready for Pickup',
  ready_for_pickup: 'Ready for Pickup',
  rider_assigned: 'Rider Assigned',
  picked_up: 'Picked Up',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  failed_delivery: 'Delivery Failed',
  rejected: 'Seller Rejected',
  payment_failed: 'Payment Failed',
  return_requested: 'Return Requested',
  returned: 'Returned',
  refunded: 'Refunded',
  exchanged: 'Exchanged',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'COD Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

export function paymentStatusLabel(order: Pick<OrderRecord, 'paymentStatus' | 'paymentMethod'>) {
  if (order.paymentStatus === 'pending' && !/cod|cash/i.test(order.paymentMethod || '')) {
    return 'Pending';
  }
  return PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus;
}

const LEGACY: Record<string, OrderStatus> = {
  confirmed: 'payment_confirmed',
  shipped: 'out_for_delivery',
  ofd: 'out_for_delivery',
  pending: 'placed',
};

export function normalizeOrderStatus(status: unknown): OrderStatus {
  const raw = String(status || 'placed');
  return (LEGACY[raw] || raw) as OrderStatus;
}

export function isReadyForPickup(status: OrderStatus) {
  return status === 'packed' || status === 'ready_for_pickup';
}

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'placed',
  'payment_confirmed',
  'accepted',
  'preparing',
  'packed',
  'ready_for_pickup',
  'rider_assigned',
  'picked_up',
  'out_for_delivery',
];

export const SELLER_CANCELLABLE_STATUSES: OrderStatus[] = [
  'placed',
  'payment_confirmed',
  'accepted',
  'preparing',
];

export const CANCELLABLE_ORDER_STATUSES: OrderStatus[] = [...SELLER_CANCELLABLE_STATUSES];
