'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  browserNotificationPermission,
  notificationTargetUrl,
  showSystemNotification,
} from '@/lib/notifications/browser';
import {
  fetchLatestNotifications,
  readSeenNotificationIds,
  rememberSeenNotificationIds,
  type AppNotification,
} from '@/lib/notifications/poll';
import { subscribeTable } from '@/lib/realtime/subscribe';

export interface OrderAlertToast extends AppNotification {
  url: string;
}

export function useOrderBrowserAlerts() {
  const { currentUser } = useAuth();
  const primed = useRef(false);
  const [toasts, setToasts] = useState<OrderAlertToast[]>([]);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    if (!currentUser?.uid) return;
    let cancelled = false;

    const sync = async () => {
      try {
        const items = await fetchLatestNotifications(currentUser.uid);
        if (cancelled) return;
        const seen = readSeenNotificationIds();
        if (!primed.current) {
          rememberSeenNotificationIds(items.map((item) => item.id));
          primed.current = true;
          return;
        }
        const fresh = items.filter((item) => !seen.has(item.id));
        if (!fresh.length) return;

        const nextToasts = fresh.map((item) => ({
          ...item,
          url: notificationTargetUrl(item.type, item.orderId),
        }));
        setToasts((prev) => [...nextToasts, ...prev].slice(0, 5));

        if (browserNotificationPermission() === 'granted') {
          fresh.forEach((item) => {
            showSystemNotification({
              title: item.title,
              body: item.message,
              tag: item.id,
              url: notificationTargetUrl(item.type, item.orderId),
            });
          });
        }

        rememberSeenNotificationIds(fresh.map((item) => item.id));
      } catch (error) {
        console.warn('Order alert sync failed:', error);
      }
    };

    void sync();
    const unsubscribe = subscribeTable({
      channel: `notifications-${currentUser.uid}`,
      table: 'notifications',
      filter: `user_id=eq.${currentUser.uid}`,
      onChange: () => {
        void sync();
      },
    });
    const poll = window.setInterval(() => {
      void sync();
    }, 20000);

    return () => {
      cancelled = true;
      unsubscribe();
      window.clearInterval(poll);
    };
  }, [currentUser?.uid]);

  return { toasts, dismiss };
}
