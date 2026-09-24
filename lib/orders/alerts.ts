import { apiRequest } from '@/lib/api/browser';

export type OrderAlertEvent =
  | 'new_order'
  | 'pickup_ready'
  | 'job_assigned'
  | 'picked_up'
  | 'cancelled'
  | 'delivered';

export async function requestOrderAlert(event: OrderAlertEvent, orderId: string): Promise<void> {
  if (!orderId) return;
  try {
    await apiRequest('/api/orders/alerts', {
      method: 'POST',
      body: JSON.stringify({ event, orderId }),
    });
  } catch (error) {
    console.warn('Order alert request failed:', error);
  }
}
