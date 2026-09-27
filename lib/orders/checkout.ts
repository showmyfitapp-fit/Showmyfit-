import { apiRequest } from '@/lib/api/browser';
import type { CartItem } from '@/contexts/CartContext';
import { getUserLocation } from '@/utils/distance';
import {
  buildOrderDraft,
  groupCartBySeller,
  type SellerShopInfo,
} from './helpers';
import { requestOrderAlert } from './alerts';
import { createOrder } from './store';

export async function fetchSellerShopInfo(sellerId: string): Promise<SellerShopInfo> {
  const { seller } = await apiRequest<{ seller: SellerShopInfo }>(
    `/api/orders/shop?sellerId=${encodeURIComponent(sellerId)}`
  );
  return seller || { sellerId, sellerName: 'Store' };
}

export async function createOrdersFromCart(params: {
  cartItems: CartItem[];
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  customerLocation?: { lat: number; lng: number } | null;
  paymentId: string;
  razorpayOrderId: string;
}) {
  const rawLocation =
    params.customerLocation ||
    (await getUserLocation().then((point) =>
      point ? { lat: point.latitude, lng: point.longitude } : null
    ));
  const customerLocation = rawLocation;
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

    await requestOrderAlert('new_order', orderId);
  }

  return createdOrders;
}
