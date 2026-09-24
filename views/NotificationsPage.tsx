'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationTargetUrl } from '@/lib/notifications/browser';
import { fetchAllNotifications, type AppNotification } from '@/lib/notifications/poll';
import { markNotificationsRead } from '@/lib/orders';

const NotificationsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchAllNotifications(40);
        setItems(data);
        await markNotificationsRead();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [currentUser?.uid]);

  if (!currentUser) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">Sign in to view notifications.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/profile" className="inline-flex items-center text-sm text-gray-600 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Link>
        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2 mb-6">
          <Bell className="w-8 h-8 text-orange-600" />
          Notifications
        </h1>
        {loading ? (
          <p className="text-gray-500 py-12 text-center">Loading notifications...</p>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center text-gray-500">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={notificationTargetUrl(item.type)}
                className={`block bg-white rounded-2xl border p-4 ${
                  item.read ? 'border-gray-100' : 'border-orange-200 bg-orange-50/40'
                }`}
              >
                <p className="font-bold text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-600 mt-1">{item.message}</p>
                {item.createdAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
