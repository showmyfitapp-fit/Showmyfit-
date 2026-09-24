'use client';

import Link from 'next/link';
import { Bell, X } from 'lucide-react';
import { useOrderBrowserAlerts } from '@/hooks/useOrderBrowserAlerts';

const OrderAlertHost: React.FC = () => {
  const { toasts, dismiss } = useOrderBrowserAlerts();

  if (!toasts.length) return null;

  return (
    <div className="fixed top-20 right-4 z-[80] w-[min(100%-2rem,22rem)] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-white border border-orange-200 shadow-lg rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-900 text-sm">{toast.title}</p>
              <p className="text-xs text-gray-600 mt-1 line-clamp-3">{toast.message}</p>
              <Link
                href={toast.url}
                onClick={() => dismiss(toast.id)}
                className="inline-block mt-2 text-xs font-bold text-orange-700 hover:text-orange-800"
              >
                Open
              </Link>
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="text-gray-400 hover:text-gray-700"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderAlertHost;
