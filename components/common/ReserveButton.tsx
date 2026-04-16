import React from 'react';
import { ShoppingCart, Plus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface ReserveButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    brand: string;
    size?: string;
    color?: string;
    sellerId?: string;
    sellerName?: string;
    category?: string;
  };
  variant?: 'primary' | 'outline' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ReserveButton: React.FC<ReserveButtonProps> = ({
  product,
  variant = 'primary',
  size = 'md',
  className = ''
}) => {
  const { addToCart, isAddingToCart } = useCart();

  const handleReserve = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent click events
    if (!product) {
      console.error('Product is undefined in ReserveButton');
      return;
    }
    addToCart(product);
  };

  const baseClasses = 'flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:from-emerald-700 hover:to-blue-700 shadow-sm',
    outline: 'border border-emerald-600 text-emerald-600 hover:bg-emerald-50',
    icon: 'bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-full'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-xl'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleReserve}
        disabled={isAddingToCart}
        className={`${baseClasses} ${variantClasses.icon} w-10 h-10 ${className}`}
        title="Add to Cart"
      >
        {isAddingToCart ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
        ) : (
          <ShoppingCart className={iconSizes[size]} />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleReserve}
      disabled={isAddingToCart}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {isAddingToCart ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Adding...
        </>
      ) : (
        <>
          <ShoppingCart className={`${iconSizes[size]} mr-2`} />
          Add to Cart
        </>
      )}
    </button>
  );
};

export default ReserveButton;