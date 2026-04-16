import React from 'react';
import { CheckCircle, ShoppingCart, X } from 'lucide-react';

interface CartNotificationProps {
  show: boolean;
  onClose: () => void;
  productName: string;
  productImage: string;
  quantity: number;
}

const CartNotification: React.FC<CartNotificationProps> = ({
  show,
  onClose,
  productName,
  productImage,
  quantity
}) => {
  if (!show) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 max-w-sm">
        <div className="flex items-start space-x-3">
          {/* Success Icon */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <ShoppingCart className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Added to Cart</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <img
                src={productImage}
                alt={productName}
                className="w-8 h-8 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {productName}
                </p>
                <p className="text-xs text-gray-600">
                  Qty: {quantity}
                </p>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
          <div className="bg-green-600 h-1 rounded-full animate-progress-bar"></div>
        </div>
      </div>
    </div>
  );
};

export default CartNotification;
