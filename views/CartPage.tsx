'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Minus, Plus, Trash2, ArrowLeft,
  Shield, Heart, Clock,
  MapPin, Store, Phone, Star, ShoppingBag, ArrowRight, X, Sparkles, Package
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import CartNotification from '../components/common/CartNotification';
import { useAuth } from '../contexts/AuthContext';
import API_ENDPOINTS from '../config/api';
import OptimizedImage from '../components/common/OptimizedImage';
import { getProductPath } from '@/utils/productUrls';
import { getUserLocation } from '@/utils/distance';
import {
  computeDistanceAndEta,
  createOrdersFromCart,
  fetchSellerShopInfo,
  groupCartBySeller,
} from '@/lib/orders';

const CartPage: React.FC = () => {
  const {
    cartItems,
    lastAddedProducts,
    updateQuantity,
    removeFromCart,
    moveToWishlist,
    clearCart,
    getCartTotal,
    getCartItemCount,
    showAddNotification,
    setShowAddNotification
  } = useCart();

  const { currentUser, userData } = useAuth();
  const router = useRouter();
  const [showLastAdded, setShowLastAdded] = useState(false);
  const [shopDetails, setShopDetails] = useState<{ [key: string]: any }>({});
  const [loadingShops, setLoadingShops] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    setIsLoaded(true);
    if (userData?.phone) setCustomerPhone(userData.phone);
  }, [userData?.phone]);

  useEffect(() => {
    getUserLocation().then(setCustomerLocation);
  }, []);

  // Fetch shop details for cart items
  useEffect(() => {
    const fetchShopDetails = async () => {
      if (cartItems.length === 0) return;

      setLoadingShops(true);
      const shopIds = Array.from(new Set(cartItems.map(item => item.sellerId).filter(Boolean)));
      const shopDetailsMap: { [key: string]: any } = {};

      try {
        for (const shopId of shopIds) {
          if (shopId) {
            const seller = await fetchSellerShopInfo(shopId);
            const { distanceKm, etaMinutes } = computeDistanceAndEta(
              customerLocation,
              seller.storeLocation
            );
            shopDetailsMap[shopId] = {
              name: seller.sellerName,
              address: seller.storeAddress || 'Address not available',
              phone: seller.storePhone || 'Phone not available',
              location: seller.storeLocation,
              distanceKm,
              etaMinutes,
            };
          }
        }
        setShopDetails(shopDetailsMap);
      } catch (error) {
        console.error('Error fetching shop details:', error);
      } finally {
        setLoadingShops(false);
      }
    };

    fetchShopDetails();
  }, [cartItems, customerLocation]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.originalPrice || item.price) * item.quantity, 0);
  const discount = cartItems.reduce((sum, item) => sum + ((item.originalPrice || item.price) - item.price) * item.quantity, 0);
  const shipping = 0; // Free shipping for now
  const total = subtotal - discount + shipping;

  // Handle checkout with Razorpay
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    if (!currentUser) {
      alert('Please sign in to place an order.');
      router.push('/auth');
      return;
    }

    const phone = customerPhone.trim() || userData?.phone || '';
    if (!phone || phone.length < 10) {
      alert('Please enter a valid phone number for delivery updates and OTP.');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Check if Razorpay is available
      if (typeof (window as any).Razorpay === 'undefined') {
        alert('Razorpay SDK is not loaded. Please refresh the page and try again.');
        setIsProcessingPayment(false);
        return;
      }

      // Create order on server
      console.log('🛒 Creating Razorpay order...', { total, currency: 'INR' });

      // Generate a short receipt ID (max 40 chars for Razorpay)
      const timestamp = Date.now().toString().slice(-8); // Last 8 digits
      const userId = (currentUser?.uid || 'guest').slice(0, 8); // First 8 chars
      const receipt = `rcpt_${timestamp}_${userId}`; // Format: rcpt_12345678_abcd1234

      const orderResponse = await fetch(API_ENDPOINTS.razorpay.createOrder, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
          currency: 'INR',
          receipt: receipt
        }),
      });

      console.log('📡 Order response status:', orderResponse.status);

      if (!orderResponse.ok) {
        let errorData;
        try {
          errorData = await orderResponse.json();
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError);
          errorData = { error: `Server returned ${orderResponse.status}: ${orderResponse.statusText}` };
        }

        console.error('❌ Order creation failed:', {
          status: orderResponse.status,
          statusText: orderResponse.statusText,
          errorData
        });

        const errorMessage = errorData?.error || errorData?.message || `Server error: ${orderResponse.status}`;
        throw new Error(errorMessage);
      }

      const orderData = await orderResponse.json();
      console.log('✅ Order created successfully:', orderData);

      // Razorpay payment options
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ShowMyFit',
        description: 'Order Payment',
        order_id: orderData.id, // Fixed: API returns 'id' not 'orderId'
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch(API_ENDPOINTS.razorpay.verifyPayment, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.verified) {
              const created = await createOrdersFromCart({
                cartItems,
                userId: currentUser!.uid,
                customerName: currentUser?.displayName || userData?.displayName || 'Customer',
                customerEmail: currentUser?.email || userData?.email || '',
                customerPhone: phone,
                customerAddress: userData?.address,
                paymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
              });

              clearCart();
              alert(`Payment successful! ${created.length} order(s) placed. Track them in My Orders.`);
              setIsProcessingPayment(false);
              router.push('/orders');
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error: any) {
            console.error('Error saving order:', error);
            alert('Payment successful but order save failed. Please contact support with payment ID: ' + response.razorpay_payment_id);
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: currentUser?.displayName || 'Customer',
          email: currentUser?.email || 'customer@example.com',
          contact: currentUser?.phoneNumber || '9999999999'
        },
        theme: {
          color: '#9333ea' // Purple theme to match the design
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.message || 'Failed to process payment. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/20 transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>

      {/* Cart Notification */}
      {showAddNotification && lastAddedProducts.length > 0 && (
        <CartNotification
          show={showAddNotification}
          onClose={() => setShowAddNotification(false)}
          productName={lastAddedProducts[0].name}
          productImage={lastAddedProducts[0].image}
          quantity={lastAddedProducts[0].quantity}
        />
      )}

      {/* Premium Hero Banner */}
      {cartItems.length > 0 && (
        <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full mb-3 border border-white/30">
                  <ShoppingBag className="w-3 h-3 text-white" />
                  <span className="text-white text-xs font-bold uppercase tracking-wider">{getCartItemCount()} Items</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight">Your Shopping Bag</h1>
                <p className="text-white/90 font-medium">Review your items and checkout when ready</p>
              </div>

              <Link
                href="/"
                className="hidden md:flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-full font-bold hover:bg-white/30 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Wave Divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-8">
              <path d="M0 60L60 55C120 50 240 40 360 35C480 30 600 30 720 32.5C840 35 960 40 1080 42.5C1200 45 1320 45 1380 45L1440 45V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="white" />
            </svg>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Progress Stepper */}
        {cartItems.length > 0 && (
          <div className="hidden md:flex justify-center mb-12">
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
              <span className="flex items-center gap-2 text-purple-600 border-b-2 border-purple-600 pb-2">
                <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs">1</div>
                Shopping Bag
              </span>
              <div className="w-12 h-px bg-gray-200"></div>
              <span className="flex items-center gap-2 text-gray-300">
                <div className="w-6 h-6 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center text-xs">2</div>
                Checkout
              </span>
              <div className="w-12 h-px bg-gray-200"></div>
              <span className="flex items-center gap-2 text-gray-300">
                <div className="w-6 h-6 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center text-xs">3</div>
                Success
              </span>
            </div>
          </div>
        )}

        {cartItems.length === 0 ? (
          /* Premium Empty Cart State */
          <div className="flex flex-col items-center justify-center py-20 md:py-32">
            <div className="relative">
              {/* Animated Background Circle */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-100 to-red-100 rounded-full blur-3xl opacity-50 animate-pulse"></div>

              <div className="relative bg-white rounded-3xl p-12 md:p-16 shadow-2xl border border-gray-100">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-6 relative">
                    <ShoppingBag className="w-10 h-10 text-purple-600" strokeWidth={1.5} />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-black">0</span>
                    </div>
                  </div>

                  <h2 className="text-3xl md:text-4xl font-black mb-3 text-gray-900 text-center">Your Bag is Empty</h2>
                  <p className="text-gray-500 mb-8 text-center max-w-md text-lg leading-relaxed">
                    Looks like you haven't added anything yet. Start exploring our curated collections.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      href="/"
                      className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-black uppercase tracking-wider rounded-full hover:from-purple-700 hover:to-pink-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Start Shopping
                    </Link>
                    <Link
                      href="/categories"
                      className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 text-sm font-black uppercase tracking-wider rounded-full border-2 border-gray-200 hover:border-gray-300 transition-all"
                    >
                      Browse Categories
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Product List */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                    Your Items
                  </h2>
                  <p className="text-gray-500 mt-1">{getCartItemCount()} {getCartItemCount() === 1 ? 'item' : 'items'} in your bag</p>
                </div>
                <button
                  onClick={clearCart}
                  className="text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2 px-4 py-2 rounded-full hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              </div>

              {cartItems.map((item, index) => (
                <div
                  key={item.id}
                  className="group bg-white p-5 md:p-6 rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-xl transition-all duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex gap-5 md:gap-6">
                    {/* Image */}
                    <Link
                      href={getProductPath({ id: item.id })}
                      className="block w-24 h-32 md:w-32 md:h-40 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100 relative group"
                    >
                      <OptimizedImage
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {item.originalPrice && item.originalPrice > item.price && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-full">
                          {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
                        </div>
                      )}
                    </Link>

                    {/* Content */}
                    <div className="flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div className="space-y-1 flex-1">
                          <Link
                            href={`/seller/${item.sellerId}`}
                            className="text-xs font-bold text-purple-600 hover:text-purple-700 uppercase tracking-wide transition-colors block"
                          >
                            {shopDetails[item.sellerId || '']?.name || 'Store'}
                          </Link>
                          {shopDetails[item.sellerId || '']?.distanceKm != null && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {shopDetails[item.sellerId || ''].distanceKm} km away
                              {shopDetails[item.sellerId || '']?.etaMinutes != null && (
                                <span> · ~{shopDetails[item.sellerId || ''].etaMinutes} min delivery</span>
                              )}
                            </p>
                          )}
                          <Link
                            href={getProductPath({ id: item.id })}
                            className="block font-black text-lg md:text-xl text-gray-900 hover:text-purple-600 transition-colors leading-tight line-clamp-2"
                          >
                            {item.name}
                          </Link>

                          {/* Variations */}
                          <div className="flex flex-wrap gap-3 mt-2">
                            {item.size && (
                              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full">
                                <span className="text-xs font-bold text-gray-400">Size:</span>
                                <span className="text-xs font-black text-gray-900">{item.size}</span>
                              </div>
                            )}
                            {item.color && (
                              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full">
                                <div className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: item.color.toLowerCase() }}></div>
                                <span className="text-xs font-black text-gray-900 uppercase">{item.color}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-auto flex items-end justify-between">
                        {/* Quantity */}
                        <div className="flex items-center h-11 px-2 bg-gray-50 rounded-xl border border-gray-100">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white transition-all text-gray-900"
                          >
                            <Minus className="w-4 h-4" strokeWidth={2.5} />
                          </button>
                          <span className="text-sm font-black w-10 text-center text-gray-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white transition-all text-gray-900"
                          >
                            <Plus className="w-4 h-4" strokeWidth={2.5} />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          {item.originalPrice && item.originalPrice > item.price && (
                            <div className="flex items-center gap-2 justify-end mb-1">
                              <span className="text-xs text-gray-400 line-through font-medium">
                                ₹{(item.originalPrice * item.quantity).toLocaleString()}
                              </span>
                              <span className="text-xs font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                Save ₹{((item.originalPrice - item.price) * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          )}
                          <span className="text-2xl md:text-3xl font-black text-gray-900">
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Trust Badges */}
              <div className="pt-8 flex flex-wrap items-center gap-6 justify-center md:justify-start opacity-60">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-600">
                  <Shield className="w-4 h-4" />
                  Secure Checkout
                </div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-600">
                  <Clock className="w-4 h-4" />
                  30-Day Returns
                </div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-600">
                  <Package className="w-4 h-4" />
                  Free Shipping
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-4">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-gray-100 shadow-2xl sticky top-24">
                <h2 className="text-sm font-black tracking-wider uppercase text-gray-400 mb-6 pb-4 border-b border-gray-100">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
                      Phone for delivery OTP (WhatsApp)
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-200 outline-none"
                    />
                  </div>

                  {Object.entries(groupCartBySeller(cartItems)).map(([sellerId, items]) => {
                    const shop = shopDetails[sellerId];
                    if (!shop) return null;
                    return (
                      <div key={sellerId} className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                        <p className="text-xs font-black uppercase tracking-wide text-purple-700 mb-1">{shop.name}</p>
                        <p className="text-sm text-gray-700">{items.length} item(s)</p>
                        {shop.distanceKm != null ? (
                          <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {shop.distanceKm} km · ~{shop.etaMinutes ?? 30} min ETA
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-1">Enable location for distance & ETA</p>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Subtotal</span>
                    <span className="text-gray-900 font-bold">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Shipping</span>
                    <span className="text-green-600 text-sm font-black uppercase tracking-wide flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      FREE
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center bg-green-50 p-4 rounded-xl border border-green-100">
                      <span className="text-green-700 font-bold uppercase text-xs tracking-wide">Savings</span>
                      <span className="text-green-700 font-black">-₹{discount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-black uppercase tracking-wide text-gray-600">Total</span>
                      <span className="text-4xl font-black text-gray-900 tracking-tight">₹{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleCheckout}
                    disabled={isProcessingPayment}
                    className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-black text-sm uppercase tracking-wider hover:from-purple-700 hover:to-pink-700 transition-all shadow-xl hover:shadow-2xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group"
                  >
                    {isProcessingPayment ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Proceed to Checkout</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <div className="text-center space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                      🔒 Secure SSL Encryption
                    </p>
                    <p className="text-xs text-gray-400">
                      Powered by Razorpay
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recently Added Section */}
        {showLastAdded && lastAddedProducts.length > 0 && cartItems.length > 0 && (
          <div className="mt-16 pt-16 border-t border-gray-100">
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-6">Recently Added</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide">
              {lastAddedProducts.slice(0, 4).map((prod, i) => (
                <Link key={i} href={getProductPath({ id: prod.id, slug: prod.slug })} className="min-w-[180px] md:min-w-[220px] snap-center group">
                  <div className="aspect-[3/4] bg-gray-50 rounded-2xl mb-3 overflow-hidden border border-gray-100 shadow-sm">
                    <OptimizedImage
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 truncate mb-1">{prod.name}</h4>
                  <p className="text-gray-500 text-sm font-bold">₹{prod.price.toLocaleString()}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
