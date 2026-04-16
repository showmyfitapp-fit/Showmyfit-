'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShoppingBag,
  Clock,
  ChevronRight,
  Package,
  Heart
} from 'lucide-react';

import ProductCard from '../components/product/ProductCard';
import StoryCard from '../components/common/StoryCard';
import OptimizedImage from '../components/common/OptimizedImage';
// import Chatbot from '../components/common/Chatbot';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import Footer from '../components/layout/Footer';
import { useWishlist } from '../contexts/WishlistContext';
import { useSEO, SEOConfigs } from '../hooks/useSEO';
import { preloadImage } from '../utils/imageOptimization';
import FastImage from '../components/common/FastImage';
import ShareButton from '../components/common/ShareButton';
const circleFashionSrc = '/assets/images/banner/men/circle_fashion.jpg';
const shoeSrc = '/assets/images/shoe.jpg';
const kidsSrc = '/assets/images/kids.jpg';
const accessoriesSrc = '/assets/images/accessories .jpg';
const sportsSrc = '/assets/images/sports.jpg';
const electronicsSrc = '/assets/images/electronic .jpg';
const menSrc = '/assets/images/men.jpg';
const womenSrc = '/assets/images/woemn.jpg';

const HomePage: React.FC = () => {
  const router = useRouter();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [isLoaded, setIsLoaded] = useState(false);

  // SEO Configuration
  useSEO(SEOConfigs.home);

  // Preload critical images for better performance
  useEffect(() => {
    // Preload banner and category images
    preloadImage(circleFashionSrc);
    preloadImage(shoeSrc);
    preloadImage(kidsSrc);
    preloadImage(accessoriesSrc);
    preloadImage(sportsSrc);
    preloadImage(electronicsSrc);
  }, []);
  /* const [nearbyStores, setNearbyStores] = useState<any[]>([]); // Unused
  const [showNearbyStores, setShowNearbyStores] = useState(false); // Unused */
  // Quick View removed
  const [sellers, setSellers] = useState<any[]>([]);
  // const [loadingSellers, setLoadingSellers] = useState(true); // Unused
  const [homePageSections, setHomePageSections] = useState<any[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Category name formatting function
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

  // Filter products by selected category
  const getFilteredProducts = () => {
    if (selectedCategory === 'All') {
      return allProducts.filter(product => product.status === 'active');
    }
    return allProducts.filter(product => {
      if (product.status !== 'active') return false;

      // Special case: 'Fashion' shows both Men and Women products
      if (selectedCategory === 'Fashion') {
        const productCategoryFormatted = formatCategoryName(product.category || '');
        return productCategoryFormatted === 'Men' ||
          productCategoryFormatted === 'Women' ||
          product.category?.toLowerCase() === 'men' ||
          product.category?.toLowerCase() === 'women';
      }

      // Regular category matching
      const productCategoryFormatted = formatCategoryName(product.category || '');
      return productCategoryFormatted === selectedCategory ||
        product.category?.toLowerCase() === selectedCategory.toLowerCase() ||
        productCategoryFormatted.toLowerCase() === selectedCategory.toLowerCase();
    });
  };

  const filteredProducts = getFilteredProducts();

  useEffect(() => {
    setIsLoaded(true);
  }, []);


  // Fetch home page sections and products
  useEffect(() => {
    const fetchHomePageData = async () => {
      setLoadingSections(true);
      try {
        // Load home page sections
        const sectionsQuery = query(
          collection(db, 'homePageSections'),
          where('isActive', '==', true),
          orderBy('displayOrder', 'asc')
        );
        const sectionsSnapshot = await getDocs(sectionsQuery);
        const sectionsData = sectionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setHomePageSections(sectionsData);

        // Load all products
        const productsQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => {
          const data = doc.data();
          // Handle both image and imageUrl fields
          const imageSrc = data.image || data.imageUrl || '';

          return {
            id: doc.id,
            ...data,
            image: imageSrc // Standardize on 'image'
          };
        });
        setAllProducts(productsData);

        // Preload product images for better performance
        productsData.slice(0, 10).forEach(product => {
          if (product.image) {
            preloadImage(product.image);
          }
        });

        // Load recently viewed products from localStorage
        const storedRecentlyViewed = localStorage.getItem('recentlyViewedProducts');
        if (storedRecentlyViewed) {
          try {
            const viewedIds = JSON.parse(storedRecentlyViewed);
            setRecentlyViewed(viewedIds);
          } catch (error) {
            console.error('Error parsing recently viewed products:', error);
            setRecentlyViewed([]);
          }
        }
      } catch (error) {
        console.error('Error loading home page data:', error);
      } finally {
        setLoadingSections(false);
      }
    };

    fetchHomePageData();
  }, []);

  // Fetch sellers from database
  useEffect(() => {
    const fetchSellers = async () => {
      // setLoadingSellers(true);
      try {
        // Query users collection for approved sellers (shop role with approved status)
        const usersQuery = query(
          collection(db, 'users'),
          where('role', '==', 'shop')
        );
        const snapshot = await getDocs(usersQuery);

        const sellersList: any[] = [];
        snapshot.docs.forEach((doc) => {
          const userData = doc.data();

          // Only include users who are approved sellers
          if (userData.role === 'shop' && userData.sellerApplication?.status === 'approved') {
            sellersList.push({
              id: doc.id,
              userId: doc.id,
              name: userData.displayName || userData.name || 'Unknown Seller',
              email: userData.email || 'No email',
              phone: userData.phone || 'No phone',
              businessName: userData.businessName || 'No business name',
              businessType: userData.businessType || 'No type',
              address: userData.address || userData.businessAddress || 'No address',
              location: userData.location || null, // Real location data
              stats: userData.stats || {
                totalProducts: Math.floor(Math.random() * 50) + 10,
                totalSales: Math.floor(Math.random() * 1000) + 100,
                totalOrders: Math.floor(Math.random() * 200) + 20,
                rating: Math.random() * 2 + 3 // Random rating between 3-5
              },
              createdAt: userData.createdAt || new Date()
            });
          }
        });

        // If no sellers found, show empty state
        if (sellersList.length === 0) {
          setSellers([]);
        } else {
          // Show all real sellers
          setSellers(sellersList);
        }

      } catch (error) {
        console.error('Error loading sellers:', error);
        // Show empty state on error
        setSellers([]);
      } finally {
        // setLoadingSellers(false); // Removed
      }
    };

    fetchSellers();
  }, []);





  const toggleWishlist = async (product: any) => {
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
        sellerName: product.sellerName
      });
    }
  };




  const handleProductClick = (productId: string) => {
    console.log('HomePage: handleProductClick called with ID:', productId);
    if (!productId) {
      console.error('HomePage: Missing productId');
      return;
    }

    // Add to recently viewed
    const updatedRecentlyViewed = [productId, ...recentlyViewed.filter(id => id !== productId)].slice(0, 10);
    setRecentlyViewed(updatedRecentlyViewed);
    localStorage.setItem('recentlyViewedProducts', JSON.stringify(updatedRecentlyViewed));

    console.log('HomePage: Navigating to /product/' + productId);
    router.push(`/product/${productId}`);
  };

  // Get products for a specific section
  const getSectionProducts = (productIds: string[]) => {
    return allProducts.filter(product => productIds.includes(product.id));
  };






  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Main Content */}
      <div className="pt-0">
        {/* Plain Text Category Bar - Above Circular Categories */}
        <section className="bg-white/95 backdrop-blur-md sticky top-[92px] md:top-20 z-20 border-b border-neutral-100 shadow-sm transition-all duration-300">
          <div className="max-w-7xl mx-auto px-3 md:px-6 py-2.5 md:py-4">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {['All', 'Men', 'Women', 'Kids', 'Watches'].map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    if (category !== 'All') {
                      setTimeout(() => {
                        const element = document.getElementById('category-products-section');
                        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }
                  }}
                  className={`px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 whitespace-nowrap ${selectedCategory === category
                    ? 'bg-black text-white shadow-xl shadow-black/10 scale-105'
                    : 'text-neutral-400 hover:text-black hover:bg-neutral-50'
                    }`}
                >
                  {category}
                </button>
              ))}
              {/* Grid icon on the right */}
              <button
                onClick={() => router.push('/categories')}
                className="ml-auto flex-shrink-0 p-1.5 md:p-2.5 rounded-lg md:rounded-xl text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 active:scale-95"
                title="View all categories"
                aria-label="View all categories"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* Unified Category Section */}
        <section className="py-8 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Shop by Category</h2>
              <button
                onClick={() => router.push('/categories')}
                className="text-purple-600 font-medium hover:text-purple-700 transition-colors flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex space-x-6 md:space-x-10 overflow-x-auto scrollbar-hide py-4 snap-x">
              {[
                { name: 'Fashion', image: circleFashionSrc, bg: 'bg-neutral-50' },
                { name: 'Kids', image: kidsSrc, bg: 'bg-neutral-50' },
                { name: 'Footwear', image: shoeSrc, bg: 'bg-neutral-50' },
                { name: 'Accessories', image: accessoriesSrc, bg: 'bg-neutral-50' },
                { name: 'Electronics', image: electronicsSrc, bg: 'bg-neutral-50' },
                { name: 'Beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop', bg: 'bg-neutral-50' },
                { name: 'Sports', image: sportsSrc, bg: 'bg-neutral-50' }
              ].map((category, index) => (
                <button
                  key={index}
                  onClick={() => router.push(`/browse?category=${encodeURIComponent(category.name)}`)}
                  className="flex flex-col items-center gap-4 flex-shrink-0 group snap-center"
                >
                  <div className="relative">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-black transition-all duration-500 shadow-sm group-hover:shadow-2xl group-hover:-translate-y-2">
                      <OptimizedImage
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100"
                        sizes="96px"
                      />
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-black/5 blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 group-hover:text-black transition-colors">
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Trending Stories / Live Drops Section */}
        <section className="py-8 bg-black overflow-hidden relative">
          {/* Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900 blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900 blur-[100px] animate-pulse"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-baseline justify-between gap-4 mb-10">
              <div>
                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter flex items-center gap-4">
                  TRENDING <span className="underline decoration-purple-500/50 decoration-4 underline-offset-8 font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">STYLES</span>
                </h2>
                <div className="flex items-center gap-3 mt-4">
                  <div className="h-0.5 w-12 bg-purple-500"></div>
                  <p className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.3em]">Curated Fashion Fits</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/browse')}
                className="px-6 py-2 border border-white/30 rounded-full text-white font-bold hover:bg-white hover:text-black transition-all duration-300 uppercase tracking-widest text-sm"
              >
                View All
              </button>
            </div>

            <div className="flex space-x-6 overflow-x-auto scrollbar-hide pb-8 snap-x">
              <StoryCard
                image={menSrc}
                title="Urban Men"
                ctaLink="/browse?category=Men"
                brandLogo=""
              />
              <StoryCard
                image={womenSrc}
                title="Chic Styles"
                ctaLink="/browse?category=Women"
                isVideo={true}
              />
              <StoryCard
                image={sportsSrc}
                title="Active Life"
                ctaLink="/browse?category=Sports"
                brandLogo=""
              />
              <StoryCard
                image={circleFashionSrc}
                title="New Drops"
                ctaLink="/browse?category=Fashion"
                isVideo={true}
              />
              <StoryCard
                image={kidsSrc}
                title="Kids Fun"
                ctaLink="/browse?category=Kids"
                brandLogo=""
              />
            </div>
          </div>
        </section>

        {/* Category Products Section - Shows when category is selected */}
        {selectedCategory !== 'All' && (
          <div id="category-products-section" className="animate-fadeIn">
            {/* Banner for Category */}
            <section className="relative bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 py-6 md:py-10 my-3 md:my-4 overflow-hidden">
              {/* Animated background elements */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
              </div>
              <div className="relative max-w-7xl mx-auto px-4 text-center">
                <div className="inline-block mb-2">
                  <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-1 rounded-full text-sm font-medium">
                    {filteredProducts.length} Products Available
                  </span>
                </div>
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                  Explore {selectedCategory} Collection
                </h2>
                <p className="text-blue-50 text-sm md:text-base max-w-2xl mx-auto">
                  Discover amazing {selectedCategory.toLowerCase()} products handpicked just for you
                </p>
                <div className="mt-4 md:mt-5 flex justify-center">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            </section>

            {/* Filtered Products Grid */}
            <section className="max-w-7xl mx-auto px-4 py-4 md:py-6">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                    {selectedCategory} Products
                  </h2>
                  <p className="text-gray-600 text-sm md:text-base">
                    Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                  </p>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
                  <div className="inline-block p-4 bg-white rounded-full mb-4 shadow-lg">
                    <Package className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-6">No products available in {selectedCategory} category yet.</p>
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    View All Products
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {filteredProducts.slice(0, 20).map((product: any) => {
                    const seller = sellers.find(s => s.id === product.sellerId);

                    return (
                      <ProductCard
                        key={product.id}
                        product={{
                          ...product,
                          image: product.image // Ensure image prop name matches
                        }}
                        shop={seller ? {
                          id: seller.id,
                          name: seller.businessName || seller.name,
                          address: seller.address
                        } : undefined}
                        isWishlisted={isInWishlist(product.id)}
                        onToggleWishlist={() => toggleWishlist(product)}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Featured Deals Section - Below Categories */}
        <section className="py-3 md:py-4 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Trending Now Section */}
            <section className="py-6 px-4 bg-gradient-to-r from-purple-50 via-white to-purple-50">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-end justify-between mb-10">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-black uppercase tracking-tight">Trending Now</h2>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mt-2">Hottest picks of the season</p>
                  </div>
                  <button
                    onClick={() => router.push('/browse')}
                    className="text-[10px] font-black text-black uppercase tracking-widest hover:underline underline-offset-8 transition-all"
                  >
                    View All
                  </button>
                </div>

                <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4 snap-x">
                  {[
                    {
                      id: '1',
                      name: 'Premium T-Shirt',
                      brand: 'Fashion Hub',
                      price: 899,
                      originalPrice: 1499,
                      image: menSrc,
                      category: 'Men'
                    },
                    {
                      id: '2',
                      name: 'Designer Dress',
                      brand: 'Style Queen',
                      price: 1299,
                      originalPrice: 2499,
                      image: womenSrc,
                      category: 'Women'
                    },
                    {
                      id: '3',
                      name: 'Kids Sneakers',
                      brand: 'Little Steps',
                      price: 599,
                      originalPrice: 999,
                      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop',
                      category: 'Kids'
                    },
                    {
                      id: '4',
                      name: 'Wireless Headphones',
                      brand: 'TechPro',
                      price: 1999,
                      originalPrice: 2999,
                      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
                      category: 'Electronics'
                    }
                  ].map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product as any}
                      className="w-48 md:w-64 flex-shrink-0 snap-center"
                      isWishlisted={isInWishlist(product.id)}
                      onToggleWishlist={() => toggleWishlist(product)}
                      onClick={() => router.push(`/browse?category=${encodeURIComponent(product.category)}`)}
                    />
                  ))}
                </div>
              </div>
            </section>
          </div>
        </section>

        {/* Recommended for You */}
        <section className="py-6 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Recommended for You</h2>
              <button
                onClick={() => router.push('/browse')}
                className="text-purple-600 font-medium hover:text-purple-700 transition-colors flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="relative group">
              <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4 snap-x">
                {allProducts.length > 0 ? (
                  allProducts.slice(0, 8).map((product, index) => (
                    <ProductCard
                      key={product.id || index}
                      product={{
                        ...product,
                        image: product.image || `https://placehold.co/300x300/e2e8f0/64748b?text=No+Image`
                      }}
                      className="w-40 md:w-56 flex-shrink-0 snap-center"
                      isWishlisted={isInWishlist(product.id)}
                      onToggleWishlist={() => toggleWishlist(product)}
                    />
                  ))
                ) : (
                  <div className="flex-shrink-0 w-full text-center py-8">
                    <p className="text-gray-500 text-sm">No recommendations available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Trust Indicators Section */}
        <section className="py-12 bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Quality Guaranteed</h3>
                <p className="text-sm text-gray-500">Verified authentic products</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Fast Delivery</h3>
                <p className="text-sm text-gray-500">Express shipping available</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Secure Payment</h3>
                <p className="text-sm text-gray-500">100% secure transactions</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Easy Returns</h3>
                <p className="text-sm text-gray-500">Hassle-free return policy</p>
              </div>
            </div>
          </div>
        </section>

        {/* Advertisement Banner - Category Grid */}
        <section className="py-3 md:py-4 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="relative bg-gradient-to-br from-[#0B1426] via-[#1a2332] to-[#0F172A] rounded-2xl overflow-hidden border-2 border-yellow-500/40 shadow-2xl shadow-yellow-500/10">
              {/* Decorative Gold Border Pattern */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400/80 to-transparent"></div>

              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(234,179,8,0.3),transparent_70%)]"></div>
              </div>

              {/* Header */}
              <div className="relative px-4 md:px-6 py-3 md:py-4 text-center border-b border-purple-500/30 bg-gradient-to-r from-purple-500/5 via-transparent to-purple-500/5">
                <h2 className="text-xl md:text-2xl font-extrabold text-white mb-1 tracking-wider drop-shadow-lg">
                  <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-purple-400 bg-clip-text text-transparent">
                    TOP COLLECTIONS
                  </span>
                </h2>
                <p className="text-purple-300 text-xs md:text-sm font-semibold tracking-wide">Must-Have Essentials</p>
              </div>

              {/* Category Grid */}
              <div className="relative p-3 md:p-4 space-y-4">
                {/* First Row */}
                <div className="flex space-x-3 md:space-x-4 overflow-x-auto scrollbar-hide pb-1 scroll-smooth">
                  {[
                    { name: 'JEANS', offer: 'UNDER ₹1199*', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop', category: 'men' },
                    { name: 'SPORTS', offer: 'MIN. 40%', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop', category: 'footwear' },
                    { name: 'TOPS', offer: 'UNDER ₹599*', image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&h=300&fit=crop', category: 'women' },
                    { name: 'SWEATS', offer: '40-70%', image: 'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=300&h=300&fit=crop', category: 'sportswear' },
                    { name: 'SAREES', offer: 'MIN. 60% OFF*', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=300&fit=crop', category: 'women' },
                    { name: 'KIDS WESTERNWEAR', offer: 'MIN. 50% OFF*', image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=300&h=300&fit=crop', category: 'kids' },
                    { name: 'KIDS ETHNICWEAR', offer: 'MIN. 50% OFF*', image: 'https://images.unsplash.com/photo-1515488042361-ee00e0dbc4ca?w=300&h=300&fit=crop', category: 'kids' },
                    { name: 'MATERNITY', offer: 'MIN 40%', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop', category: 'women' },
                  ].map((item, index) => (
                    <div
                      key={index}
                      onClick={() => router.push(`/browse?category=${item.category}`)}
                      className="flex-shrink-0 w-32 md:w-36 relative group cursor-pointer"
                    >
                      <div className="relative bg-gradient-to-br from-[#1a2332] via-[#1e293b] to-[#0B1426] rounded-xl border-2 border-yellow-500/50 overflow-hidden transition-all duration-300 hover:border-yellow-400 hover:shadow-xl hover:shadow-yellow-500/30 hover:-translate-y-1">
                        {/* Gold Corner Accents */}
                        <div className="absolute top-0 left-0 w-4 h-4 bg-gradient-to-br from-yellow-400/80 to-transparent opacity-70 z-10"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-bl from-yellow-400/80 to-transparent opacity-70 z-10"></div>

                        {/* Product Image */}
                        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
                          <OptimizedImage
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300';
                            }}
                          />
                          {/* Overlay on hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>

                        {/* Category Info */}
                        <div className="p-2.5 md:p-3 text-center bg-gradient-to-b from-[#1a2332] to-[#0B1426]">
                          <h3 className="text-xs md:text-sm font-bold text-white mb-1 uppercase tracking-wider line-clamp-1 group-hover:text-yellow-300 transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-yellow-400 text-xs font-bold tracking-wide group-hover:text-yellow-300 transition-colors">
                            {item.offer}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Second Row */}
                <div className="flex space-x-3 md:space-x-4 overflow-x-auto scrollbar-hide pb-1 scroll-smooth">
                  {[
                    { name: 'SHOES', offer: 'UP TO 50% OFF', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop', category: 'footwear' },
                    { name: 'DRESSES', offer: 'UNDER ₹1499*', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=300&fit=crop', category: 'women' },
                    { name: 'SHIRTS', offer: 'UNDER ₹999*', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=300&fit=crop', category: 'men' },
                    { name: 'BAGS', offer: 'MIN. 40% OFF*', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop', category: 'accessories' },
                    { name: 'WATCHES', offer: 'UP TO 60% OFF', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop', category: 'watches' },
                    { name: 'JEWELLERY', offer: 'MIN. 50% OFF*', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&h=300&fit=crop', category: 'jewellery' },
                    { name: 'BEAUTY', offer: 'BUY 1 GET 1', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop', category: 'beauty' },
                    { name: 'ACCESSORIES', offer: 'UNDER ₹499*', image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300&h=300&fit=crop', category: 'accessories' },
                    { name: 'PERFUMES', offer: 'UP TO 40% OFF', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=300&fit=crop', category: 'fragrances' },
                  ].map((item, index) => (
                    <div
                      key={index}
                      onClick={() => router.push(`/browse?category=${item.category}`)}
                      className="flex-shrink-0 w-32 md:w-36 relative group cursor-pointer"
                    >
                      <div className="relative bg-gradient-to-br from-[#1a2332] via-[#1e293b] to-[#0B1426] rounded-xl border-2 border-yellow-500/50 overflow-hidden transition-all duration-300 hover:border-yellow-400 hover:shadow-xl hover:shadow-yellow-500/30 hover:-translate-y-1">
                        {/* Gold Corner Accents */}
                        <div className="absolute top-0 left-0 w-4 h-4 bg-gradient-to-br from-yellow-400/80 to-transparent opacity-70 z-10"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-bl from-yellow-400/80 to-transparent opacity-70 z-10"></div>

                        {/* Product Image */}
                        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
                          <OptimizedImage
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300';
                            }}
                          />
                          {/* Overlay on hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>

                        {/* Category Info */}
                        <div className="p-2.5 md:p-3 text-center bg-gradient-to-b from-[#1a2332] to-[#0B1426]">
                          <h3 className="text-xs md:text-sm font-bold text-white mb-1 uppercase tracking-wider line-clamp-1 group-hover:text-yellow-300 transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-yellow-400 text-xs font-bold tracking-wide group-hover:text-yellow-300 transition-colors">
                            {item.offer}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- DYNAMIC PRODUCT SECTIONS --- */}

        {/* Helper function to render product sections */}
        {allProducts.length > 0 && (
          <>
            {/* New Arrivals Section */}
            <section className="py-6 md:py-8 bg-white">
              <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">New Arrivals</h2>
                    <p className="text-sm text-gray-500 mt-1">Fresh looks just landed</p>
                  </div>
                  <button
                    onClick={() => router.push('/browse?sort=newest')}
                    className="text-purple-600 text-sm font-semibold hover:text-purple-700 transition-colors"
                  >
                    View All →
                  </button>
                </div>

                <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
                  {allProducts.slice(0, 8).map((product) => (
                    <div
                      key={product.id}
                      className="flex-shrink-0 w-40 md:w-56 cursor-pointer group"
                      onClick={() => handleProductClick(product.id)}
                    >
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden relative">
                        <div className="aspect-[4/5] relative bg-gray-100 overflow-hidden">
                          <FastImage
                            src={product.image || `https://images.unsplash.com/photo-${1500000000000 + Math.random()}?w=300&h=400&fit=crop`}
                            alt={product.name}
                            width={300}
                            height={400}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          {/* New Badge */}
                          <div className="absolute top-2 left-2 bg-black text-white text-[10px] uppercase font-bold px-2 py-1 rounded">
                            NEW
                          </div>
                          {/* Wishlist */}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white"
                          >
                            <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'text-red-500 fill-red-500' : 'text-gray-900'}`} />
                          </button>
                        </div>
                        <div className="p-3">
                          <h3 className="font-bold text-gray-900 text-sm line-clamp-1 mb-0.5">{product.brand || 'ShowMyFit'}</h3>
                          <p className="text-sm text-gray-600 line-clamp-1 mb-1.5">{product.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">₹{product.price}</span>
                            {product.originalPrice && (
                              <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Men's Collection Section */}
            <section className="py-6 md:py-8 bg-gray-50">
              <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">Men's Collection</h2>
                    <p className="text-sm text-gray-500 mt-1">Trendy picks for him</p>
                  </div>
                  <button
                    onClick={() => router.push('/browse?category=Men')}
                    className="text-purple-600 text-sm font-semibold hover:text-purple-700 transition-colors"
                  >
                    View All →
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                  {allProducts
                    .filter(p => p.category?.toLowerCase() === 'men' || p.category?.toLowerCase() === 'fashion')
                    .slice(0, 5)
                    .map((product) => (
                      <div
                        key={product.id}
                        className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => handleProductClick(product.id)}
                      >
                        <div className="aspect-square relative overflow-hidden bg-gray-100 rounded-t-lg">
                          <FastImage
                            src={product.image}
                            alt={product.name}
                            width={300}
                            height={300}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="p-2 md:p-3">
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">{product.brand}</h3>
                          <p className="text-sm font-medium text-gray-900 line-clamp-1 mb-1">{product.name}</p>
                          <p className="text-sm font-bold text-gray-900">₹{product.price}</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </section>

            {/* Women's Collection Section */}
            <section className="py-6 md:py-8 bg-white">
              <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">Women's Collection</h2>
                    <p className="text-sm text-gray-500 mt-1">Elegant styles for her</p>
                  </div>
                  <button
                    onClick={() => router.push('/browse?category=Women')}
                    className="text-purple-600 text-sm font-semibold hover:text-purple-700 transition-colors"
                  >
                    View All →
                  </button>
                </div>

                <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
                  {allProducts
                    .filter(p => p.category?.toLowerCase() === 'women' || p.category?.toLowerCase() === 'fashion')
                    .slice(0, 6)
                    .map((product) => (
                      <div
                        key={product.id}
                        className="flex-shrink-0 w-40 md:w-56 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => handleProductClick(product.id)}
                      >
                        <div className="aspect-[4/5] relative overflow-hidden bg-gray-100 rounded-t-lg">
                          <FastImage
                            src={product.image}
                            alt={product.name}
                            width={300}
                            height={400}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-medium text-gray-900 line-clamp-1 mb-1">{product.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-900">₹{product.price}</p>
                            <p className="text-xs text-green-600 font-bold">
                              {product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 10}% off
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </section>

            {/* Footwear Section */}
            <section className="py-6 md:py-8 bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">Trendy Footwear</h2>
                    <p className="text-sm text-gray-500 mt-1">Step up your style game</p>
                  </div>
                  <button
                    onClick={() => router.push('/browse?category=Footwear')}
                    className="text-orange-600 text-sm font-semibold hover:text-orange-700 transition-colors"
                  >
                    View All →
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                  {allProducts
                    .filter(p => p.category?.toLowerCase() === 'footwear' || p.category?.toLowerCase() === 'shoes')
                    .slice(0, 5)
                    .map((product) => (
                      <div
                        key={product.id}
                        className="bg-white rounded-xl shadow-sm border border-orange-100 hover:border-orange-300 transition-all cursor-pointer group hover:-translate-y-1"
                        onClick={() => handleProductClick(product.id)}
                      >
                        <div className="aspect-square relative overflow-hidden bg-white rounded-t-xl p-4">
                          <FastImage
                            src={product.image}
                            alt={product.name}
                            width={300}
                            height={300}
                            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                        <div className="p-3 border-t border-gray-100">
                          <h3 className="text-xs text-gray-500 font-bold uppercase mb-1">{product.brand}</h3>
                          <p className="text-sm font-bold text-gray-900 line-clamp-1 mb-1">{product.name}</p>
                          <p className="text-lg font-black text-orange-600">₹{product.price}</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </section>
          </>
        )}

        {/* Dynamic Admin-Managed Sections */}
        {loadingSections ? (
          <section className="py-6 md:py-10 bg-gradient-to-br from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-3 md:px-4">
              <div className="text-center py-4 md:py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Amazing Products</h3>
                <p className="text-gray-600">Please wait while we fetch the best deals for you</p>
              </div>
            </div>
          </section>
        ) : (
          // Sort sections to ensure specific order: Featured -> Best Deals -> Offers -> Trending -> Others
          homePageSections
            .sort((a, b) => {
              const order = ['featured', 'bestDeals', 'offers', 'trending'];
              const aIndex = order.indexOf(a.type);
              const bIndex = order.indexOf(b.type);

              // If both are in the priority list, sort by priority
              if (aIndex !== -1 && bIndex !== -1) {
                return aIndex - bIndex;
              }
              // If only one is in priority list, prioritize it
              if (aIndex !== -1) return -1;
              if (bIndex !== -1) return 1;
              // If neither is in priority list, sort by displayOrder
              return a.displayOrder - b.displayOrder;
            })
            .map((section) => {
              const sectionProducts = getSectionProducts(section.products);

              // Don't render the section if there are no products
              if (sectionProducts.length === 0) {
                return null;
              }

              return (
                <section key={section.id} className="py-3 md:py-4 px-4">
                  <div className="max-w-7xl mx-auto">
                    <div className="relative bg-gradient-to-br from-purple-50 via-purple-50 to-purple-100 rounded-2xl overflow-hidden shadow-lg border border-purple-200/50">
                      {/* Header */}
                      <div className="px-4 md:px-6 py-3 md:py-4 text-left">
                        <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-1 tracking-wide">
                          {section.title}
                        </h2>
                        {section.subtitle && (
                          <p className="text-gray-600 text-sm md:text-base font-medium mt-1">{section.subtitle}</p>
                        )}
                      </div>

                      {/* Product Grid */}
                      <div className="px-3 md:px-4 pb-3 md:pb-4">
                        <div className="flex space-x-3 md:space-x-4 overflow-x-auto scrollbar-hide pb-1 scroll-smooth">
                          {sectionProducts.map((product) => {
                            // const originalPrice = product.originalPrice || product.price * 1.5;
                            const discount = product.originalPrice && product.originalPrice > product.price
                              ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                              : section.discountPercentage || 0;
                            const displayPrice = product.price || product.sellingPrice || 0;

                            return (
                              <div
                                key={product.id}
                                className="flex-shrink-0 w-36 md:w-44 relative group cursor-pointer"
                                onClick={() => handleProductClick(product.id)}
                              >
                                <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-purple-300 hover:-translate-y-1">
                                  {/* Product Image */}
                                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                                    <FastImage
                                      src={product.image || `https://images.unsplash.com/photo-${1500000000000 + Math.random() * 1000000}?w=300&h=300&fit=crop`}
                                      alt={product.name}
                                      width={300}
                                      height={300}
                                      quality={80}
                                      loading="lazy"
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />

                                    {/* Discount Badge */}
                                    {discount > 0 && (
                                      <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-md">
                                        {discount}% OFF
                                      </div>
                                    )}

                                    {/* Wishlist Button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleWishlist(product);
                                      }}
                                      className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm transition-all"
                                      aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                                    >
                                      <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'text-red-500 fill-current' : 'text-gray-600'
                                        }`} />
                                    </button>
                                  </div>

                                  {/* Product Info */}
                                  <div className="p-3 md:p-4">
                                    <h3 className="font-bold text-gray-900 text-sm md:text-base line-clamp-2 mb-2 group-hover:text-purple-600 transition-colors">
                                      {product.name}
                                    </h3>
                                    {product.brand && (
                                      <p className="text-xs md:text-sm text-gray-600 font-medium mb-2">
                                        {product.brand}
                                      </p>
                                    )}
                                    {displayPrice > 0 && (
                                      <p className="text-base md:text-lg font-bold text-gray-900">
                                        From ₹{displayPrice.toLocaleString()}*
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              );
            })
        )}

        {/* Random Products - Mobile Optimized */}
        <section className="py-6 md:py-8 bg-white">
          <div className="px-4">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Random Products</h2>
              <button
                onClick={() => router.push('/browse')}
                className="text-purple-600 text-sm font-medium hover:text-purple-700 transition-colors"
              >
                Refresh →
              </button>
            </div>
            <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2">
              {allProducts.length > 0 ? (
                // Show actual products from database
                allProducts.slice(0, 6).map((product, index) => {
                  const originalPrice = product.originalPrice || product.price * 1.5; // Generate original price if not available
                  const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100);

                  return (
                    <div key={product.id || index} className="flex-shrink-0 bg-white border border-gray-200 rounded-lg p-3 w-40 md:w-48 hover:shadow-lg transition-shadow touch-manipulation cursor-pointer" onClick={() => handleProductClick(product.id)}>
                      <div className="relative mb-3 h-24 md:h-32">
                        <FastImage
                          src={product.image || product.imageUrl || `https://images.unsplash.com/photo-${1500000000000 + index * 1000000}?w=200&h=200&fit=crop`}
                          alt={product.name}
                          width={200}
                          height={200}
                          quality={75}
                          loading="lazy"
                          className="w-full h-full rounded"
                        />
                        {discount > 0 && (
                          <div className="absolute top-1 right-1 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                            {discount}% OFF
                          </div>
                        )}
                      </div>
                      <div className="mb-2">
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">{product.category || 'General'}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-xs md:text-sm mb-1 line-clamp-2">{product.name}</h3>
                      {product.sellerName && (
                        <p className="text-xs text-purple-600 font-medium mb-1">by {product.sellerName}</p>
                      )}
                      {product.brand && (
                        <p className="text-xs text-gray-600 font-medium">{product.brand}</p>
                      )}
                    </div>
                  );
                })
              ) : (
                // Show message when no products available
                <div className="flex-shrink-0 bg-gray-50 rounded-lg p-6 w-full text-center">
                  <p className="text-gray-500 text-sm">No products available</p>
                </div>
              )}
            </div>
          </div>
        </section>


        {/* Recently Viewed - Mobile Optimized */}
        <section className="py-6 md:py-8 bg-white">
          <div className="px-4">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Recently Viewed</h2>
              <button
                onClick={() => router.push('/browse')}
                className="text-purple-600 text-sm font-medium hover:text-purple-700 transition-colors"
              >
                Clear All
              </button>
            </div>
            <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2">
              {allProducts.length > 0 ? (
                // Show actual products from database as recently viewed
                allProducts.slice(0, 4).map((product, index) => {
                  const timeLabels = ['2 hours ago', '1 day ago', '2 days ago', '3 days ago'];

                  return (
                    <div
                      key={product.id || index}
                      className="flex-shrink-0 bg-gray-50 rounded-lg p-3 w-32 md:w-40 hover:bg-gray-100 transition-colors touch-manipulation cursor-pointer"
                      onClick={() => handleProductClick(product.id)}
                    >
                      <div className="w-full h-20 md:h-24 mb-2">
                        <FastImage
                          src={product.image || `https://images.unsplash.com/photo-${1500000000000 + index * 1000000}?w=150&h=150&fit=crop`}
                          alt={product.name}
                          width={150}
                          height={150}
                          quality={75}
                          loading="lazy"
                          className="w-full h-full rounded"
                        />
                      </div>
                      <h3 className="font-medium text-gray-900 text-xs mb-1 line-clamp-2">{product.name}</h3>
                      {product.sellerName && (
                        <p className="text-xs text-purple-600 font-medium mb-1">by {product.sellerName}</p>
                      )}
                      {product.brand && (
                        <p className="text-xs text-gray-600 font-medium mb-1">{product.brand}</p>
                      )}
                      <p className="text-xs text-gray-500">{timeLabels[index] || 'Recently'}</p>
                    </div>
                  );
                })
              ) : (
                // Show message when no products available
                <div className="flex-shrink-0 bg-gray-50 rounded-lg p-6 w-full text-center">
                  <p className="text-gray-500 text-sm">No recently viewed products</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Electronics Section */}
        <section className="py-6 md:py-8 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Electronics Hub</h2>
                <p className="text-sm text-gray-500 mt-1">Latest gadgets & gear</p>
              </div>
              <button
                onClick={() => router.push('/browse?category=Electronics')}
                className="text-purple-600 text-sm font-semibold hover:text-purple-700 transition-colors"
              >
                View All →
              </button>
            </div>

            <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
              {allProducts
                .filter(p => p.category?.toLowerCase() === 'electronics' || p.category?.toLowerCase() === 'gadgets')
                .slice(0, 6)
                .map((product) => (
                  <div
                    key={product.id}
                    className="flex-shrink-0 w-44 md:w-60 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => handleProductClick(product.id)}
                  >
                    <div className="aspect-video relative overflow-hidden bg-white rounded-t-xl p-2">
                      <FastImage
                        src={product.image}
                        alt={product.name}
                        width={300}
                        height={200}
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3 border-t border-gray-100">
                      <p className="text-sm font-bold text-gray-900 line-clamp-1 mb-1">{product.name}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-blue-600">₹{product.price}</span>
                        <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{product.brand}</span>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </section>

        {/* Watches & Jewellery Section */}
        <section className="py-6 md:py-8 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Watches & Jewellery</h2>
                <p className="text-sm text-gray-500 mt-1">Timeless elegance</p>
              </div>
              <button
                onClick={() => router.push('/browse?category=Watches')}
                className="text-purple-600 text-sm font-semibold hover:text-purple-700 transition-colors"
              >
                View All →
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {allProducts
                .filter(p => ['watches', 'jewellery', 'accessories'].includes(p.category?.toLowerCase()))
                .slice(0, 5)
                .map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-100 hover:border-yellow-200 transition-all cursor-pointer group"
                    onClick={() => handleProductClick(product.id)}
                  >
                    <div className="aspect-square relative overflow-hidden bg-gray-50 rounded-t-lg">
                      <FastImage
                        src={product.image}
                        alt={product.name}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="p-2 md:p-3 text-center">
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{product.category}</p>
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-1 mb-1">{product.name}</h3>
                      <p className="text-sm font-bold text-gray-900">₹{product.price}</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </section>

        {/* Sports & Fitness Section */}
        <section className="py-6 md:py-8 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">Sports & Fitness</h2>
                <p className="text-sm text-gray-400 mt-1">Gear up for action</p>
              </div>
              <button
                onClick={() => router.push('/browse?category=Sports')}
                className="text-white text-sm font-semibold hover:text-gray-200 transition-colors border border-white/30 px-3 py-1 rounded-full"
              >
                View All
              </button>
            </div>

            <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
              {allProducts
                .filter(p => ['sports', 'fitness', 'gym'].includes(p.category?.toLowerCase()))
                .slice(0, 6)
                .map((product) => (
                  <div
                    key={product.id}
                    className="flex-shrink-0 w-40 md:w-48 bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-500 transition-all cursor-pointer group overflow-hidden"
                    onClick={() => handleProductClick(product.id)}
                  >
                    <div className="aspect-square relative overflow-hidden bg-gray-700">
                      <FastImage
                        src={product.image}
                        alt={product.name}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-bold text-white line-clamp-1 mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-300">₹{product.price}</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </section>

        {/* Kids Corner Section */}
        <section className="py-6 md:py-8 bg-yellow-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Kids Corner</h2>
                <p className="text-sm text-gray-500 mt-1">Little fashion, big style</p>
              </div>
              <button
                onClick={() => router.push('/browse?category=Kids')}
                className="text-yellow-600 text-sm font-semibold hover:text-yellow-700 transition-colors"
              >
                View All →
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {allProducts
                .filter(p => p.category?.toLowerCase() === 'kids')
                .slice(0, 4)
                .map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl shadow-sm border border-yellow-100 hover:shadow-md transition-all cursor-pointer group hover:-translate-y-1"
                    onClick={() => handleProductClick(product.id)}
                  >
                    <div className="aspect-[4/5] relative overflow-hidden bg-yellow-50 rounded-t-2xl p-2">
                      <FastImage
                        src={product.image}
                        alt={product.name}
                        width={300}
                        height={400}
                        className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-1 mb-1">{product.name}</h3>
                      <p className="text-lg font-black text-yellow-500">₹{product.price}</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </section>
      </div>

      {/* Quick View Modal Removed */}
      {/* Ultra Modern Premium Footer */}
      <Footer />

    </div >
  );
};

export default HomePage;