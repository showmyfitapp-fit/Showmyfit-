'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star, Heart, Search, Package, X,
  MapPin, Phone, Instagram, Facebook, Check,
  ArrowLeft, ShoppingBag
} from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import FastImage from '@/components/common/FastImage';
import { collection, query, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  category: string;
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
  categorySpecificData?: {
    sizes?: string[];
    colors?: string;
  };
}

interface Seller {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName?: string;
  businessType?: string;
  address: string;
  profileImage?: string;
  bannerImage?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  stats: {
    totalProducts: number;
    totalSales: number;
    totalOrders: number;
    rating: number;
  };
  createdAt: Date;
}

const SellerProductsPage: React.FC = () => {
  const params = useParams();
  const sellerId = params.sellerId as string;
  const router = useRouter();
  const navigate = (path: any) => {
    if (path === -1) {
      router.back();
    } else {
      router.push(path);
    }
  };
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { getCartItemCount, addToCart } = useCart();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfileImageModal, setShowProfileImageModal] = useState(false);

  // Fetch seller data
  useEffect(() => {
    const fetchSeller = async () => {
      if (!sellerId) return;

      try {
        const sellerDoc = await getDoc(doc(db, 'users', sellerId));
        if (sellerDoc.exists()) {
          const sellerData = sellerDoc.data();
          setSeller({
            id: sellerDoc.id,
            name: sellerData.displayName || sellerData.name || 'Seller',
            email: sellerData.email || '',
            phone: sellerData.phone || '',
            businessName: sellerData.businessName || sellerData.displayName || sellerData.name || '',
            businessType: sellerData.businessType || '',
            address: sellerData.address || sellerData.businessAddress || '',
            profileImage: sellerData.profileImage || '',
            bannerImage: sellerData.bannerImage || sellerData.coverImage || '',
            instagramUrl: sellerData.instagramUrl || sellerData.instagram || '',
            facebookUrl: sellerData.facebookUrl || sellerData.facebook || '',
            stats: {
              totalProducts: 0,
              totalOrders: 0,
              totalSales: 0,
              rating: 0,
              ...sellerData.stats
            },
            createdAt: sellerData.createdAt?.toDate() || new Date()
          } as Seller);
        }
      } catch (error) {
        console.error('Error fetching seller:', error);
      }
    };

    fetchSeller();
  }, [sellerId]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!sellerId) return;

      setLoading(true);
      try {
        const productsQuery = query(
          collection(db, 'products'),
          where('sellerId', '==', sellerId),
          where('status', '==', 'active')
        );
        const snapshot = await getDocs(productsQuery);
        const productsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          };
        }) as Product[];
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [sellerId]);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const toggleWishlist = async (product: Product) => {
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist({
        productId: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        brand: product.brand || 'Unknown Brand',
        category: product.category,
        sellerId: product.sellerId,
        sellerName: seller?.businessName
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-black"></div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Package className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Seller not found</h2>
        <button
          onClick={() => router.push('/browse')}
          className="bg-black text-white px-6 py-2 rounded-full font-bold mt-4 hover:bg-gray-800 transition"
        >
          Back to Browse
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors group"
            >
              <ArrowLeft className="w-6 h-6 text-gray-900 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight hidden sm:block">
                {seller.businessName || seller.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/browse')}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Search className="w-5 h-5 text-gray-900" />
              </button>
              <Link
                href="/cart"
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ShoppingBag className="w-5 h-5 text-gray-900" />
                {getCartItemCount() > 0 && (
                  <span className="absolute top-1 right-0.5 w-4 h-4 bg-black text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-bounce">
                    {getCartItemCount()}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="h-64 md:h-80 w-full overflow-hidden">
          {seller.bannerImage ? (
            <img
              src={seller.bannerImage}
              className="w-full h-full object-cover animate-fade-in"
              alt="Shop Banner"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 animate-gradient-xy" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      </div>

      {/* Profile Card Overlay */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 p-6 md:p-8 backdrop-blur-xl border border-white/50">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
            {/* Avatar */}
            <div className="relative shrink-0">
              <button
                onClick={() => seller.profileImage && setShowProfileImageModal(true)}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-white shadow-xl overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
              >
                {seller.profileImage ? (
                  <img src={seller.profileImage} className="w-full h-full object-cover" alt={seller.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white text-4xl font-bold">
                    {(seller.businessName || seller.name || 'S').charAt(0)}
                  </div>
                )}
              </button>
              <div className="absolute bottom-2 right-2 bg-blue-500 text-white p-1.5 rounded-full border-4 border-white shadow-lg" title="Verified Seller">
                <Check className="w-4 h-4" />
              </div>
            </div>

            {/* Info & Actions */}
            <div className="flex-1 text-center md:text-left space-y-6 w-full">
              <div className="space-y-2">
                <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                  {seller.businessName || seller.name}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-600 font-medium">
                  {seller.businessType && (
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-900 border border-gray-200">
                      {seller.businessType}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full border border-yellow-100">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-bold">{seller.stats?.rating?.toFixed(1) || 'New'}</span>
                    <span className="text-yellow-600/70">Rating</span>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-900 border border-gray-200">
                    {products.length} Products
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                {seller.phone && (
                  <a
                    href={`tel:${seller.phone}`}
                    className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-md hover:shadow-lg"
                  >
                    <Phone className="w-4 h-4" />
                    Contact
                  </a>
                )}
                {seller.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(seller.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-white text-gray-900 border border-gray-200 px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all active:scale-95 shadow-sm hover:shadow-md"
                  >
                    <MapPin className="w-4 h-4 text-gray-500" />
                    Located At
                  </a>
                )}
                {/* Social Buttons */}
                <div className="flex gap-2 pl-2 border-l border-gray-200 ml-2">
                  {seller.instagramUrl && (
                    <a href={seller.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-50 rounded-xl hover:bg-pink-50 text-gray-600 hover:text-pink-600 transition-colors">
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {seller.facebookUrl && (
                    <a href={seller.facebookUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-50 rounded-xl hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors">
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Bar */}
        <div className="max-w-lg mx-auto mb-12">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search in ${seller.businessName || 'store'}...`}
              className="w-full pl-12 pr-12 py-4 bg-white border-2 border-transparent focus:border-black rounded-2xl shadow-lg shadow-gray-100 text-gray-900 placeholder:text-gray-400 outline-none transition-all font-medium text-lg"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-60">
            <Package className="w-24 h-24 text-gray-300 mb-6" />
            <h3 className="text-xl font-bold text-gray-900">No products found</h3>
            <p className="text-gray-500">
              {searchTerm ? `We couldn't find anything matching "${searchTerm}"` : 'This seller hasn\'t added any products yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const discount = product.originalPrice && product.originalPrice > product.price
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;

              return (
                <div
                  key={product.id}
                  className="group relative bg-white rounded-2xl p-3 md:p-4 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  onClick={() => router.push(`/product/${product.id}`)}
                >
                  {/* Image Container */}
                  <div className="aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden mb-4 relative">
                    <FastImage
                      src={product.image || `https://via.placeholder.com/300x400`}
                      alt={product.name}
                      fill
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {discount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
                          -{discount}%
                        </span>
                      )}
                      {product.stock <= 5 && product.stock > 0 && (
                        <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
                          Low Stock
                        </span>
                      )}
                    </div>

                    {/* Wishlist Button (Visible on Hover/Mobile) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product);
                      }}
                      className="absolute top-2 right-2 p-2 rounded-full bg-white/80 backdrop-blur-sm text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white hover:text-red-500"
                    >
                      <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-gray-900 leading-tight line-clamp-2 text-sm md:text-base group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs font-bold text-yellow-500 bg-yellow-50 px-1.5 py-0.5 rounded-md shrink-0">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{product.rating || 'New'}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 font-medium">
                      {product.category}
                    </p>

                    <div className="pt-2 flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-gray-900">
                          ₹{product.price.toLocaleString()}
                        </span>
                        {discount > 0 && (
                          <span className="text-xs text-gray-400 line-through">
                            ₹{product.originalPrice?.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Buy Now Button - Appears on hover for desktop, always visible on mobile if desired, or handled via group-hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (product.stock > 0) {
                            addToCart({
                              id: product.id,
                              name: product.name,
                              price: product.price,
                              originalPrice: product.originalPrice,
                              image: product.image,
                              brand: product.brand,
                              sellerId: product.sellerId,
                              sellerName: product.sellerName,
                              category: product.category,
                              // Default or empty options if not selected
                            });
                            router.push('/cart');
                          }
                        }}
                        disabled={product.stock <= 0}
                        className={`
                          opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0
                          bg-black text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg hover:bg-gray-800 hover:scale-105 active:scale-95
                          flex items-center gap-1
                          ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showProfileImageModal && seller?.profileImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setShowProfileImageModal(false)}
        >
          <button
            onClick={() => setShowProfileImageModal(false)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={seller.profileImage}
            alt="Profile"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default SellerProductsPage;
