'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Package, Sparkles, TrendingUp, Filter, Grid, List, Search, SlidersHorizontal } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import ProductCard from '@/components/product/ProductCard';
import SearchBar from '@/components/product/SearchBar';
import CategoryFilter from '@/components/product/CategoryFilter';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getProductPath } from '@/utils/productUrls';

const UserBrowse: React.FC = () => {
  const router = useRouter();
  const { state, setUserLocation } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'popular'>('newest');

  const categories = ['All', 'Essential Knits', 'Tailored Pieces', 'Outerwear', 'Accessories', 'Footwear', 'Jewelry', 'Home', 'Beauty'];

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    setLoading(true);
    // Get user's location
    if (!state.userLocation) {
      getUserLocation().then(location => {
        if (location) {
          setUserLocation(location);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [state.userLocation, setUserLocation]);

  const approvedShops = state.shops.filter(shop => shop.approved);

  const filteredProducts = state.products
    .filter(product => {
      const shop = approvedShops.find(s => s.id === product.shopId);
      return shop; // Only show products from approved shops
    })
    .filter(product => selectedCategory === 'All' || product.category === selectedCategory)
    .filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'popular':
          return ((b as any).views || 0) - ((a as any).views || 0);
        case 'newest':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

  const getShopWithDistance = (shopId: string) => {
    const shop = approvedShops.find(s => s.id === shopId);
    if (!shop || !state.userLocation) return { shop, distance: undefined };

    const distance = getDistance(
      state.userLocation.latitude,
      state.userLocation.longitude,
      shop.latitude,
      shop.longitude
    );

    return { shop, distance };
  };

  const handleProductClick = (product: { id: string; slug?: string }) => {
    router.push(getProductPath(product));
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/20 transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>

      {/* Premium Hero Section */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full mb-4 border border-white/30">
              <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
              <span className="text-white text-sm font-bold uppercase tracking-wider">Curated Collections</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
              Explore Our
              <span className="block mt-2 bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 bg-clip-text text-transparent">
                Collections
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-6 font-medium">
              Discover premium products from verified boutiques and artisans
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 text-white/80">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-bold">{filteredProducts.length} Products</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-bold">{approvedShops.length} Verified Shops</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-8">
            <path d="M0 60L60 55C120 50 240 40 360 35C480 30 600 30 720 32.5C840 35 960 40 1080 42.5C1200 45 1320 45 1380 45L1440 45V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="white" />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-100 p-6 mb-8 shadow-xl">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search collections, products, brands..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-300 transition-all outline-none"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2">
            <span className="text-sm font-bold text-gray-500 mr-2 flex-shrink-0">Categories:</span>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide transition-all whitespace-nowrap ${selectedCategory === category
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Filters and View Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-300 outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-md' : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-md' : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Location Status */}
        {state.userLocation && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center">
            <MapPin className="w-5 h-5 text-green-600 mr-3" />
            <span className="text-green-800 text-sm font-bold">
              📍 Showing nearby boutiques and artisans
            </span>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'} Found
          </h2>
          <p className="text-gray-500 mt-1">
            {selectedCategory !== 'All' && `in ${selectedCategory}`}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-semibold">Loading amazing collections...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-100 to-red-100 rounded-full blur-3xl opacity-50 animate-pulse"></div>

              <div className="relative bg-white rounded-3xl p-12 md:p-16 shadow-2xl border border-gray-100">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-6">
                    <Package className="w-10 h-10 text-purple-600" strokeWidth={1.5} />
                  </div>

                  <h2 className="text-3xl md:text-4xl font-black mb-3 text-gray-900 text-center">No Collections Found</h2>
                  <p className="text-gray-500 mb-8 text-center max-w-md text-lg leading-relaxed">
                    {searchTerm || selectedCategory !== 'All'
                      ? 'Try adjusting your search or filters to find what you\'re looking for'
                      : 'No collections available at the moment. Check back soon!'}
                  </p>

                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('All');
                    }}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-black uppercase tracking-wider rounded-full hover:from-purple-700 hover:to-pink-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid'
            ? 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {filteredProducts.map((product, index) => {
              const { shop, distance } = getShopWithDistance(product.shopId);

              return (
                <div
                  key={product.id}
                  className="animate-fadeIn"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ProductCard
                    product={{ ...product, image: product.imageUrl }}
                    shop={shop}
                    distance={distance}
                    onClick={() => handleProductClick(product)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserBrowse;