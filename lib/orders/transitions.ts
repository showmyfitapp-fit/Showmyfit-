import {
  normalizeOrderStatus,
  type OrderActor,
  type OrderStatus,
} from './types';

export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ['payment_confirmed', 'accepted', 'cancelled', 'rejected', 'payment_failed'],
  payment_confirmed: ['accepted', 'cancelled', 'rejected'],
  accepted: ['preparing', 'packed', 'cancelled', 'rejected'],
  preparing: ['packed', 'ready_for_pickup', 'cancelled', 'rejected'],
  packed: ['rider_assigned', 'picked_up', 'out_for_delivery', 'cancelled', 'failed_delivery'],
  ready_for_pickup: ['rider_assigned', 'picked_up', 'out_for_delivery', 'cancelled', 'failed_delivery'],
  rider_assigned: ['picked_up', 'packed', 'failed_delivery'],
  picked_up: ['out_for_delivery', 'failed_delivery'],
  out_for_delivery: ['delivered', 'failed_delivery'],
  delivered: ['return_requested'],
  cancelled: [],
  failed_delivery: ['out_for_delivery', 'cancelled'],
  rejected: [],
  payment_failed: ['cancelled'],
  return_requested: ['returned', 'exchanged', 'cancelled'],
  returned: ['refunded'],
  refunded: [],
  exchanged: [],
};

const ACTOR_STATUSES: Record<OrderActor, OrderStatus[]> = {
  customer: [],
  seller: ['accepted', 'preparing', 'packed', 'ready_for_pickup', 'rejected', 'cancelled'],
  rider: ['rider_assigned', 'picked_up', 'out_for_delivery', 'delivered', 'failed_delivery'],
  admin: [
    'payment_confirmed',
    'accepted',
    'preparing',
    'packed',
    'ready_for_pickup',
    'rider_assigned',
    'picked_up',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'failed_delivery',
    'rejected',
    'payment_failed',
    'return_requested',
    'returned',
    'refunded',
    'exchanged',
  ],
};

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  const current = normalizeOrderStatus(from);
  const next = normalizeOrderStatus(to);
  if (current === next) return true;
  return (ALLOWED_ORDER_TRANSITIONS[current] || []).includes(next);
}

export function canActorSetStatus(actor: OrderActor, from: OrderStatus, to: OrderStatus): boolean {
  const current = normalizeOrderStatus(from);
  const next = normalizeOrderStatus(to);
  if (!canTransitionOrderStatus(current, next)) return false;
  if (actor === 'admin') return true;
  if (actor === 'seller' && next === 'cancelled') {
    return ['placed', 'payment_confirmed', 'accepted', 'preparing'].includes(current);
  }
  return ACTOR_STATUSES[actor].includes(next);
}
