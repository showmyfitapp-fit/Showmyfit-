import React from 'react';
import { MapPin, Phone, Package } from 'lucide-react';

interface Shop {
  id: string;
  name: string;
  contact: string;
  address: string;
  latitude: number;
  longitude: number;
  approved: boolean;
  createdAt: Date;
}

interface ShopCardProps {
  shop: Shop;
  distance?: number;
  productCount?: number;
  onClick?: () => void;
}

const ShopCard: React.FC<ShopCardProps> = ({ 
  shop, 
  distance, 
  productCount = 0, 
  onClick 
}) => {
  return (
    <div 
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {shop.name}
          </h3>
          <div className="flex items-center text-gray-600 text-sm mb-2">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="line-clamp-1">{shop.address}</span>
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <Phone className="w-4 h-4 mr-1" />
            <span>{shop.contact}</span>
          </div>
        </div>
        
        {distance !== undefined && (
          <div className="text-right">
            <span className="text-lg font-bold text-green-600">
              {distance.toFixed(1)}km
            </span>
            <p className="text-xs text-gray-500">away</p>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center text-gray-600 text-sm">
          <Package className="w-4 h-4 mr-1" />
          <span>{productCount} products</span>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          shop.approved 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {shop.approved ? 'Active' : 'Pending'}
        </div>
      </div>
    </div>
  );
};

export default ShopCard;