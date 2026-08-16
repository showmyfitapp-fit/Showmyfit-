'use client';

import { useEffect, useRef } from 'react';
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
} from '@/lib/notifications/poll';

export function useOrderBrowserAlerts() {
  const { currentUser } = useAuth();
  const primed = useRef(false);

  useEffect(() => {
    if (!currentUser?.uid) return;
    let cancelled = false;

    const poll = async () => {
      if (browserNotificationPermission() !== 'granted') return;
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
        fresh.forEach((item) => {
          showSystemNotification({
            title: item.title,
            body: item.message,
            tag: item.id,
            url: notificationTargetUrl(item.type),
          });
        });
        if (fresh.length) {
          rememberSeenNotificationIds(fresh.map((item) => item.id));
        }
      } catch (error) {
        console.warn('Order alert poll failed:', error);
      }
    };

    poll();
    const timer = window.setInterval(poll, 12000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [currentUser?.uid]);
}
