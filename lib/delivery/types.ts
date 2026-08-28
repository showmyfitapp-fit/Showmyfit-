import type { GeoPoint, OrderItem, StoreLocation } from '@/lib/orders/types';

export type DeliveryJobStatus =
  | 'available'
  | 'assigned'
  | 'picked_up'
  | 'delivered'
  | 'cancelled';

export interface DeliveryJob {
  id?: string;
  orderId: string;
  orderNumber: string;
  sellerId: string;
  sellerName: string;
  storePhone?: string;
  pickAddress: string;
  pickLocation?: StoreLocation | null;
  dropAddress: string;
  dropLocation?: GeoPoint | null;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  pickupOtp: string;
  pickupVerified: boolean;
  deliveryPartnerId?: string | null;
  deliveryPartnerName?: string | null;
  status: DeliveryJobStatus;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface DeliveryPartner {
  id: string;
  authUserId?: string;
  name: string;
  phone?: string;
  isOnline: boolean;
  lastOnlineAt?: Date | null;
}
