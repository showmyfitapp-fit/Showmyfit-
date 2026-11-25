'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api/browser';
import type { OrderRecord, OrderStatus } from '@/lib/orders/types';

const STAGES: { label: string; statuses: OrderStatus[] }[] = [
  { label: 'Order placed', statuses: ['placed', 'payment_confirmed'] },
  { label: 'Confirmed', statuses: ['accepted'] },
  { label: 'Preparing / Packing', statuses: ['preparing'] },
  { label: 'Ready for pickup', statuses: ['packed', 'ready_for_pickup'] },
  { label: 'Picked up', statuses: ['rider_assigned', 'picked_up'] },
  { label: 'On the way', statuses: ['out_for_delivery'] },
  { label: 'Delivered', statuses: ['delivered'] },
];

const EXCEPTIONS: Partial<Record<OrderStatus, string>> = {
  cancelled: 'Cancelled',
  failed_delivery: 'Delivery failed',
  rejected: 'Seller rejected',
  payment_failed: 'Payment failed',
  return_requested: 'Return requested',
  returned: 'Returned',
  refunded: 'Refunded',
  exchanged: 'Exchanged',
};

type OrderEvent = {
  id: string;
  to_status?: string;
  from_status?: string;
  created_at?: string;
};

function eventTime(events: OrderEvent[], statuses: string[]) {
  const match = [...events].reverse().find((event) => statuses.includes(String(event.to_status || '')));
  return match?.created_at ? new Date(match.created_at) : null;
}

function fallbackTime(order: OrderRecord, statuses: OrderStatus[]) {
  if (statuses.includes('placed') || statuses.includes('payment_confirmed')) return order.placedAt || null;
  if (statuses.includes('accepted')) return order.acceptedAt || null;
  if (statuses.includes('packed') || statuses.includes('ready_for_pickup')) return order.packedAt || null;
  if (statuses.includes('out_for_delivery')) return order.outForDeliveryAt || null;
  if (statuses.includes('delivered')) return order.deliveredAt || null;
  return null;
}

function stageIndex(status: OrderStatus) {
  const index = STAGES.findIndex((stage) => stage.statuses.includes(status));
  if (index >= 0) return index;
  if (['return_requested', 'returned', 'refunded', 'exchanged'].includes(status)) return STAGES.length - 1;
  return -1;
}

export default function OrderTimeline({ order }: { order: OrderRecord }) {
  const [events, setEvents] = useState<OrderEvent[]>([]);

  useEffect(() => {
    if (!order.id) return;
    apiRequest<{ events: OrderEvent[] }>(`/api/orders/${order.id}/events`)
      .then((data) => setEvents(data.events || []))
      .catch(() => setEvents([]));
  }, [order.id, order.status, order.updatedAt]);

  const current = stageIndex(order.status);
  const exception = EXCEPTIONS[order.status];

  return (
    <div className="mt-3">
      <ol className="space-y-2">
        {STAGES.map((stage, index) => {
          const done = current > index || (current === index && order.status === 'delivered');
          const active = current === index && order.status !== 'delivered';
          const time =
            eventTime(events, stage.statuses) ||
            (done || active ? fallbackTime(order, stage.statuses) : null);
          return (
            <li key={stage.label} className="flex items-start gap-3">
              <span
                className={`mt-0.5 h-3 w-3 rounded-full shrink-0 transition-all duration-500 ${
                  done ? 'bg-green-500 scale-110' : active ? 'bg-purple-600 animate-pulse scale-125' : 'bg-gray-200'
                }`}
              />
              <div className="min-w-0">
                <p
                  className={`text-xs font-bold transition-colors duration-500 ${
                    done || active ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {stage.label}
                </p>
                {time && (
                  <p className="text-[11px] text-gray-500">{time.toLocaleString()}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {exception && (
        <p className="mt-2 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          {exception}
          {order.cancelReason ? ` · ${order.cancelReason}` : ''}
        </p>
      )}
      {order.etaMinutes != null &&
        ['packed', 'ready_for_pickup', 'rider_assigned', 'picked_up', 'out_for_delivery'].includes(order.status) && (
          <p className="mt-2 text-xs text-gray-500">Estimated delivery ~{order.etaMinutes} min</p>
        )}
    </div>
  );
}
