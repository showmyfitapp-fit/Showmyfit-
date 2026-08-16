export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission !== 'default') {
    return Notification.permission;
  }
  return Notification.requestPermission();
}

export function browserNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export function showSystemNotification(params: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const notice = new Notification(params.title, {
    body: params.body,
    tag: params.tag || params.title,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
  });

  notice.onclick = () => {
    window.focus();
    if (params.url) window.location.href = params.url;
    notice.close();
  };
}

export function notificationTargetUrl(type?: string): string {
  if (type === 'delivery_pickup' || type === 'new_order_delivery') return '/delivery';
  return '/seller/orders';
}
