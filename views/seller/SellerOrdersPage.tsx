'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package,
  Bell,
  Clock,
  MapPin,
  Truck,
  CheckCircle,
  ArrowLeft,
  MessageCircle,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import {
  fetchSellerOrders,
  markNotificationsRead,
  markOutForDelivery,
  updateOrderStatus,
  verifyDeliveryOtp,
} from '@/lib/orders/firestore';
import { buildDeliveryOtpWhatsAppUrl } from '@/lib/orders/helpers';
import { ORDER_STATUS_LABELS, type OrderRecord, type OrderStatus } from '@/lib/orders/types';

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: 'accepted',
  accepted: 'packed',
};

const SellerOrdersPage: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [otpInput, setOtpInput] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');

  const load = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await fetchSellerOrders(currentUser.uid);
      setOrders(data);
      await markNotificationsRead(currentUser.uid);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.role === 'shop' || userData?.role === 'admin') load();
  }, [currentUser, userData?.role]);

  const handleAdvance = async (order: OrderRecord) => {
    const next = NEXT_STATUS[order.status];
    if (!next || !order.id) return;
    await updateOrderStatus(order.id, next);
    setMessage(`Order ${order.orderNumber} marked as ${ORDER_STATUS_LABELS[next]}`);
    await load();
  };

  const handleOutForDelivery = async (order: OrderRecord) => {
    if (!order.id) return;
    const otp = await markOutForDelivery(order.id);
    const url = buildDeliveryOtpWhatsAppUrl(
      order.customerPhone,
      order.orderNumber,
      order.pickupCode,
      otp,
      order.sellerName
    );
    window.open(url, '_blank', 'noopener,noreferrer');
    setMessage(`OTP sent via WhatsApp link for ${order.orderNumber}`);
    await load();
  };

  const handleVerifyOtp = async (order: OrderRecord) => {
    if (!order.id) return;
    const entered = otpInput[order.id] || '';
    const ok = await verifyDeliveryOtp(order.id, entered);
    if (ok) {
      setMessage(`Order ${order.orderNumber} delivered successfully`);
      setOtpInput((prev) => ({ ...prev, [order.id!]: '' }));
      await load();
    } else {
      alert('Invalid OTP. Ask the customer for the code sent on WhatsApp.');
    }
  };

  if (!currentUser || (userData?.role !== 'shop' && userData?.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Seller access only</h1>
          <Button onClick={() => router.push('/profile')}>Go to Profile</Button>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/seller/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Seller dashboard
        </Link>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
              <Bell className="w-8 h-8 text-red-600" />
              Order Inbox
            </h1>
            <p className="text-gray-600 mt-1">Accept, pack, dispatch, and verify delivery OTP.</p>
          </div>
          <Button variant="secondary" onClick={load}>Refresh</Button>
        </div>

        {message && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-sm">
            {message}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading orders...</div>
        ) : activeOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center text-gray-500">
            No active orders. New orders appear here with a notification.
          </div>
        ) : (
          <div className="space-y-4">
            {activeOrders.map((order) => {
              const isOverdue =
                order.packByDeadline &&
                ['placed', 'accepted'].includes(order.status) &&
                new Date() > order.packByDeadline;

              return (
                <div key={order.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                  <div className="p-5 border-b flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="font-black text-lg">{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">{order.customerName} · {order.customerPhone}</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">₹{order.total.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                      {isOverdue && (
                        <p className="text-xs text-red-600 font-semibold mt-2 flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          Pack overdue
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-5 grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="space-y-2">
                      {order.distanceKm != null && (
                        <p className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Customer {order.distanceKm} km away · ~{order.etaMinutes ?? '?'} min
                        </p>
                      )}
                      {order.packByDeadline && ['placed', 'accepted'].includes(order.status) && (
                        <p className="flex items-center gap-2 text-amber-700">
                          <Clock className="w-4 h-4" />
                          Pack by {order.packByDeadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      <p className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4" />
                        Pickup code: <strong>{order.pickupCode}</strong>
                      </p>
                      {order.items.map((item) => (
                        <p key={item.productId} className="text-gray-700">
                          {item.productName} × {item.quantity}
                        </p>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2">
                      {NEXT_STATUS[order.status] && (
                        <Button onClick={() => handleAdvance(order)}>
                          Mark as {ORDER_STATUS_LABELS[NEXT_STATUS[order.status]!]}
                        </Button>
                      )}
                      {order.status === 'packed' && (
                        <Button onClick={() => handleOutForDelivery(order)}>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Send OTP via WhatsApp & Dispatch
                        </Button>
                      )}
                      {order.status === 'out_for_delivery' && (
                        <div className="space-y-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="Enter customer OTP"
                            value={otpInput[order.id!] || ''}
                            onChange={(e) =>
                              setOtpInput((prev) => ({ ...prev, [order.id!]: e.target.value }))
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                          <Button onClick={() => handleVerifyOtp(order)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Verify OTP & Complete Delivery
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {orders.filter((o) => o.status === 'delivered').length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Recently delivered
            </h2>
            <div className="space-y-2">
              {orders
                .filter((o) => o.status === 'delivered')
                .slice(0, 5)
                .map((order) => (
                  <div key={order.id} className="bg-white rounded-xl border px-4 py-3 flex justify-between text-sm">
                    <span className="font-medium">{order.orderNumber}</span>
                    <span className="text-gray-500">₹{order.total.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerOrdersPage;
