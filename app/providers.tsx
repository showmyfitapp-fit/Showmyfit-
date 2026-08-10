'use client';

import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <AppProvider>
                <CartProvider>
                    <ErrorBoundary>
                        <WishlistProvider>
                            {children}
                        </WishlistProvider>
                    </ErrorBoundary>
                </CartProvider>
            </AppProvider>
        </AuthProvider>
    );
}
