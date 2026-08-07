'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Heart, ShoppingBag, Star, MapPin, Store,
  ArrowLeft, Filter, Grid, List, Search,
  ExternalLink, Package, ChevronRight, Sparkles, TrendingUp
} from 'lucide-react';
import ReserveButton from '../components/common/ReserveButton';
import OptimizedImage from '../components/common/OptimizedImage';
import { getProducts, getSellerProfiles } from '@/lib/supabase/products';
import { useCart } from '../contexts/CartContext';
import { useSEO, SEOConfigs } from '../hooks/useSEO';
import { useCategories } from '../hooks/useCategories';
import { formatCategoryName } from '../lib/categories/format';
import { getProductPath } from '@/utils/productUrls';

const circleFashionSrc = '/assets/images/banner/men/circle_fashion.jpg';
const kidsSrc = '/assets/images/kids.jpg';
const shoeSrc = '/assets/images/shoe.jpg';
const accessoriesSrc = '/assets/images/accessories .jpg';
const sportsSrc = '/assets/images/sports.jpg';
const electronicsSrc = '/assets/images/electronic .jpg';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory?: string;
  searchKeywords?: string[];
  brand: string;
  image: string;
  images?: string[];
  stock: number;
  rating: number;
  reviews: number;
  tags: string[];
  featured: boolean;
  status: 'active' | 'inactive' | 'draft';
  sellerId: string;
  sellerName?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Seller {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  address: string;
  stats: {
    totalProducts: number;
    totalSales: number;
    totalOrders: number;
    rating: number;
  };
}

const CategoriesPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category');
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // SEO Configuration
  useSEO(SEOConfigs.categories);
  const { topLevel: firestoreCategories } = useCategories();
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart, getCartItemCount, updateQuantity } = useCart();
  const [availableCategories, setAvailableCategories] = useState<Array<{ name: string; originalName?: string; image: string; count?: number }>>([]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Redirect legacy ?category= URLs to SEO-friendly routes
  useEffect(() => {
    if (!selectedCategory || availableCategories.length === 0) return;
    const match = availableCategories.find(
      (c) =>
        c.name.toLowerCase() === selectedCategory.toLowerCase() ||
        c.originalName?.toLowerCase() === selectedCategory.toLowerCase()
    );
    if (match?.originalName) {
      router.replace(`/categories/${match.originalName}`);
    }
  }, [selectedCategory, availableCategories, router]);

  // Category images mapping
  const categoryImageMap: Record<string, string> = {
    'men': circleFashionSrc,
    'women': circleFashionSrc,
    'fashion': circleFashionSrc,
    'kids': kidsSrc,
    'watches': accessoriesSrc,
    'accessories': accessoriesSrc,
    'jewellery': accessoriesSrc,
    'sportswear': sportsSrc,
    'sports': sportsSrc,
    'footwear': shoeSrc,
    'beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop',
    'lingerie': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=300&fit=crop',
    'home-lifestyle': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=300&fit=crop',
    'gifting-guide': 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=300&h=300&fit=crop',
    'electronics': electronicsSrc
  };

  // Category gradient colors
  const categoryGradients: Record<string, string> = {
    'Men': 'from-blue-500 via-indigo-500 to-purple-600',
    'Women': 'from-pink-500 via-rose-500 to-red-500',
    'Kids': 'from-yellow-400 via-orange-400 to-red-500',
    'Watches': 'from-gray-700 via-gray-800 to-black',
    'Accessories': 'from-purple-500 via-pink-500 to-rose-500',
    'Jewellery': 'from-yellow-500 via-amber-500 to-orange-600',
    'Sports': 'from-green-500 via-emerald-500 to-teal-600',
    'Footwear': 'from-slate-600 via-gray-700 to-zinc-800',
    'Beauty': 'from-pink-400 via-purple-400 to-indigo-500',
    'Lingerie': 'from-rose-400 via-pink-500 to-fuchsia-600',
    'Home & Lifestyle': 'from-teal-500 via-cyan-500 to-blue-600',
    'Gifting Guide': 'from-red-500 via-pink-500 to-purple-600',
    'Electronics': 'from-blue-600 via-cyan-600 to-teal-600'
  };

  // Category name formatting handled by shared lib (formatCategoryName)

  // Fetch products and sellers
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const productsData = (await getProducts()).filter(
          (product) => product.status === 'active'
        ) as Product[];

        const sellersData = (await getSellerProfiles()).map((seller) => ({
          ...seller,
          stats: seller.stats || {
            totalProducts: 0,
            totalSales: 0,
            totalOrders: 0,
            rating: 0
          }
        })) as Seller[];

        setProducts(productsData);
        setSellers(sellersData);

        // Build categories from Firestore taxonomy + live product counts
        const categoryCounts: Record<string, number> = {};
        productsData.forEach((product) => {
          const cat = product.category?.toLowerCase();
          if (cat) categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        const categoriesWithData = firestoreCategories.map((category) => ({
          name: category.name,
          originalName: category.slug,
          image: category.image || categoryImageMap[category.slug] || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=300&fit=crop',
          count: categoryCounts[category.slug] || 0,
        }));

        // Include legacy product categories not yet in Firestore
        Object.keys(categoryCounts).forEach((slug) => {
          if (!categoriesWithData.find((c) => c.originalName === slug)) {
            categoriesWithData.push({
              name: formatCategoryName(slug, firestoreCategories),
              originalName: slug,
              image: categoryImageMap[slug] || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=300&fit=crop',
              count: categoryCounts[slug],
            });
          }
        });

        categoriesWithData.sort((a, b) => {
          const priority: Record<string, number> = { Men: 1, Women: 2, Kids: 3 };
          const aPriority = priority[a.name] || 99;
          const bPriority = priority[b.name] || 99;
          if (aPriority !== bPriority) return aPriority - bPriority;
          return a.name.localeCompare(b.name);
        });

        setAvailableCategories(categoriesWithData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [firestoreCategories]);

  // Filter products by category and search term
  const filteredProducts = selectedCategory
    ? products.filter(product => {
      const productCategory = product.category?.toLowerCase() || '';
      const selectedCat = selectedCategory.toLowerCase();
      const matchesCategory = productCategory === selectedCat ||
        productCategory.includes(selectedCat) ||
        selectedCat.includes(productCategory);
      const matchesSearch = searchTerm === '' ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (product.subcategory?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (product.searchKeywords?.some((k) => k.includes(searchTerm.toLowerCase())) ?? false);
      return matchesCategory && matchesSearch;
    })
    : products.filter(product => {
      if (searchTerm === '') return true;
      return product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    });

  // Get seller info for a product
  const getSellerInfo = (sellerId: string) => {
    return sellers.find(seller => seller.id === sellerId);
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      brand: product.brand,
      sellerId: product.sellerId,
      sellerName: product.sellerName || 'Unknown Seller'
    });
  };

  const handleProductClick = (product: { id: string; slug?: string }) => {
    router.push(getProductPath(product));
  };

  if (selectedCategory) {
    // Show products for selected category (keep existing implementation)
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-4 pt-10">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{selectedCategory}</h1>
              <p className="text-gray-600">{filteredProducts.length} products found</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search products..."
            />
          </div>
        </div>
        <div className="px-4 py-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600">No products available in this category yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2">
              {filteredProducts.map((product) => {
                const seller = getSellerInfo(product.sellerId);
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200 cursor-pointer"
                    onClick={() => handleProductClick(product)}
                  >
                    <div className="relative h-40">
                      <OptimizedImage
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2 flex flex-col space-y-1">
                        {product.featured && (
                          <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                            ⭐ Featured
                          </span>
                        )}
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-3">
                      {seller && (
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {seller.businessName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <Link
                            href={`/seller/${seller.id}`}
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center"
                          >
                            {seller.businessName}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </Link>
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm mb-1">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-600 mb-2">{product.brand}</p>
                        <div className="mb-2">
                          <span className="text-lg font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-xs text-gray-500 line-through ml-2">
                              ₹{product.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="text-xs mb-2">
                          <span className={`px-2 py-1 rounded-md ${(product.stock || 0) > 10 ? 'bg-green-100 text-green-700' :
                            (product.stock || 0) > 0 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                            {(product.stock || 0) > 10 ? 'In Stock' : (product.stock || 0) > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
                          </span>
                        </div>
                        <ReserveButton
                          product={{
                            id: product.id,
                            name: product.name,
                            price: product.price || 0,
                            originalPrice: product.originalPrice,
                            image: product.image,
                            brand: product.brand,
                            sellerId: product.sellerId,
                            sellerName: seller?.businessName || 'Unknown Seller',
                            category: product.category
                          }}
                          size="sm"
                          className="w-full text-xs"
                          variant="primary"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show premium categories grid
  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>

      {/* Premium Hero Section */}
      <div className="relative bg-gradient-to-br from-black via-gray-900 to-purple-900 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-white/20">
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
              <span className="text-white text-sm font-bold uppercase tracking-wider">Curated Collections</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight">
              Explore Our
              <span className="block mt-2 bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
                Categories
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8 font-medium">
              Discover premium collections handpicked for your style. From fashion to electronics, find everything you love.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 text-white/80">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-bold">{availableCategories.length}+ Categories</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-bold">{products.length}+ Products</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-bold">Premium Quality</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-12 md:h-20">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" />
          </svg>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-6 font-semibold">Loading amazing categories...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight">Browse Collections</h2>
                <p className="text-gray-600 mt-1 font-medium">Choose your style, define your look</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCategories.map((category, index) => {
                const gradient = categoryGradients[category.name] || 'from-gray-600 to-gray-800';

                return (
                  <Link
                    key={category.name}
                    href={`/categories/${category.originalName || category.name.toLowerCase()}`}
                    className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Image Background */}
                    <div className="relative h-64 overflow-hidden">
                      <OptimizedImage
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />

                      {/* Gradient Overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-60 group-hover:opacity-70 transition-opacity duration-500`}></div>

                      {/* Shine Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </div>

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6">
                      <div className="transform transition-transform duration-500 group-hover:translate-y-[-8px]">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight drop-shadow-lg">
                            {category.name}
                          </h3>
                          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                            <ChevronRight className="w-5 h-5 text-white" />
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30">
                            <span className="text-white text-sm font-bold">{category.count || 0} Products</span>
                          </div>
                          <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <span className="text-white text-sm font-bold flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              Explore
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Corner Accent */}
                    <div className="absolute top-4 right-4 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <Sparkles className="w-5 h-5 text-white animate-pulse" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Bottom CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 py-16 mt-12">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4 uppercase tracking-tight">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-white/90 text-lg mb-8 font-medium">
            Browse all products or use our smart search to find exactly what you need
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/browse"
              className="px-8 py-4 bg-white text-purple-600 rounded-full font-black uppercase tracking-wider hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              Browse All Products
            </Link>
            <Link
              href="/"
              className="px-8 py-4 bg-black/20 backdrop-blur-md text-white border-2 border-white/30 rounded-full font-black uppercase tracking-wider hover:bg-black/30 transition-all duration-300"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
