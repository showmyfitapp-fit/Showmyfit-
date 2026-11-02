'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchOrderById, type OrderRecord } from '@/lib/orders';
import { sellerPayout } from '@/lib/ops/rules';

export default function OrderReceiptPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    if (params.id) fetchOrderById(params.id).then(setOrder).catch(console.error);
  }, [params.id]);

  if (!order) return <div className="p-8">Loading receipt…</div>;
  const payout = sellerPayout(order.total);

  return (
    <div className="max-w-lg mx-auto bg-white p-8 print:p-0">
      <h1 className="text-2xl font-black">ShowMyFit receipt</h1>
      <p className="text-sm text-gray-600 mt-1">{order.orderNumber}</p>
      <p className="text-sm mt-4">{order.customerName} · {order.customerPhone}</p>
      <p className="text-sm text-gray-600">{order.customerAddress}</p>
      <div className="mt-6 space-y-2">
        {order.items.map((item, index) => (
          <div key={`${item.productId}-${index}`} className="flex justify-between text-sm">
            <span>{item.productName} × {item.quantity}</span>
            <span>₹{(item.price * item.quantity).toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t pt-3 text-sm space-y-1">
        <p>Subtotal ₹{order.subtotal.toLocaleString()}</p>
        <p>Discount ₹{order.discount.toLocaleString()}</p>
        <p>Tax ₹{Number(order.tax || 0).toLocaleString()} · Fees ₹{Number(order.fees || 0).toLocaleString()}</p>
        <p className="font-black text-lg">Total ₹{order.total.toLocaleString()}</p>
        <p className="text-xs text-gray-500">
          {order.paymentMethod} · {order.paymentStatus}
          {order.paymentId ? ` · ${order.paymentId}` : ''}
        </p>
        <p className="text-xs text-gray-400">Store net after 10% fee: ₹{payout.net.toLocaleString()}</p>
      </div>
      <button type="button" onClick={() => window.print()} className="mt-6 text-sm font-bold">
        Print
      </button>
    </div>
  );
}
