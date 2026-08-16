import { generateDeliveryOtp } from '@/lib/orders/helpers';
import type { OrderItem, OrderRecord } from '@/lib/orders/types';
import type { DeliveryJob } from './types';

export function generatePickupOtp(): string {
  return generateDeliveryOtp();
}

export function formatProductLine(items: OrderItem[]): string {
  return items.map((item) => `${item.productName} × ${item.quantity}`).join(', ');
}

export function mapsUrl(lat?: number | null, lng?: number | null, address?: string): string {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`;
}

export function jobFromOrder(order: OrderRecord, pickupOtp: string): Omit<DeliveryJob, 'id'> {
  return {
    orderId: order.id || '',
    orderNumber: order.orderNumber,
    sellerId: order.sellerId,
    sellerName: order.sellerName,
    storePhone: order.storePhone,
    pickAddress: order.storeAddress || order.storeLocation?.address || 'Store address unavailable',
    pickLocation: order.storeLocation || null,
    dropAddress: order.customerAddress || 'Customer address unavailable',
    dropLocation: order.customerLocation || null,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    items: order.items,
    total: order.total,
    pickupOtp,
    pickupVerified: false,
    deliveryPartnerId: null,
    deliveryPartnerName: null,
    status: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
