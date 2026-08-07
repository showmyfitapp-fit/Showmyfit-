import React from 'react';
import { MapPin, Heart, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FastImage from '../common/FastImage';
import ShareButton from '../common/ShareButton';
import { getProductPath } from '@/utils/productUrls';

interface Product {
  id: string;
  slug?: string;
  sellerId?: string;
  name: string;
  price: number;
  originalPrice?: number;
  category?: string;
  description?: string;
  image: string; // Changed from imageUrl to match HomePage data
  brand?: string;
}

interface Shop {
  id: string;
  name: string;
  address?: string; // Made optional
}

interface ProductCardProps {
  product: Product;
  shop?: Shop;
  distance?: number;
  isWishlisted?: boolean;
  onToggleWishlist?: (e: React.MouseEvent) => void;
  className?: string; // Allow custom classes
  priority?: boolean; // New prop for image priority
  onClick?: () => void; // Allow custom click handler
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  shop,
  distance,
  isWishlisted = false,
  onToggleWishlist,
  className = '',
  priority = false,
  onClick
}) => {
  const router = useRouter();

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const cardContent = (
    <>
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <FastImage
          src={product.image}
          alt={product.name}
          width={400}
          height={400}
          loading={priority ? 'eager' : 'lazy'}
          priority={priority}
          quality={80}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10">
            {discount}% OFF
          </div>
        )}

        {/* Share Button */}
        <div className="absolute top-3 right-12 z-10" onClick={handleShareClick}>
          <ShareButton
            url={getProductPath(product)}
            title={product.name}
            description={product.description || product.brand}
            image={product.image}
            variant="icon"
            productId={product.id}
            className="w-8 h-8 md:w-9 md:h-9 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 rounded-full shadow-md flex items-center justify-center transition-all"
          />
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWishlist?.(e);
          }}
          className="absolute top-3 right-3 z-10 w-8 h-8 md:w-9 md:h-9 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all active:scale-95"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={`w-4 h-4 md:w-5 md:h-5 transition-colors ${isWishlisted ? 'text-red-500 fill-current' : 'text-gray-600 hover:text-red-500'}`}
          />
        </button>

        {/* Quick Add Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/60 to-transparent">
          <button className="w-full bg-white text-black py-2 rounded-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity delay-100 hover:bg-gray-100 shadow-lg flex items-center justify-center gap-2">
            <ShoppingBag className="w-4 h-4" /> View Details
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 md:p-4">
        {/* Brand & Category */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate pr-2">
            {product.brand || 'Premium'}
          </span>
          {product.category && (
            <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
              {product.category}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-sm md:text-base leading-tight mb-2 line-clamp-1 group-hover:text-purple-600 transition-colors">
          {product.name}
        </h3>

        {/* Price & Shop */}
        <div className="flex items-end justify-between mt-auto">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-base md:text-lg font-bold text-gray-900">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-gray-400 line-through">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            {shop && (
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <MapPin className="w-3 h-3 mr-1" />
                <span className="truncate max-w-[100px]">{shop.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  const handleCardClick = (e: React.MouseEvent) => {
    // If custom onClick is provided, use it (e.g. for trending items)
    if (onClick) {
      onClick();
      return;
    }

    // Default behavior: Navigate to product page
    if (product.id) {
      router.push(getProductPath(product));
    } else {
      console.error('ProductCard: Product has no ID:', product);
    }
  };

  const containerClasses = `group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer relative block ${className}`;

  return (
    <div className={containerClasses} onClick={handleCardClick}>
      {cardContent}
    </div>
  );
};

export default ProductCard;