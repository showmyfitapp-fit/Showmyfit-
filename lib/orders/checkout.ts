import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { CartItem } from '@/contexts/CartContext';
import { getUserLocation } from '@/utils/distance';
import {
  buildOrderDraft,
  groupCartBySeller,
  type SellerShopInfo,
} from './helpers';
import { createOrder, createSellerNotification, notifyDeliveryPartnersOfOrder } from './store';

export async function fetchSellerShopInfo(sellerId: string): Promise<SellerShopInfo> {
  const client = getSupabaseBrowserClient();
  const { data: profile } = await client
    .from('profiles')
    .select('*')
    .or(`id.eq.${sellerId},auth_user_id.eq.${sellerId}`)
    .maybeSingle();

  if (!profile) {
    return { sellerId, sellerName: 'Store' };
  }

  const raw = (profile.raw || {}) as Record<string, any>;
  const location = (raw.location || profile.location) as
    | { lat?: number; lng?: number; address?: string }
    | undefined;

  return {
    sellerId,
    sellerName: raw.businessName || profile.display_name || raw.displayName || 'Store',
    storeAddress: profile.address || raw.address || raw.businessAddress || location?.address,
    storePhone: profile.phone || raw.phone,
    storeLocation:
      location?.lat && location?.lng
        ? {
            lat: location.lat,
            lng: location.lng,
            address: location.address || profile.address || raw.address || '',
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
  const rawLocation = await getUserLocation();
  const customerLocation = rawLocation
    ? { lat: rawLocation.latitude, lng: rawLocation.longitude }
    : null;
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

    const productLine = draft.items
      .map((item) => `${item.productName} × ${item.quantity}`)
      .join(', ');

    const sellerMessage = `${params.customerName} placed order ${draft.orderNumber} for ₹${draft.total.toLocaleString()}. Listed products: ${productLine}. Pack within 30 minutes.`;

    await createSellerNotification({
      sellerId,
      orderId,
      orderNumber: draft.orderNumber,
      customerName: params.customerName,
      total: draft.total,
      items: draft.items,
      message: sellerMessage,
    });

    await notifyDeliveryPartnersOfOrder({
      orderId,
      orderNumber: draft.orderNumber,
      sellerName: draft.sellerName,
      items: draft.items,
      message: `New order ${draft.orderNumber} at ${draft.sellerName}. ${productLine}`,
    });
  }

  return createdOrders;
}
