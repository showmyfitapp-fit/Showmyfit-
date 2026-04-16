'use client';

import React, { useState } from 'react';
import {
  Heart,
  Share2,
  Star,
  ShoppingBag,
  ChevronRight,
  Truck,
  ArrowLeft,
  ChevronDown
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Mock Data
const PRODUCT = {
  id: '1',
  brand: 'GEORGE JET',
  name: 'Premium Cotton Churidar Material',
  rating: 4.2,
  ratingCount: '1.2k',
  price: 1760,
  originalPrice: 1880,
  discount: 7,
  images: [
    '/placeholder-image-1.jpg',
    '/placeholder-image-2.jpg',
    '/placeholder-image-3.jpg',
    '/placeholder-image-4.jpg',
  ],
  sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  description: "Experience elegance with this hand-crafted pink churidar material from George Jet. Featuring intricate block print patterns on premium cotton fabric.",
  specifications: [
    { label: 'Fabric', value: '100% Pure Cotton' },
    { label: 'Top length', value: '2.5 meters' },
    { label: 'Bottom', value: '2.0 meters' },
    { label: 'Pattern', value: 'Traditional Block Print' },
  ],
  reviews: [
    '/review-1.jpg',
    '/review-2.jpg',
    '/review-3.jpg',
  ]
};

export default function ProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M'); // Defaulting to M as per image
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);

  return (
    <div className="pb-24 bg-white min-h-screen font-sans">
      {/* -------------------------------------------------------------------------
          IMAGE GALLERY & HEADER OVERLAY
      ------------------------------------------------------------------------- */}
      <div className="relative w-full aspect-[4/5] bg-gray-100 overflow-hidden">
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center pointer-events-none">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm pointer-events-auto"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>

          {/* Right Actions */}
          <div className="flex space-x-3 pointer-events-auto">
            <button className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm">
              <Share2 className="w-5 h-5 text-gray-800" />
            </button>
            <button
              onClick={() => setIsWishlisted(!isWishlisted)}
              className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm"
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-black text-black' : 'text-gray-800'}`} />
            </button>
          </div>
        </div>

        {/* Main Image */}
        <Image
          src={PRODUCT.images[currentImageIndex] || 'https://via.placeholder.com/600x800?text=Product+Image'}
          alt={PRODUCT.name}
          className="w-full h-full object-cover"
          priority
          fill
          sizes="100vw"
        />

        {/* Pagination Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5">
          {PRODUCT.images.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all ${currentImageIndex === idx ? 'bg-white/90 w-2 h-2' : 'bg-white/40'
                }`}
            />
          ))}
        </div>
      </div>

      {/* -------------------------------------------------------------------------
          PRODUCT CONTENT
      ------------------------------------------------------------------------- */}
      <div className="px-4 pt-5 pb-4">

        {/* Brand & Rating Row */}
        <div className="flex justify-between items-start mb-1">
          <h2 className="text-pink-600 font-bold text-xs tracking-wider uppercase">{PRODUCT.brand}</h2>

          <div className="flex items-center space-x-1 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
            <span className="text-green-700 font-bold text-xs">{PRODUCT.rating}</span>
            <Star className="w-3 h-3 text-green-700 fill-green-700" />
            <span className="text-xs text-gray-400">|</span>
            <span className="text-xs text-gray-500 font-medium">{PRODUCT.ratingCount}</span>
          </div>
        </div>

        {/* Product Title */}
        <h1 className="text-2xl font-serif text-gray-900 leading-tight mb-3">
          {PRODUCT.name}
        </h1>

        {/* Price Section */}
        <div className="flex items-baseline space-x-3 mb-1">
          <span className="text-2xl font-bold text-gray-900">₹{PRODUCT.price.toLocaleString('en-IN')}</span>
          <span className="text-gray-400 line-through text-sm">₹{PRODUCT.originalPrice.toLocaleString('en-IN')}</span>
          <span className="text-orange-400 font-bold text-sm">({PRODUCT.discount}% OFF)</span>
        </div>
        <p className="text-[10px] text-gray-400 mb-6">Inclusive of all taxes</p>


        {/* Size Selection */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-900 text-sm tracking-wide">SELECT SIZE</h3>
            <button className="text-pink-600/90 text-xs font-bold uppercase tracking-wide">Size Chart</button>
          </div>

          <div className="flex space-x-4">
            {PRODUCT.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm transition-all ${selectedSize === size
                  ? 'border-2 border-pink-500 text-pink-500 font-bold bg-white'
                  : 'border border-gray-200 text-gray-600'
                  }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Delivery Section */}
        <div className="bg-gray-50/50 rounded-xl p-4 mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <Truck className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Deliver to</p>
                <p className="text-sm font-bold text-gray-900">Kochi, 682024</p>
              </div>
            </div>
            <button className="text-[10px] font-bold text-pink-600 border border-pink-200 bg-pink-50/50 px-2.5 py-1 rounded">
              CHANGE
            </button>
          </div>

          <div className="flex items-center space-x-2 pl-8">
            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">✓</span>
            </div>
            <p className="text-xs text-green-700 font-medium">
              Get it by <span className="font-bold">Wednesday, Oct 25</span>
            </p>
          </div>
        </div>

        {/* Product Details Accordion */}
        <div className="border-t border-gray-100 py-4">
          <button
            onClick={() => setIsDetailsOpen(!isDetailsOpen)}
            className="flex justify-between items-center w-full mb-2"
          >
            <h3 className="font-bold text-gray-900 text-sm tracking-wide uppercase">Product Details</h3>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDetailsOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDetailsOpen && (
            <div className="text-gray-600 text-sm leading-relaxed space-y-3">
              <p>{PRODUCT.description}</p>
              <ul className="space-y-1 pl-1">
                {PRODUCT.specifications.map((spec, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2 text-gray-400">•</span>
                    <span className="text-gray-600">
                      {spec.label}: {spec.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Ratings & Reviews Link */}
        <div className="border-t border-gray-100 pt-4 cursor-pointer">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-900 text-sm tracking-wide uppercase">Ratings & Reviews</h3>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>

          <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
            {/* Add placeholders for reviews */}
            <div className="w-20 h-20 flex-shrink-0 bg-orange-50 rounded-lg border border-orange-100 flex items-center justify-center text-xs text-gray-400">
              Image
            </div>
            <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-400">
              Image
            </div>
            <div className="w-20 h-20 flex-shrink-0 bg-teal-50 rounded-lg border border-teal-100 flex items-center justify-center text-xs text-gray-400">
              Image
            </div>
            <div className="w-20 h-20 flex-shrink-0 bg-gray-50 rounded-lg flex items-center justify-center text-xs font-medium text-gray-500">
              +15
            </div>
          </div>
        </div>

      </div>

      {/* -------------------------------------------------------------------------
          STICKY BOTTOM BAR
      ------------------------------------------------------------------------- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 pb-safe z-50 flex items-center gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        {/* Wishlist Button */}
        <button
          className="flex-1 bg-white border border-gray-200 text-gray-900 font-bold py-3.5 rounded-lg flex items-center justify-center space-x-2 active:bg-gray-50 transition-colors uppercase text-sm tracking-wide"
        >
          <Heart className="w-4 h-4" />
          <span>Wishlist</span>
        </button>

        {/* Add to Cart Button */}
        <button
          className="flex-1 bg-pink-600 text-white font-bold py-3.5 rounded-lg flex items-center justify-center space-x-2 active:bg-pink-700 transition-colors uppercase text-sm tracking-wide shadow-lg shadow-pink-200"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Add to Cart</span>
        </button>
      </div>

    </div>
  );
}
