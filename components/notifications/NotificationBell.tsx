'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUnreadNotificationCount } from '@/lib/orders';
import { subscribeTable } from '@/lib/realtime/subscribe';

const NotificationBell: React.FC = () => {
  const { currentUser } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const load = async () => {
      try {
        setCount(await fetchUnreadNotificationCount(currentUser.uid));
      } catch (error) {
        console.warn('Unread notification count failed:', error);
      }
    };

    void load();
    const unsubscribe = subscribeTable({
      channel: `notification-count-${currentUser.uid}`,
      table: 'notifications',
      filter: `user_id=eq.${currentUser.uid}`,
      onChange: () => {
        void load();
      },
    });
    const timer = window.setInterval(() => {
      void load();
    }, 20000);

    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [currentUser?.uid]);

  if (!currentUser) return null;

  return (
    <Link href="/notifications" className="relative p-2.5 hover:bg-gray-100 rounded-full transition-colors">
      <Bell className="w-6 h-6 text-gray-700" />
      {count > 0 && (
        <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;
