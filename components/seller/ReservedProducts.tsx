import React, { useState, useEffect } from 'react';
import { Clock, User, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';

interface ReservedProduct {
  id: string;
  productId: string;
  productName: string;
  sellerId: string;
  sellerName: string;
  price: number;
  image: string;
  userId: string;
  userEmail: string;
  reservedAt: any;
  status: 'reserved' | 'confirmed' | 'cancelled';
  expiresAt: any;
  createdAt: any;
  updatedAt: any;
}

interface ReservedProductsProps {
  sellerId: string;
}

const ReservedProducts: React.FC<ReservedProductsProps> = ({ sellerId }) => {
  const [reservedProducts, setReservedProducts] = useState<ReservedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'reserved' | 'confirmed' | 'cancelled'>('all');

  useEffect(() => {
    fetchReservedProducts();
  }, [sellerId]);

  const fetchReservedProducts = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'reservedProducts'),
        where('sellerId', '==', sellerId),
        orderBy('reservedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        reservedAt: doc.data().reservedAt?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as ReservedProduct[];
      setReservedProducts(products);
    } catch (error) {
      console.error('Error fetching reserved products:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReservationStatus = async (reservationId: string, newStatus: 'confirmed' | 'cancelled') => {
    try {
      await updateDoc(doc(db, 'reservedProducts', reservationId), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      setReservedProducts(prev => 
        prev.map(product => 
          product.id === reservationId 
            ? { ...product, status: newStatus, updatedAt: new Date() }
            : product
        )
      );
    } catch (error) {
      console.error('Error updating reservation status:', error);
      alert('Failed to update reservation status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reserved':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reserved':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isExpired = (expiresAt: Date) => {
    return new Date() > expiresAt;
  };

  const filteredProducts = reservedProducts.filter(product => {
    if (filter === 'all') return true;
    return product.status === filter;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-orange-500" />
          Reserved Products ({reservedProducts.length})
        </h3>
        
        {/* Filter Buttons */}
        <div className="mt-4 flex space-x-2">
          {[
            { key: 'all', label: 'All', count: reservedProducts.length },
            { key: 'reserved', label: 'Reserved', count: reservedProducts.filter(p => p.status === 'reserved').length },
            { key: 'confirmed', label: 'Confirmed', count: reservedProducts.filter(p => p.status === 'confirmed').length },
            { key: 'cancelled', label: 'Cancelled', count: reservedProducts.filter(p => p.status === 'cancelled').length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-orange-100 text-orange-800 border border-orange-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No reserved products found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <img
                    src={product.image}
                    alt={product.productName}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 truncate">{product.productName}</h4>
                        <p className="text-sm text-gray-600">₹{product.price.toLocaleString()}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{product.userEmail}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Reserved: {product.reservedAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(product.status)}`}>
                          {getStatusIcon(product.status)}
                          <span className="capitalize">{product.status}</span>
                        </div>
                        
                        {product.status === 'reserved' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => updateReservationStatus(product.id, 'confirmed')}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => updateReservationStatus(product.id, 'cancelled')}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        
                        {isExpired(product.expiresAt) && product.status === 'reserved' && (
                          <span className="text-xs text-red-600 font-medium">Expired</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservedProducts;
