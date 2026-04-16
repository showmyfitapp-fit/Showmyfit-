'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Star, Heart, Minus, Plus,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  X, ShoppingBag, Zap, MapPin
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import FastImage from '@/components/common/FastImage';
import ShareButton from '@/components/common/ShareButton';

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
  categorySpecificData?: Record<string, any>;
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
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  stats: {
    totalProducts: number;
    totalSales: number;
    totalOrders: number;
    rating: number;
  };
  createdAt: Date;
}

const ProductDetailPage: React.FC = () => {
  const params = useParams();
  const productId = params?.productId as string;

  useEffect(() => {
    console.log('=== ProductDetailPage Mounted ===');
    console.log('Params:', params);
    console.log('ProductId from params:', productId);
    console.log('ProductId type:', typeof productId);
    console.log('ProductId exists:', !!productId);
    console.log('================================');
  }, [params, productId]);

  const router = useRouter();
  const { addToCart, cartItems, updateQuantity } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { currentUser } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const primaryImage = product?.image || (product as any)?.imageUrl;
  const allImages = product ? [primaryImage, ...(product.images || [])].filter(Boolean) : [];
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  // Unused loading state removed
  const imageGalleryRef = useRef<HTMLDivElement | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  // Unused local quantity state removed
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    userName: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Fetch reviews function (extracted for reuse)
  const fetchReviews = async () => {
    if (!productId) return;

    setLoadingReviews(true);
    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('productId', '==', productId)
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);

      const reviewsData = reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().createdAt?.toDate() || new Date()
      })) as any[];

      setReviews(reviewsData);

      // Calculate average rating and total reviews
      if (reviewsData.length > 0) {
        const avgRating = reviewsData.reduce((sum, review) => sum + (review.rating || 0), 0) / reviewsData.length;
        setAverageRating(avgRating);
        setTotalReviews(reviewsData.length);
      } else {
        setAverageRating(0);
        setTotalReviews(0);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
      setAverageRating(0);
      setTotalReviews(0);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Fetch reviews for the product
  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // Submit review function
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !reviewForm.comment.trim()) return;

    setSubmittingReview(true);
    try {
      const reviewData = {
        productId: productId,
        userId: currentUser?.uid || 'anonymous',
        userName: reviewForm.userName || 'Anonymous',
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
        reviewText: reviewForm.comment.trim(),
        verified: false,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'reviews'), reviewData);

      // Reset form and close modal
      setReviewForm({ rating: 5, comment: '', userName: '' });
      setShowReviewForm(false);

      // Refresh reviews to show the new one immediately
      await fetchReviews();

    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Delete review function
  const handleDeleteReview = async (reviewId: string) => {
    if (!reviewId) return;

    if (!window.confirm('Are you sure you want to delete your review?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      await fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review. Please try again.');
    }
  };

  // Fetch similar products (same category)
  useEffect(() => {
    const fetchSimilar = async () => {
      if (!product || !product.category) return;
      try {
        const q = query(
          collection(db, 'products'),
          where('category', '==', product.category)
        );
        const snap = await getDocs(q);
        const items = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as any))
          .filter((p: any) => p.id !== product.id)
          .slice(0, 12) as Product[];
        setSimilarProducts(items);
      } catch (e) {
        console.error('Failed to load similar products', e);
        setSimilarProducts([]);
      }
    };
    fetchSimilar();
  }, [product]);

  // Unused scroll functions removed

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        console.log('ProductDetailPage: No productId provided, skipping fetch');
        return;
      }

      console.log('ProductDetailPage: Fetching product with ID:', productId);
      setLoading(true);
      try {
        const productDoc = await getDoc(doc(db, 'products', productId));

        if (productDoc.exists()) {
          console.log('ProductDetailPage: Product found in Firestore');
          const productData = productDoc.data();

          const productInfo = {
            id: productDoc.id,
            ...productData,
            createdAt: productData.createdAt?.toDate() || new Date(),
            updatedAt: productData.updatedAt?.toDate() || new Date()
          } as Product;

          setProduct(productInfo);

          // Fetch seller data
          if (productInfo.sellerId) {
            const sellerDoc = await getDoc(doc(db, 'users', productInfo.sellerId));
            if (sellerDoc.exists()) {
              const sellerData = sellerDoc.data();
              setSeller({
                id: sellerDoc.id,
                name: sellerData.displayName || sellerData.name || 'Unknown',
                email: sellerData.email || '',
                phone: sellerData.phone || '',
                businessName: sellerData.businessName || '',
                businessType: sellerData.businessType || '',
                address: sellerData.address || '',
                location: sellerData.location || null,
                stats: {
                  totalProducts: sellerData.stats?.totalProducts || 0,
                  totalSales: sellerData.stats?.totalSales || 0,
                  totalOrders: sellerData.stats?.totalOrders || 0,
                  rating: sellerData.stats?.rating || 0
                },
                createdAt: sellerData.createdAt?.toDate() || new Date()
              });
            }
          }
        } else {
          console.error('ProductDetailPage: Product not found in Firestore for ID:', productId);
          setError(true);
        }
      } catch (error) {
        console.error('ProductDetailPage: Error fetching product:', error);
        setError(true);
      } finally {
        console.log('ProductDetailPage: Fetch complete, loading set to false');
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, router]); // Removed router.push dependency which is unstable

  const handleAddToCart = () => {
    if (!product) return;

    // Check if size selection is required
    if (product.categorySpecificData?.sizes && !selectedSize) {
      alert('Please select a size before adding to cart');
      return;
    }

    // Check if color selection is required
    if (product.categorySpecificData?.colors && !selectedColor) {
      alert('Please select a color before adding to cart');
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: primaryImage,
      brand: product.brand,
      sellerId: product.sellerId,
      sellerName: product.sellerName,
      category: product.category,
      size: selectedSize || undefined,
      color: selectedColor || undefined
    });
  };

  const getProductQuantity = () => {
    const cartItem = cartItems.find(item => item.id === product?.id);
    return cartItem ? cartItem.quantity : 0;
  };

  const toggleWishlist = async () => {
    if (!product) return;

    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist({
        productId: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: primaryImage,
        brand: product.brand || 'Unknown Brand',
        category: product.category,
        sellerId: product.sellerId,
        sellerName: seller?.businessName
      });
    }
  };

  // Unused image nav functions removed

  const getDiscountPercentage = () => {
    if (!product?.originalPrice || product.originalPrice <= product.price) return 0;
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="animate-pulse p-4 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/2 aspect-square bg-gray-200 rounded-2xl"></div>
          <div className="lg:w-1/2 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-12 bg-gray-200 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-md mx-4">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-500 mb-8">
            The product you are looking for might have been removed or is temporarily unavailable.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-900 transition-all"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const discountPercentage = getDiscountPercentage();

  return (
    <div className="min-h-screen bg-white lg:flex lg:h-screen lg:overflow-hidden">
      {/* LEFT: Image & Hero Section (Dark Theme) */}
      <div className="relative bg-[#0f0f0f] text-white lg:w-1/2 lg:h-full lg:flex lg:flex-col lg:justify-center">
        {/* Navbar Controls / Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 md:p-6 z-20 flex justify-between items-center pointer-events-none">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md hover:bg-black/40 transition-all border border-white/10 pointer-events-auto"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              onClick={toggleWishlist}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md hover:bg-black/40 transition-all border border-white/10"
            >
              <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'text-red-500 fill-red-500' : 'text-white'}`} />
            </button>
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md hover:bg-black/40 transition-all border border-white/10">
              <ShareButton
                url={`/product/${product.id}`}
                title={product.name}
                description={product.description}
                image={primaryImage}
                variant="icon"
                productId={product.id}
                className="text-white hover:text-white"
              />
            </div>
          </div>
        </div>

        {/* Scrollable Image Container */}
        <div
          ref={imageGalleryRef}
          className="relative w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-hide items-center"
          onScroll={(e) => {
            const scrollLeft = e.currentTarget.scrollLeft;
            const width = e.currentTarget.clientWidth;
            const index = Math.round(scrollLeft / width);
            if (index !== selectedImageIndex) {
              setSelectedImageIndex(index);
            }
          }}
        >
          {/* Animated Background Blob (Fixed Behind) */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-0 w-full h-full lg:left-1/2 lg:-translate-x-1/2 -translate-y-1/2 lg:w-96 lg:h-96 bg-blue-500/10 rounded-full blur-3xl filter"></div>
          </div>

          {allImages.map((img, idx) => (
            <div
              key={idx}
              className="relative min-w-full w-full h-[65vh] lg:h-full flex items-center justify-center snap-center bg-gray-100 overflow-hidden"
            >
              <FastImage
                src={img}
                alt={`${product.name} - View ${idx + 1}`}
                className="w-full h-full object-cover"
                priority={idx === 0}
                fill
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows for Desktop (Control Scroll) */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={() => {
                if (imageGalleryRef.current) {
                  const width = imageGalleryRef.current.clientWidth;
                  imageGalleryRef.current.scrollBy({ left: -width, behavior: 'smooth' });
                }
              }}
              className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center z-20 backdrop-blur-sm transition-all hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => {
                if (imageGalleryRef.current) {
                  const width = imageGalleryRef.current.clientWidth;
                  imageGalleryRef.current.scrollBy({ left: width, behavior: 'smooth' });
                }
              }}
              className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center z-20 backdrop-blur-sm transition-all hover:scale-110"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Pagination Dots */}
        {allImages.length > 1 && (
          <div className="absolute bottom-8 lg:bottom-12 left-0 right-0 flex justify-center gap-3 z-20">
            {allImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (imageGalleryRef.current) {
                    const width = imageGalleryRef.current.clientWidth;
                    imageGalleryRef.current.scrollTo({ left: width * idx, behavior: 'smooth' });
                  }
                }}
                className={`h-1.5 rounded-full transition-all duration-300 backdrop-blur-sm ${selectedImageIndex === idx ? 'bg-white w-8' : 'bg-white/40 w-2 hover:bg-white/60'
                  }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: Product Details (White Theme) */}
      <div className="relative bg-white lg:w-1/2 lg:h-full lg:overflow-y-auto">
        {/* Mobile: Curved visual overlay to merge dark top with white bottom */}
        <div className="block lg:hidden absolute -top-6 left-0 right-0 h-8 bg-white rounded-t-[2.5rem] z-10"></div>

        <div className="relative px-6 pb-24 pt-4 lg:p-12 lg:pt-16 max-w-2xl mx-auto">

          {/* Header Info */}
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-start">
              <Link
                href={`/seller/${product.sellerId}`}
                className="text-blue-600 font-bold text-xs tracking-widest uppercase hover:underline"
              >
                {product.brand || product.sellerName || 'Brand'}
              </Link>
              <div className="flex flex-col items-end">
                <span className="text-3xl font-bold text-gray-900 tracking-tight">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-sm text-gray-400 line-through decoration-gray-400">
                    ₹{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-start gap-4">
              <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight lg:leading-tight">
                {product.name}
              </h1>

              {/* Delivery / Promo Badge */}

            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="flex items-center text-yellow-400">
                <Star className="w-4 h-4 fill-current" />
              </div>
              <span className="font-semibold text-gray-900">{(averageRating || 0).toFixed(1)}</span>
              <span>({totalReviews} Reviews)</span>
            </div>
          </div>

          {/* Action Buttons */}
          {/* Action Buttons */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 lg:static lg:p-0 lg:border-0 lg:bg-transparent z-40 flex flex-col gap-3">
            {getProductQuantity() > 0 ? (
              <>
                <div className="w-full bg-[#0f0f0f] text-white rounded-full h-14 px-6 flex items-center justify-between shadow-xl">
                  <button
                    onClick={() => updateQuantity(product.id, getProductQuantity() - 1)}
                    className="p-1 hover:bg-gray-800 rounded-full transition"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="font-bold text-lg">{getProductQuantity()}</span>
                  <button
                    onClick={() => updateQuantity(product.id, getProductQuantity() + 1)}
                    className="p-1 hover:bg-gray-800 rounded-full transition"
                    disabled={getProductQuantity() >= product.stock}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={() => router.push('/cart')}
                  className="w-full border-2 border-[#0f0f0f] text-[#0f0f0f] bg-white rounded-full h-14 font-extrabold text-sm uppercase tracking-widest shadow-lg hover:bg-gray-50 flex items-center justify-center transition-all"
                >
                  View Your Cart
                </button>
              </>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="w-full bg-[#0f0f0f] text-white rounded-full h-14 font-bold text-lg shadow-xl hover:shadow-2xl hover:bg-black transform hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                {product.stock <= 0 ? 'Out of Stock' : 'Buy Now'}
              </button>
            )}
          </div>

          {/* Spacer for fixed bottom bar on mobile */}
          <div className="h-20 lg:hidden"></div>

          {/* Selections */}
          <div className="space-y-8">
            {/* Size Selector */}
            {product.categorySpecificData?.sizes && (
              <div className="animate-fade-in-up">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-900 text-lg">Select Size</h3>
                  <button
                    onClick={() => setShowSizeGuide(true)}
                    className="text-blue-600 font-medium text-sm hover:underline"
                  >
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.categorySpecificData.sizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold transition-all duration-200 ${selectedSize === size
                        ? 'border-gray-900 bg-gray-900 text-white shadow-lg scale-110'
                        : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:scale-105'
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                  {/* Custom Sizes Support */}
                  {product.categorySpecificData.sizeOther &&
                    product.categorySpecificData.sizeOther.split(',').map((size: string) => {
                      const s = size.trim();
                      return (
                        <button
                          key={s}
                          onClick={() => setSelectedSize(s)}
                          className={`min-w-[3rem] h-12 px-3 rounded-full border-2 flex items-center justify-center font-bold transition-all duration-200 ${selectedSize === s
                            ? 'border-gray-900 bg-gray-900 text-white shadow-lg'
                            : 'border-gray-200 text-gray-600 hover:border-gray-400'
                            }`}
                        >
                          {s}
                        </button>
                      );
                    })
                  }
                </div>
              </div>
            )}

            {/* Color Selector */}
            {product.categorySpecificData?.colors && (
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-4">Select Color</h3>
                <div className="flex flex-wrap gap-3">
                  {product.categorySpecificData.colors.split(',').map((color: string) => {
                    const c = color.trim();
                    return (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`px-6 py-3 rounded-full border-2 font-bold transition-all duration-200 ${selectedColor === c
                          ? 'border-gray-900 bg-gray-900 text-white shadow-lg'
                          : 'border-gray-200 text-gray-600 hover:border-gray-400'
                          }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available Nearby Section */}
            {(seller?.location || seller?.address) && (
              <div id="nearby-section" className="bg-white rounded-3xl p-1 shadow-sm border border-gray-100">
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-lg mb-4">Available Nearby</h3>
                  <div className="flex items-center gap-4">
                    {/* Circular Map Preview */}
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-full overflow-hidden border-2 border-gray-100 shadow-inner">
                      {seller.location && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                        // Using styling to force the map component to fit the circle
                        <div className="absolute inset-0 pointer-events-none">
                          <iframe
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            style={{ border: 0, opacity: 0.8 }}
                            src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${seller.location.lat},${seller.location.lng}&zoom=14`}
                            allowFullScreen
                          ></iframe>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <MapPin className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div
                      className="flex-1 min-w-0 cursor-pointer group"
                      onClick={() => router.push(`/seller/${seller.id}`)}
                    >
                      <h4 className="font-bold text-gray-900 truncate text-base group-hover:text-purple-600 transition-colors flex items-center gap-2">
                        {seller.businessName || seller.name}
                        <span className="text-xs font-normal text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity bg-purple-50 px-2 py-0.5 rounded-full">
                          View Store
                        </span>
                      </h4>
                      <p className="text-gray-500 text-sm truncate mb-1">{seller.address || 'Location available'}</p>

                      {/* Inventory / Stock Status */}
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-md flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                          Only {product.stock} left {selectedSize ? `in size ${selectedSize}` : ''}
                        </div>
                        <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-0.5 rounded-md">0.8 MI</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="prose prose-slate max-w-none">
                <h3 className="font-bold text-gray-900 text-lg mb-2">Description</h3>
                <p className={`text-gray-600 leading-relaxed text-base ${!showFullDescription && product.description.length > 150 ? 'line-clamp-3' : ''}`}>
                  {product.description}
                </p>
                {product.description.length > 150 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-blue-600 font-bold text-sm mt-2 hover:underline flex items-center gap-1 transition-colors"
                  >
                    {showFullDescription ? (
                      <>Show Less <ChevronUp className="w-4 h-4" /></>
                    ) : (
                      <>Read More <ChevronDown className="w-4 h-4" /></>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Attributes */}
            {product.categorySpecificData && Object.keys(product.categorySpecificData).length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="font-bold text-gray-900 text-lg mb-4">Details</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                  {Object.entries(product.categorySpecificData).map(([key, value]) => {
                    if (key === 'sizes' || key === 'colors' || key === 'sizeOther') return null;
                    return (
                      <div key={key} className="flex flex-col">
                        <dt className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </dt>
                        <dd className="text-gray-800 font-medium">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            )}

            <hr className="border-gray-100" />

            {/* Reviews Preview (Simplified) */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900 text-lg">Reviews ({totalReviews})</h3>
                <button className="text-blue-600 font-medium text-sm hover:underline">View All</button>
              </div>

              {reviews.slice(0, 2).map((review) => (
                <div key={review.id} className="mb-4 bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-bold text-sm">{review.userName}</div>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2">{review.comment}</p>
                </div>
              ))}

              <button
                onClick={() => setShowReviewForm(true)}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-gray-400 hover:text-gray-700 transition"
              >
                Write a Review
              </button>
            </div>

            {/* Similar Products */}
            {similarProducts.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-4">You Might Also Like</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
                  {similarProducts.map((sp) => {
                    const img = (sp as any).image || (sp as any).images?.[0] || '';
                    return (
                      <Link
                        key={sp.id}
                        href={`/product/${sp.id}`}
                        className="min-w-[160px] snap-center"
                      >
                        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 mb-2">
                          {img && <FastImage src={img} alt={sp.name} className="w-full h-full object-cover" fill />}
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm truncate">{sp.name}</h4>
                        <p className="text-gray-500 text-sm">₹{sp.price.toLocaleString()}</p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Review Form Modal (Keep existing logic) */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl transform transition-all">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Write a Review</h3>
              <button
                onClick={() => setShowReviewForm(false)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${star <= reviewForm.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-200'
                          }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={reviewForm.userName}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, userName: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-black focus:ring-0 transition-colors bg-gray-50 focus:bg-white"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Review
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-black focus:ring-0 transition-colors bg-gray-50 focus:bg-white h-32 resize-none"
                  placeholder="Tell us what you think..."
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="flex-1 px-6 py-4 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview || !reviewForm.comment.trim()}
                  className="flex-1 bg-black text-white px-6 py-4 font-bold rounded-xl hover:bg-gray-900 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
