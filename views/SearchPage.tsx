'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search, MapPin, Heart, Filter,
  Store, Navigation, Package, TrendingUp, ChevronRight, X, ArrowRight, Star, ShoppingBag, Info
} from 'lucide-react';
import { collection, query, getDocs, where, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useWishlist } from '../contexts/WishlistContext';
import FastImage from '../components/common/FastImage';
import ShareButton from '../components/common/ShareButton';

const SearchPage: React.FC = () => {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sellers, setSellers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingSellers, setLoadingSellers] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [searchType, setSearchType] = useState<'products' | 'shops'>('products');
  const [availableCategories, setAvailableCategories] = useState<string[]>(['All']);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // Category name formatting
  const formatCategoryName = (category: string): string => {
    const categoryNames: Record<string, string> = {
      'women': 'Women', 'men': 'Men', 'kids': 'Kids', 'watches': 'Watches',
      'accessories': 'Accessories', 'jewellery': 'Jewellery', 'sportswear': 'Sports',
      'footwear': 'Footwear', 'beauty': 'Beauty', 'lingerie': 'Lingerie',
      'home-lifestyle': 'Home', 'home': 'Home', 'electronics': 'Electronics',
      'gifting-guide': 'Gifting Guide'
    };
    return categoryNames[category.toLowerCase()] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  // Get search query and category from URL parameters
  useEffect(() => {
    const queryParam = searchParams.get('q');
    const categoryParam = searchParams.get('category');

    if (queryParam) setSearchQuery(decodeURIComponent(queryParam));
    if (categoryParam) setSelectedCategory(decodeURIComponent(categoryParam));
  }, [searchParams]);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fetch Sellers
  useEffect(() => {
    const fetchSellers = async () => {
      setLoadingSellers(true);
      try {
        const usersQuery = query(collection(db, 'users'), where('role', '==', 'shop'));
        const snapshot = await getDocs(usersQuery);
        const sellersList: any[] = [];

        snapshot.docs.forEach((doc) => {
          const userData = doc.data();
          if (userData.role === 'shop' && userData.sellerApplication?.status === 'approved') {
            sellersList.push({
              id: doc.id,
              ...userData,
              businessName: userData.businessName || userData.displayName || 'Unknown Shop',
              stats: userData.stats || { rating: 4.5, totalOrders: 120 }
            });
          }
        });

        if (userLocation) {
          sellersList.sort((a, b) => {
            const distA = a.location ? calculateDistance(userLocation.lat, userLocation.lng, a.location.lat, a.location.lng) : 9999;
            const distB = b.location ? calculateDistance(userLocation.lat, userLocation.lng, b.location.lat, b.location.lng) : 9999;
            return distA - distB;
          });
        }
        setSellers(sellersList);
      } catch (error) {
        console.error('Error loading sellers:', error);
      } finally {
        setLoadingSellers(false);
      }
    };
    fetchSellers();
  }, [userLocation]);

  // Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const productsQuery = query(collection(db, 'products'), where('status', '==', 'active'));
        const snapshot = await getDocs(productsQuery);
        const productsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const categories = Array.from(new Set(productsList.map((p: any) => p.category?.toLowerCase()).filter(Boolean)));
        setAvailableCategories(['All', ...categories.map(c => formatCategoryName(c))]);
        setProducts(productsList);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // Filtering Logic
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === '' || product.name.toLowerCase().includes(searchQuery.toLowerCase()) || product.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesCategory = true;
    if (selectedCategory !== 'All') {
      const pCat = formatCategoryName(product.category || '').toLowerCase();
      matchesCategory = pCat === selectedCategory.toLowerCase();
    }
    return matchesSearch && matchesCategory;
  });

  const filteredSellers = sellers.filter(seller => {
    const matchesSearch = searchQuery === '' || seller.businessName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setCurrentLocation(`Live: ${(latitude).toFixed(2)}, ${(longitude).toFixed(2)}`);
        setIsGettingLocation(false);
      },
      () => {
        alert('Failed to get location');
        setIsGettingLocation(false);
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-neutral-900 pb-20">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-10">

        {/* Refined Header area */}
        <div className="flex flex-col gap-8 mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-3">
                <Link href="/" className="hover:text-black transition-colors">Home</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-black">Explore</span>
              </nav>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-black">
                Collections
              </h1>
            </div>

            {/* Products/Shops Toggle - Handcrafted Switch */}
            <div className="p-1 bg-neutral-100 rounded-2xl flex items-center w-fit shadow-inner">
              <button
                onClick={() => setSearchType('products')}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${searchType === 'products' ? 'bg-white text-black shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
              >
                Products
              </button>
              <button
                onClick={() => setSearchType('shops')}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${searchType === 'shops' ? 'bg-white text-black shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
              >
                Stores
              </button>
            </div>
          </div>

          {/* Premium Search Container */}
          <div className="relative group">
            <div className="absolute inset-0 bg-black/5 blur-3xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
            <div className="relative flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-black transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search brands, styles, or stores..."
                  className="w-full h-16 pl-16 pr-6 bg-white border border-neutral-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-black/5 outline-none shadow-[0_8px_30px_-8px_rgba(0,0,0,0.05)] transition-all"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={getCurrentLocation}
                  className="h-16 px-6 bg-white border border-neutral-100 rounded-2xl text-black font-black text-[10px] uppercase tracking-widest hover:border-black transition-all flex items-center gap-3 overflow-hidden"
                >
                  {isGettingLocation ? (
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" />
                      <span className="max-w-[120px] truncate">{currentLocation || 'Location'}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsFilterVisible(!isFilterVisible)}
                  className={`h-16 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${isFilterVisible ? 'bg-black text-white' : 'bg-white border border-neutral-100 text-black hover:border-black'}`}
                >
                  <Filter className="w-4 h-4" /> Filters
                </button>
              </div>
            </div>
          </div>

          {/* Categories / Filters bar */}
          {(isFilterVisible || selectedCategory !== 'All') && (
            <div className="flex flex-wrap gap-2 animate-in slide-in-from-top-2 duration-300">
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-black text-white shadow-lg shadow-black/10' : 'bg-white border border-neutral-100 text-neutral-400 hover:border-neutral-300 hover:text-black'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grid Content */}
        <div className="mt-12">
          {searchType === 'products' ? (
            loadingProducts ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="aspect-[3/4] bg-neutral-100 rounded-3xl"></div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mb-6">
                  <Package className="w-8 h-8 text-neutral-200" />
                </div>
                <h3 className="text-xl font-black mb-2">No matching drops</h3>
                <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Adjust your filters or try a different search</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {filteredProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="group bg-white rounded-[32px] overflow-hidden border border-neutral-100 transition-all hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] hover:scale-[1.02]"
                  >
                    <div className="aspect-[3/4] relative overflow-hidden bg-neutral-50">
                      <FastImage
                        src={product.image || product.imageUrl}
                        alt={product.name}
                        fill
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      {product.originalPrice && product.price < product.originalPrice && (
                        <div className="absolute top-4 left-4 bg-red-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg">
                          {Math.round((1 - product.price / product.originalPrice) * 100)}% Off
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg text-neutral-400 hover:text-red-500 transition-all active:scale-95"
                      >
                        <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>
                    </div>
                    <div className="p-6">
                      <div className="flex flex-col gap-1 mb-4">
                        <span className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em]">{product.brand || 'Premium'}</span>
                        <h3 className="font-black text-lg text-black leading-tight line-clamp-1">{product.name}</h3>
                      </div>
                      <div className="flex items-end justify-between">
                        <div className="flex flex-col">
                          <span className="text-2xl font-black text-black">₹{product.price.toLocaleString()}</span>
                          {product.originalPrice && <span className="text-xs text-neutral-300 font-bold line-through">₹{product.originalPrice.toLocaleString()}</span>}
                        </div>
                        <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:bg-neutral-800 transition-colors">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            // Stores View
            loadingSellers ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-64 bg-neutral-100 rounded-3xl animate-pulse"></div>
                ))}
              </div>
            ) : filteredSellers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mb-6">
                  <Store className="w-8 h-8 text-neutral-200" />
                </div>
                <h3 className="text-xl font-black mb-2">No stores found</h3>
                <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Try searching for a different area </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredSellers.map((seller) => (
                  <Link
                    key={seller.id}
                    href={`/seller/${seller.id}`}
                    className="group bg-white p-6 md:p-8 rounded-[40px] border border-neutral-100 flex gap-6 md:gap-8 transition-all hover:bg-neutral-50/50 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] hover:border-neutral-200"
                  >
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-neutral-100 rounded-[32px] overflow-hidden shrink-0 border border-neutral-50 shadow-sm transition-transform duration-500 group-hover:scale-105">
                      <FastImage
                        src={seller.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${seller.businessName}`}
                        alt={seller.businessName}
                        fill
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col flex-1 py-1">
                      <div className="flex justify-between items-start mb-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl md:text-2xl font-black text-black">{seller.businessName}</h3>
                            {seller.isVerified && <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center shadow-lg"><Star className="w-2 h-2 text-white fill-current" /></div>}
                          </div>
                          <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest flex items-center gap-2">
                            <Package className="w-3 h-3" /> {seller.stats?.totalProducts || 12} Items Listed
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1.5 rounded-full border border-neutral-100">
                          <Star className="w-3.5 h-3.5 text-black fill-current" />
                          <span className="text-xs font-black text-black">{seller.stats?.rating || 4.5}</span>
                        </div>
                      </div>

                      <p className="text-neutral-500 text-sm font-bold line-clamp-2 mb-6 max-w-[300px]">
                        {seller.description || `${seller.businessName} offers a curated collection of premium high-street fashion and exclusive essentials.`}
                      </p>

                      <div className="mt-auto flex items-center justify-between border-t border-neutral-50 pt-6">
                        <div className="flex items-center gap-2 text-[10px] font-black text-black uppercase tracking-widest">
                          <MapPin className="w-3.5 h-3.5 text-neutral-300" /> Bangalore, IN
                        </div>
                        <div className="flex items-center gap-2 text-black font-black text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">
                          Visit Store <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
