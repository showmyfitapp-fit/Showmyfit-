import type { OrderStatus } from './types';

export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ['accepted', 'cancelled'],
  accepted: ['packed', 'cancelled'],
  packed: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled', 'failed_delivery'],
  delivered: [],
  cancelled: [],
  failed_delivery: ['out_for_delivery', 'cancelled'],
};

export function canTransitionOrderStatus(
  from: OrderStatus,
  to: OrderStatus
): boolean {
  if (from === to) return true;
  return (ALLOWED_ORDER_TRANSITIONS[from] || []).includes(to);
}
