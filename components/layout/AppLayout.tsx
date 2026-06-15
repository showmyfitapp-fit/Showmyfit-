'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Navbar from './Navbar';
import { useCart } from '@/contexts/CartContext';

// Bottom Navigation Component - Mobile Only
const BottomNavigation = () => {
  const pathname = usePathname();
  const { getCartItemCount } = useCart();
  const itemCount = getCartItemCount();

  return (
    <nav className="bottom-nav md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center py-2">
        {/* Home */}
        <Link href="/"
          className={`flex flex-col items-center py-3 px-2 transition-all duration-200 ${pathname === '/'
            ? 'text-black bg-gray-100 rounded-lg'
            : 'text-gray-600'
            }`}
        >
          <div className="w-6 h-6 mb-1 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 9L12 2L21 9V20C21 20.5523 20.5523 21 20 21H15C14.4477 21 14 20.5523 14 20V14C14 13.4477 13.5523 13 13 13H11C10.4477 13 10 13.4477 10 14V20C10 20.5523 9.55228 21 9 21H4C3.44772 21 3 20.5523 3 20V9Z" />
            </svg>
          </div>
          <span className="text-xs font-medium">Home</span>
        </Link>

        {/* Explore */}
        <Link href="/browse"
          className={`flex flex-col items-center py-3 px-2 transition-all duration-200 ${pathname === '/browse'
            ? 'text-black bg-gray-100 rounded-lg'
            : 'text-gray-600'
            }`}
        >
          <div className="w-6 h-6 mb-1 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" />
            </svg>
          </div>
          <span className="text-xs font-medium">Explore</span>
        </Link>

        {/* Cart */}
        <Link href="/cart"
          className={`flex flex-col items-center py-3 px-2 transition-all duration-200 ${pathname === '/cart'
            ? 'text-black bg-gray-100 rounded-lg'
            : 'text-gray-600'
            }`}
        >
          <div className="w-6 h-6 mb-1 flex items-center justify-center relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 5H19L18 15H6L5 5ZM5 5L4 2H1M9 11V17M15 11V17M18 15H6L5 5H19L18 15Z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm animate-scale-in">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </div>
          <span className="text-xs font-medium">Cart</span>
        </Link>

        {/* Categories */}
        <Link href="/categories"
          className={`flex flex-col items-center py-3 px-2 transition-all duration-200 ${pathname === '/categories'
            ? 'text-black bg-gray-100 rounded-lg'
            : 'text-gray-600'
            }`}
        >
          <div className="w-6 h-6 mb-1 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 6H20M4 12H20M4 18H20" />
            </svg>
          </div>
          <span className="text-xs font-medium">Categories</span>
        </Link>

        {/* Account */}
        <Link href="/profile"
          className={`flex flex-col items-center py-3 px-2 transition-all duration-200 ${pathname === '/profile'
            ? 'text-black bg-gray-100 rounded-lg'
            : 'text-gray-600'
            }`}
        >
          <div className="w-6 h-6 mb-1 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20 21V19C20 17.9 19.1 17 18 17H6C4.9 17 4 17.9 4 19V21" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <span className="text-xs font-medium">Account</span>
        </Link>
      </div>
    </nav>
  );
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();

  // Hide the top navbar on specific routes (e.g., product detail and seller store pages)
  const isProductDetailPage = pathname?.startsWith('/p/') || pathname?.startsWith('/product/');
  const isSellerStorePage = pathname?.startsWith('/seller/');
  const hideTopNavbar = isSellerStorePage;

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans">
      {!hideTopNavbar && <Navbar userRole="user" />}
      <div className={`${!hideTopNavbar ? 'pt-0' : 'pt-0'} pb-20 md:pb-4`}>
        {children}
      </div>
      <BottomNavigation />
    </div>
  );
};

export default AppLayout;
