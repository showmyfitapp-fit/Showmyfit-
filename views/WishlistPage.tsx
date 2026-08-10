'use client';

import Link from 'next/link';
import { Heart, ArrowLeft, ShoppingCart, Eye, Trash2 } from 'lucide-react';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import FastImage from '../components/common/FastImage';
import { getProductPath } from '@/utils/productUrls';

const WishlistPage: React.FC = () => {
  const { wishlistItems, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (item: any) => {
    addToCart({
      id: item.productId,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice,
      image: item.image,
      brand: item.brand,
      sellerId: item.sellerId,
      sellerName: item.sellerName
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="pt-10 pb-24">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="pt-10 pb-24">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
                <p className="text-gray-600">{wishlistItems.length} item(s) saved</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-red-600">
              <Heart className="w-6 h-6" />
              <span className="font-medium">Wishlist</span>
            </div>
          </div>

          {wishlistItems.length === 0 ? (
            /* Empty Wishlist */
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No items in wishlist</h3>
              <p className="text-gray-600 mb-8">Looks like you haven't saved any items yet.</p>
              <Link
                href="/"
                className="inline-flex items-center bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Start Browsing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistItems.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow group">
                  {/* Product Image */}
                  <div className="relative mb-4">
                    <FastImage
                      src={item.image}
                      alt={item.name}
                      width={400}
                      height={320}
                      className="w-full h-48 rounded-xl"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />

                    {/* Action Buttons */}
                    <div className="absolute top-3 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => removeFromWishlist(item.productId)}
                        className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all"
                        title="Remove from wishlist"
                      >
                        <Heart className="w-4 h-4 text-red-500 fill-current" />
                      </button>
                      <Link
                        href={getProductPath({ id: item.productId, slug: item.slug })}
                        className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all"
                        title="View details"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </Link>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">{item.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{item.brand}</p>

                    {/* Price */}
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xl font-bold text-gray-900">₹{item.price.toLocaleString()}</span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-sm text-gray-500 line-through">₹{item.originalPrice.toLocaleString()}</span>
                      )}
                    </div>

                    {/* Seller Info */}
                    {item.sellerName && (
                      <p className="text-xs text-gray-500">by {item.sellerName}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => removeFromWishlist(item.productId)}
                      className="px-4 py-2 border border-gray-300 rounded-xl hover:border-red-500 hover:text-red-500 transition-colors"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
