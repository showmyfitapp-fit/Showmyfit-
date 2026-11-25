'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api/browser';
import { cancelOrder, fetchAllOrders, type OrderRecord } from '@/lib/orders';
import Button from '@/components/ui/Button';

type Tab = 'payments' | 'cancellations' | 'returns' | 'tickets' | 'history';

export default function FinanceOpsPage({ initialTab = 'payments' }: { initialTab?: Tab }) {
  const { currentUser, userData } = useAuth();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<Record<string, any[]>>({});

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
    const customerMessage =
      status === 'rejected'
        ? window.prompt('Customer-facing explanation (required for reject)') || ''
        : status === 'more_info'
          ? window.prompt('What extra information should the customer send?') || ''
          : window.prompt('Optional customer-facing update') || '';
    const adminNote = window.prompt('Internal admin note (optional)') || '';
    await apiRequest(`/api/returns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        customerMessage,
        adminNote,
        rejectionReason: status === 'rejected' ? customerMessage : undefined,
      }),
    });
    const data = await apiRequest<{ returns: any[] }>('/api/returns?scope=all');
    setReturns(data.returns || []);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Link href="/admin" className="text-sm text-gray-600">Back to admin</Link>
      <h1 className="text-3xl font-black mt-2 mb-4">Payments, cancellations, returns</h1>
      {message && <p className="mb-4 text-sm text-blue-800">{message}</p>}
      <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6 text-xs">
        {[
          ['Open', orders.filter((o) => !['delivered', 'cancelled', 'rejected', 'refunded'].includes(o.status)).length],
          ['Unassigned', orders.filter((o) => o.status === 'packed' && !o.deliveryPartnerId).length],
          ['Delayed pack', orders.filter((o) => o.packByDeadline && o.packByDeadline < new Date() && ['placed', 'accepted', 'preparing'].includes(o.status)).length],
          ['Failed pay', orders.filter((o) => o.paymentStatus === 'failed').length],
          ['Cancelled', orders.filter((o) => o.status === 'cancelled').length],
          ['Returns', returns.length],
        ].map(([label, count]) => (
          <div key={String(label)} className="bg-white border rounded-xl p-3">
            <p className="text-gray-500">{label}</p>
            <p className="text-xl font-black">{count}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-6">
        {(['payments', 'cancellations', 'returns', 'tickets', 'history'] as Tab[]).map((key) => (
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
              <div className="flex flex-col gap-1">
                {order.paymentStatus === 'paid' && (
                  <Button size="sm" onClick={() => refund(order)}>Refund</Button>
                )}
                {order.id && order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await cancelOrder(order.id!, { force: true });
                      setMessage(`Cancelled ${order.orderNumber}`);
                      setOrders(await fetchAllOrders());
                    }}
                  >
                    Cancel
                  </Button>
                )}
                {order.id && order.deliveryPartnerId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await apiRequest(`/api/orders/${order.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({
                          fields: {
                            delivery_partner_id: null,
                            delivery_partner_name: null,
                            status: 'packed',
                          },
                        }),
                      });
                      setMessage(`Rider cleared for ${order.orderNumber}`);
                      setOrders(await fetchAllOrders());
                    }}
                  >
                    Reassign rider
                  </Button>
                )}
              </div>
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
              <p className="text-sm text-gray-600">
                {row.status} · {row.answers?.reason} · qty {row.quantity || 1}
              </p>
              {row.answers?.details && <p className="text-sm text-gray-700 mt-1">{row.answers.details}</p>}
              {row.reviewed_at && (
                <p className="text-xs text-gray-500 mt-1">
                  Reviewed {new Date(row.reviewed_at).toLocaleString()}
                  {row.reviewed_by ? ` · ${row.reviewed_by}` : ''}
                </p>
              )}
              {row.admin_note && <p className="text-xs text-gray-500">Internal: {row.admin_note}</p>}
              {row.customer_message && <p className="text-xs text-purple-800">Customer: {row.customer_message}</p>}
              {Array.isArray(row.images) && row.images.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {row.images.map((src: string) => (
                    <a key={src} href={src} target="_blank" rel="noreferrer">
                      <img src={src} alt="" className="w-14 h-14 object-cover rounded-lg border" />
                    </a>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-2 flex-wrap">
                {({
                  requested: ['under_review', 'more_info', 'rejected'],
                  under_review: ['approved', 'more_info', 'rejected'],
                  more_info: ['under_review', 'rejected'],
                  approved: ['pickup_scheduled', 'rejected'],
                  pickup_scheduled: ['item_received'],
                  item_received: ['processing', 'rejected'],
                  processing: ['completed'],
                }[row.status as string] || [])
                  .map((status: string) => (
                    <Button key={status} size="sm" variant="outline" onClick={() => advanceReturn(row.id, status)}>
                      {status.replaceAll('_', ' ')}
                    </Button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-2">
          {orders.slice(0, 40).map((order) => (
            <div key={order.id} className="bg-white border rounded-xl p-4">
              <div className="flex justify-between gap-3">
                <p className="font-bold">{order.orderNumber} · {order.status}</p>
                {order.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const data = await apiRequest<{ events: any[] }>(`/api/orders/${order.id}/events`);
                      setHistory((prev) => ({ ...prev, [order.id!]: data.events || [] }));
                    }}
                  >
                    History
                  </Button>
                )}
              </div>
              {(history[order.id || ''] || []).map((event) => (
                <p key={event.id} className="text-xs text-gray-600 mt-1">
                  {event.from_status || '—'} → {event.to_status || '—'} · {event.actor_role} · {event.reason || event.source}
                </p>
              ))}
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
