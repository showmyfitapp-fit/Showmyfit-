'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api/browser';
import { fetchAllOrders, type OrderRecord } from '@/lib/orders';
import Button from '@/components/ui/Button';

type Tab = 'payments' | 'cancellations' | 'returns' | 'tickets';

export default function FinanceOpsPage({ initialTab = 'payments' }: { initialTab?: Tab }) {
  const { currentUser, userData } = useAuth();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (userData?.role !== 'admin') return;
    fetchAllOrders().then(setOrders).catch(console.error);
    apiRequest<{ returns: any[] }>('/api/returns?scope=all')
      .then((data) => setReturns(data.returns || []))
      .catch(() => setReturns([]));
    apiRequest<{ tickets: any[] }>('/api/support/tickets')
      .then((data) => setTickets(data.tickets || []))
      .catch(() => setTickets([]));
  }, [userData?.role]);

  if (!currentUser || userData?.role !== 'admin') {
    return <div className="p-8">Admin access required.</div>;
  }

  const refund = async (order: OrderRecord) => {
    if (!order.id) return;
    try {
      await apiRequest(`/api/orders/${order.id}/refund`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'admin_refund' }),
      });
      setMessage(`Refund started for ${order.orderNumber}`);
      setOrders(await fetchAllOrders());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Refund failed');
    }
  };

  const advanceReturn = async (id: string, status: string) => {
    await apiRequest(`/api/returns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    const data = await apiRequest<{ returns: any[] }>('/api/returns?scope=all');
    setReturns(data.returns || []);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Link href="/admin" className="text-sm text-gray-600">Back to admin</Link>
      <h1 className="text-3xl font-black mt-2 mb-4">Payments, cancellations, returns</h1>
      {message && <p className="mb-4 text-sm text-blue-800">{message}</p>}
      <div className="flex gap-2 mb-6">
        {(['payments', 'cancellations', 'returns', 'tickets'] as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${
              tab === key ? 'bg-black text-white' : 'bg-white border'
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {tab === 'payments' && (
        <div className="space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border rounded-xl p-4 flex justify-between gap-3">
              <div>
                <p className="font-bold">{order.orderNumber}</p>
                <p className="text-sm text-gray-600">
                  {order.paymentMethod} · {order.paymentStatus}
                  {order.codCollected ? ' · COD collected' : ''}
                  {order.paymentId ? ` · ${order.paymentId}` : ''}
                </p>
              </div>
              {order.paymentStatus === 'paid' && (
                <Button size="sm" onClick={() => refund(order)}>Refund</Button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'cancellations' && (
        <div className="space-y-2">
          {orders.filter((order) => order.status === 'cancelled').map((order) => (
            <div key={order.id} className="bg-white border rounded-xl p-4">
              <p className="font-bold">{order.orderNumber}</p>
              <p className="text-sm text-gray-600">{order.cancelReason || 'Cancelled'} · {order.paymentStatus}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'returns' && (
        <div className="space-y-2">
          {returns.map((row) => (
            <div key={row.id} className="bg-white border rounded-xl p-4">
              <p className="font-bold">{row.order_number} · {row.product_name || 'Item'}</p>
              <p className="text-sm text-gray-600">{row.status} · {row.answers?.reason}</p>
              <div className="flex gap-2 mt-2">
                {['under_review', 'approved', 'rejected', 'pickup_scheduled', 'item_received', 'processing', 'completed']
                  .filter((status) => status !== row.status)
                  .slice(0, 2)
                  .map((status) => (
                    <Button key={status} size="sm" variant="outline" onClick={() => advanceReturn(row.id, status)}>
                      {status.replaceAll('_', ' ')}
                    </Button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'tickets' && (
        <div className="space-y-2">
          {tickets.map((row) => (
            <div key={row.id} className="bg-white border rounded-xl p-4">
              <p className="font-bold">{row.category} · {row.status}</p>
              <p className="text-sm text-gray-600">{row.message}</p>
              <p className="text-xs text-gray-400">{row.order_id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
