import { apiRequest } from '@/lib/api/browser';

export interface AppNotification {
  id: string;
  type?: string;
  title: string;
  message: string;
  orderId?: string;
  read?: boolean;
  createdAt?: string;
}

const SEEN_KEY = 'smf_seen_notification_ids';

export function readSeenNotificationIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function rememberSeenNotificationIds(ids: string[]) {
  const seen = readSeenNotificationIds();
  ids.forEach((id) => seen.add(id));
  sessionStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(seen).slice(-80)));
}

export async function fetchLatestNotifications(_userId?: string): Promise<AppNotification[]> {
  const { items } = await apiRequest<{ items: AppNotification[] }>(
    '/api/notifications?unread=1&limit=20'
  );
  return items || [];
}

export async function fetchAllNotifications(limit = 40): Promise<AppNotification[]> {
  const { items } = await apiRequest<{ items: AppNotification[] }>(
    `/api/notifications?limit=${limit}`
  );
  return items || [];
}
