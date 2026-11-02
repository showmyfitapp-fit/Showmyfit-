export function registerOrderAlertWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  registerOrderAlertWorker();
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

  const options: NotificationOptions = {
    body: params.body,
    tag: params.tag || params.title,
    icon: '/logo.jpg',
    badge: '/logo.jpg',
    data: { url: params.url || '/' },
  };

  const openNotice = () => {
    const notice = new Notification(params.title, options);
    notice.onclick = () => {
      window.focus();
      if (params.url) window.location.href = params.url;
      notice.close();
    };
  };

  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        return registration.showNotification(params.title, options);
      }
      openNotice();
    }).catch(openNotice);
    return;
  }

  openNotice();
}

export function notificationTargetUrl(type?: string, orderId?: string): string {
  if (type === 'delivery_pickup' || type === 'new_order_delivery' || type === 'pickup_ready') {
    return orderId ? `/delivery?order=${orderId}` : '/delivery';
  }
  if (type === 'cancelled') return orderId ? `/delivery?order=${orderId}` : '/profile';
  return orderId ? `/seller/orders?order=${orderId}` : '/seller/orders';
}
