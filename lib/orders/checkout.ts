import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { CartItem } from '@/contexts/CartContext';
import { getUserLocation } from '@/utils/distance';
import {
  buildOrderDraft,
  groupCartBySeller,
  type SellerShopInfo,
} from './helpers';
import { createOrder, createSellerNotification } from './firestore';

export async function fetchSellerShopInfo(sellerId: string): Promise<SellerShopInfo> {
  const snapshot = await getDoc(doc(db, 'users', sellerId));
  if (!snapshot.exists()) {
    return { sellerId, sellerName: 'Store' };
  }

  const data = snapshot.data();
  const location = data.location as { lat?: number; lng?: number; address?: string } | undefined;

  return {
    sellerId,
    sellerName: data.businessName || data.displayName || 'Store',
    storeAddress: data.address || location?.address,
    storePhone: data.phone,
    storeLocation: location?.lat && location?.lng
      ? {
          lat: location.lat,
          lng: location.lng,
          address: location.address || data.address || '',
        }
      : null,
  };
}

export async function createOrdersFromCart(params: {
  cartItems: CartItem[];
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  paymentId: string;
  razorpayOrderId: string;
}) {
  const customerLocation = await getUserLocation();
  const orderGroupId = `grp_${Date.now()}`;
  const groups = groupCartBySeller(params.cartItems);
  const createdOrders: Array<{ id: string; orderNumber: string; sellerId: string }> = [];

  for (const [sellerId, items] of Object.entries(groups)) {
    if (sellerId === 'unknown') continue;

    const seller = await fetchSellerShopInfo(sellerId);
    const draft = buildOrderDraft({
      orderGroupId,
      seller,
      items,
      userId: params.userId,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      customerAddress: params.customerAddress,
      customerLocation,
      paymentId: params.paymentId,
      razorpayOrderId: params.razorpayOrderId,
    });

    const orderId = await createOrder(draft);
    createdOrders.push({ id: orderId, orderNumber: draft.orderNumber, sellerId });

    await createSellerNotification({
      sellerId,
      orderId,
      orderNumber: draft.orderNumber,
      customerName: params.customerName,
      total: draft.total,
      message: `${params.customerName} placed order ${draft.orderNumber} for ₹${draft.total.toLocaleString()}. Pack within 30 minutes.`,
    });
  }

  return createdOrders;
}
