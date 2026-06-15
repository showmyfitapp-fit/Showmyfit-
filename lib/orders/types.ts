export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'packed'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

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
  deliveryOtp?: string | null;

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
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Order Placed',
  accepted: 'Accepted by Store',
  packed: 'Packed & Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'placed',
  'accepted',
  'packed',
  'out_for_delivery',
];
