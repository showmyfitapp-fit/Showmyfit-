import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export interface AppNotification {
  id: string;
  type?: string;
  title: string;
  message: string;
  orderId?: string;
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

export async function fetchLatestNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('notifications')
    .select('id, type, title, message, order_id, created_at')
    .eq('user_id', userId)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data || []).map((row) => ({
    id: String(row.id),
    type: row.type ? String(row.type) : undefined,
    title: String(row.title || 'New update'),
    message: String(row.message || ''),
    orderId: row.order_id ? String(row.order_id) : undefined,
    createdAt: row.created_at ? String(row.created_at) : undefined,
  }));
}
