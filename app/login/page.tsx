import { Suspense } from 'react';
import AuthPage from '@/views/auth/AuthPage';

function AuthFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <AuthPage initialMode="login" />
    </Suspense>
  );
}
