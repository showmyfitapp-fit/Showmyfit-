'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Store, Shield, Heart, ShoppingCart, Menu, User, TrendingUp, Package } from 'lucide-react';
import Image from 'next/image';
import Sidebar from './Sidebar';
import ShowMyFITLogo from '../common/ShowMyFITLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { getProductPath } from '@/utils/productUrls';
import { logSearchQuery } from '@/lib/analytics/searchAnalytics';
import { getProducts } from '@/lib/supabase/products';

interface NavbarProps {
  userRole?: 'user' | 'shop' | 'admin';
}

const Navbar: React.FC<NavbarProps> = ({ userRole = 'user' }) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch product suggestions from Firebase
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 1) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoadingSuggestions(true);
      try {
        const allProducts = (await getProducts()).filter(
          (product) => product.status === 'active'
        );

        // Filter products based on search query with more flexible matching
        const filtered = allProducts.filter(product => {
          const searchLower = searchQuery.toLowerCase().trim();
          const name = product.name?.toLowerCase() || '';
          const brand = product.brand?.toLowerCase() || '';
          const category = product.category?.toLowerCase() || '';
          const description = product.description?.toLowerCase() || '';

          // Check for exact matches first, then partial matches
          return (
            name.includes(searchLower) ||
            brand.includes(searchLower) ||
            category.includes(searchLower) ||
            description.includes(searchLower) ||
            // Also check if search term appears at the beginning of words
            name.split(' ').some((word: string) => word.startsWith(searchLower)) ||
            brand.split(' ').some((word: string) => word.startsWith(searchLower)) ||
            category.split(' ').some((word: string) => word.startsWith(searchLower))
          );
        }).slice(0, 8); // Limit to 8 suggestions

        console.log(`Search for "${searchQuery}": Found ${filtered.length} results out of ${allProducts.length} total products`);
        setSuggestions(filtered);
        setShowSuggestions(true); // Always show dropdown, even for no results
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Handle search functionality
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      logSearchQuery(searchQuery.trim());
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery(''); // Clear search after navigation
      setShowSuggestions(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  const handleSuggestionClick = (product: { id: string; slug?: string }) => {
    router.push(getProductPath(product));
    setSearchQuery('');
    setShowSuggestions(false);
  };

  // Safe context access with fallbacks
  let currentUser = null;
  let loading = false;
  let resolvedRole: 'user' | 'shop' | 'admin' = userRole;
  let getCartItemCount = () => 0;
  let showAddNotification = false;
  let getWishlistCount = () => 0;

  try {
    const auth = useAuth();
    currentUser = auth.currentUser;
    loading = auth.loading;
    if (auth.userData?.role) {
      resolvedRole = auth.userData.role;
    }
  } catch (error) {
    console.warn('🔐 Navbar: Auth context not available:', error);
  }

  try {
    const cart = useCart();
    getCartItemCount = cart.getCartItemCount;
    showAddNotification = cart.showAddNotification;
  } catch (error) {
    console.warn('Cart context not available in Navbar:', error);
  }

  try {
    const wishlist = useWishlist();
    getWishlistCount = wishlist.getWishlistCount;
  } catch (error) {
    console.warn('Wishlist context not available in Navbar:', error);
  }

  // Don't render if auth is still loading (simple skeleton)
  if (loading) {
    return (
      <nav className="fixed top-0 left-0 right-0 bg-white z-40 border-b border-gray-100 h-20 flex items-center px-6">
        <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse mr-4"></div>
        <div className="w-32 h-8 bg-gray-100 rounded-lg animate-pulse"></div>
      </nav>
    );
  }

  return (
    <>
      <nav className="sticky top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-100 transition-all duration-300">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-20 gap-4 md:gap-8">

            {/* Left: Logo & Menu */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors lg:hidden"
                  aria-label="Open sidebar menu"
                >
                  <Menu className="w-6 h-6 text-gray-900" />
                </button>
                <Link href="/" className="flex-shrink-0">
                  <ShowMyFITLogo size="md" />
                </Link>
              </div>

              <Link
                href="/browse"
                className="hidden lg:flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400 hover:text-black transition-all hover:translate-y-[-1px]"
              >
                Explore
              </Link>
            </div>

            {/* Center: Search Bar (Desktop) */}
            <div className="hidden md:flex flex-1 max-w-2xl relative" ref={searchRef}>
              <form onSubmit={handleSearch} className="w-full relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onKeyPress={handleKeyPress}
                  onFocus={() => {
                    if (searchQuery.trim().length >= 1) setShowSuggestions(true);
                  }}
                  placeholder="Search brands, products, styles..."
                  className="w-full pl-12 pr-4 py-3 bg-neutral-100/50 border border-neutral-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-black/5 transition-all outline-none placeholder:text-neutral-400 shadow-sm"
                />
              </form>

              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  {loadingSuggestions ? (
                    <div className="p-8 flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="py-2">
                      <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Top Results</div>
                      {suggestions.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleSuggestionClick(product)}
                          className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors text-left group"
                        >
                          <div className="relative w-12 h-12 flex-shrink-0">
                            <Image
                              src={product.image || 'https://via.placeholder.com/50'}
                              alt={product.name}
                              fill
                              className="rounded-lg object-cover bg-gray-100"
                              sizes="48px"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 truncate group-hover:text-black transition-colors text-sm">
                              {product.name}
                            </h4>
                            <p className="text-xs text-gray-500 truncate">
                              {product.brand} • {product.category}
                            </p>
                          </div>
                          <span className="font-bold text-black text-sm">₹{product.price}</span>
                        </button>
                      ))}
                      <button
                        onClick={() => handleSearch(new Event('submit') as any)}
                        className="w-full py-3 text-center text-sm font-bold text-black border-t border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        View all results
                      </button>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-gray-500 font-medium">No results found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Seller Link */}
              <Link
                href="/become-seller"
                className="hidden xl:flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-xs font-bold hover:bg-gray-800 transition-all hover:scale-105 active:scale-95"
              >
                <Store className="w-4 h-4" />
                <span>Become a Seller</span>
              </Link>

              {/* Wishlist */}
              <Link href="/wishlist" className="relative p-2.5 hover:bg-gray-100 rounded-full transition-colors group">
                <Heart className="w-6 h-6 text-gray-700 group-hover:text-red-500 transition-colors" />
                {getWishlistCount() > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {getWishlistCount()}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link href="/cart" className="relative p-2.5 hover:bg-gray-100 rounded-full transition-colors group">
                <ShoppingCart className="w-6 h-6 text-gray-700 group-hover:text-black transition-colors" />
                {getCartItemCount() > 0 && (
                  <span className={`absolute top-1.5 right-1.5 w-4 h-4 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white transition-all duration-300 ${showAddNotification ? 'bg-green-500 scale-125' : 'bg-black'}`}>
                    {getCartItemCount()}
                  </span>
                )}
              </Link>

              {/* Profile - Replaces Logout/Hi Name */}
              <Link
                href={currentUser ? "/profile" : "/login"}
                className="flex items-center gap-3 p-1 rounded-full hover:bg-white hover:p-2 hover:rounded-[20px] border border-transparent hover:border-neutral-100 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="relative w-10 h-10 rounded-xl bg-neutral-100 text-neutral-600 flex items-center justify-center overflow-hidden border border-neutral-200 transition-transform group-hover:rotate-3 group-hover:scale-110">
                  {currentUser && currentUser.photoURL ? (
                    <Image
                      src={currentUser.photoURL}
                      alt="User"
                      fill
                      className="object-cover"
                      priority
                      sizes="40px"
                    />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div className="hidden lg:block text-left mr-2">
                  <p className="text-[11px] font-black text-black leading-none uppercase tracking-widest">
                    {currentUser ? (currentUser.displayName?.split(' ')[0] || 'Member') : 'Account'}
                  </p>
                  <p className="text-[10px] text-neutral-400 font-bold leading-none mt-1 uppercase tracking-tighter">
                    {currentUser ? 'Dashboard' : 'Sign In'}
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Mobile Search Bar - Tighter spacing */}
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                placeholder="Search brands..."
                className="w-full pl-11 pr-4 py-3 bg-neutral-100/50 border border-neutral-100 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:bg-white transition-all outline-none"
              />
            </form>
            {/* Mobile Suggestions would go here in a real implementation or fullscreen overlay */}
          </div>
        </div>
      </nav>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={resolvedRole}
      />
    </>
  );
};

export default Navbar;