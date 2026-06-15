'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package,
  MapPin,
  Clock,
  Truck,
  CheckCircle,
  ArrowLeft,
  KeyRound,
  Store,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import { fetchCustomerOrders } from '@/lib/orders/firestore';
import { ORDER_STATUS_LABELS, type OrderRecord } from '@/lib/orders/types';

const statusColor = (status: string) => {
  switch (status) {
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'out_for_delivery':
      return 'bg-blue-100 text-blue-800';
    case 'packed':
      return 'bg-indigo-100 text-indigo-800';
    case 'accepted':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const CustomerOrdersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    fetchCustomerOrders(currentUser.uid)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FDFCFB]">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign in to view orders</h1>
          <Button onClick={() => router.push('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-20">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/profile" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to profile
        </Link>
        <h1 className="text-3xl font-black text-gray-900 mb-2">My Orders</h1>
        <p className="text-gray-600 mb-8">Track distance, ETA, pickup code, and delivery status.</p>

        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No orders yet.</p>
            <Link href="/browse" className="text-purple-600 font-semibold hover:underline">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-lg text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <Store className="w-4 h-4" />
                      {order.sellerName}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor(order.status)}`}>
                    {ORDER_STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>

                <div className="p-5 grid md:grid-cols-2 gap-4">
                  <div className="space-y-2 text-sm text-gray-600">
                    {order.distanceKm != null && (
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-purple-600" />
                        {order.distanceKm} km from store
                      </p>
                    )}
                    {order.etaMinutes != null && (
                      <p className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-600" />
                        ~{order.etaMinutes} min estimated delivery
                      </p>
                    )}
                    {order.packByDeadline && ['placed', 'accepted'].includes(order.status) && (
                      <p className="flex items-center gap-2 text-amber-700">
                        <Clock className="w-4 h-4" />
                        Store should pack by {order.packByDeadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    <p className="font-bold text-gray-900 text-base">₹{order.total.toLocaleString()}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs font-bold uppercase text-gray-500 mb-1 flex items-center gap-1">
                        <KeyRound className="w-3 h-3" />
                        Store pickup code
                      </p>
                      <p className="text-2xl font-black tracking-widest text-gray-900">{order.pickupCode}</p>
                    </div>
                    {order.status === 'out_for_delivery' && order.deliveryOtp && (
                      <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                        <p className="text-xs font-bold uppercase text-green-700 mb-1">Delivery OTP</p>
                        <p className="text-2xl font-black tracking-widest text-green-800">{order.deliveryOtp}</p>
                        <p className="text-xs text-green-700 mt-1">Share with delivery partner on arrival</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <div className="flex flex-wrap gap-2">
                    {order.items.map((item) => (
                      <div key={item.productId} className="text-xs bg-gray-50 px-3 py-2 rounded-lg text-gray-700">
                        {item.productName} × {item.quantity}
                      </div>
                    ))}
                  </div>
                  {order.storeAddress && (
                    <p className="text-xs text-gray-500 mt-3 flex items-start gap-1">
                      <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                      {order.storeAddress}
                    </p>
                  )}
                  {order.status === 'delivered' && (
                    <p className="text-sm text-green-700 flex items-center gap-1 mt-3">
                      <CheckCircle className="w-4 h-4" />
                      Delivered
                      {order.deliveredAt ? ` · ${order.deliveredAt.toLocaleString()}` : ''}
                    </p>
                  )}
                  {order.status === 'out_for_delivery' && (
                    <p className="text-sm text-blue-700 flex items-center gap-1 mt-3">
                      <Truck className="w-4 h-4" />
                      On the way — check WhatsApp for OTP
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrdersPage;
