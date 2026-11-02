import { Suspense } from 'react';
import OrderConfirmationPage from '@/views/order/OrderConfirmationPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <OrderConfirmationPage />
    </Suspense>
  );
}
