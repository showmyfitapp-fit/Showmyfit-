'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

const OrderConfirmationPage: React.FC = () => {
  const params = useSearchParams();
  const numbers = (params.get('n') || '').split(',').filter(Boolean);
  const method = params.get('pay') || 'online';

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl border p-8 text-center space-y-4">
        <CheckCircle className="w-14 h-14 text-green-600 mx-auto" />
        <h1 className="text-2xl font-black">Order confirmed</h1>
        <p className="text-gray-600">
          {method === 'cod'
            ? 'Cash on delivery. Pay the rider when the order arrives.'
            : 'Online payment received. The store will start packing shortly.'}
        </p>
        {numbers.length > 0 && (
          <p className="text-sm font-semibold text-gray-900">{numbers.join(', ')}</p>
        )}
        <Link href="/orders" className="inline-block text-purple-700 font-bold">
          View my orders
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
