'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, CheckCircle, XCircle, AlertCircle, Phone, MapPin,
  TrendingUp, Star, Plus, User, Building, Mail, Calendar, Package, Edit, Trash2, Eye, EyeOff
} from 'lucide-react';
import Button from '@/components/ui/Button';
import ImageUpload from '@/components/common/ImageUpload';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAdminSellerRecords,
  getProductsBySeller,
  saveProduct,
  updateProductFields,
  deleteProduct,
} from '@/lib/supabase/admin';
import { addSellerEmail } from '@/firebase/sellerSetup';
import { approveSellerApplication, rejectSellerApplication } from '@/firebase/auth';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface Seller {
  id: string; // Application ID
  userId: string; // User ID for adding products
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  address: string;
  status: 'pending' | 'approved' | 'rejected';
  stats: {
    totalProducts: number;
    totalSales: number;
    totalOrders: number;
    rating: number;
  };
  createdAt: any;
}

const SellerManagementPageMobile: React.FC = () => {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showAddSellerForm, setShowAddSellerForm] = useState(false);
  const [addingProducts, setAddingProducts] = useState<string | null>(null);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [sellerProducts, setSellerProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [newSellerData, setNewSellerData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    businessType: '',
    address: ''
  });

  // Load sellers
  const loadSellers = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const sellersList = (await getAdminSellerRecords()) as Seller[];
      setSellers(sellersList);
    } catch (error: any) {
      console.error('Error loading seller applications:', error);
      setMessage(`Error loading seller applications: ${error.message}`);
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellers();
  }, [currentUser]);

  // Update seller application status
  const updateSellerStatus = async (applicationId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const seller = sellers.find((item) => item.id === applicationId);
      const userId = seller?.userId;

      if (!userId) {
        throw new Error('User ID not found in application');
      }

      if (newStatus === 'approved') {
        await approveSellerApplication(userId, applicationId, currentUser?.email || 'admin');
        setMessage('Seller application approved successfully!');
      } else {
        // For rejection, we'll need a reason - for now using a default
        const rejectionReason = 'Application did not meet our requirements. Please review and reapply.';
        await rejectSellerApplication(userId, applicationId, currentUser?.email || 'admin', rejectionReason);
        setMessage('Seller application rejected successfully!');
      }

      // Update local state
      setSellers(prev => prev.map(seller =>
        seller.id === applicationId ? { ...seller, status: newStatus } : seller
      ));

      setIsSuccess(true);
      setTimeout(() => setMessage(''), 3000);

      // Reload sellers to get updated data
      await loadSellers();
    } catch (error: any) {
      console.error('Error updating seller status:', error);
      setMessage(`Error updating seller status: ${error.message}`);
      setIsSuccess(false);
    }
  };

  // Generate sample products for a seller
  const generateSampleProducts = (sellerId: string, businessName: string, businessType: string) => {
    // Map business types to appropriate categories
    const getCategoryFromBusinessType = (type: string) => {
      const typeLower = type.toLowerCase();
      if (typeLower.includes('electronics') || typeLower.includes('tech') || typeLower.includes('gadget')) return 'electronics';
      if (typeLower.includes('fashion') || typeLower.includes('clothing') || typeLower.includes('apparel')) return 'fashion';
      if (typeLower.includes('home') || typeLower.includes('furniture') || typeLower.includes('decor')) return 'home';
      if (typeLower.includes('beauty') || typeLower.includes('cosmetic') || typeLower.includes('skincare')) return 'beauty';
      if (typeLower.includes('sports') || typeLower.includes('fitness') || typeLower.includes('gym')) return 'sports';
      if (typeLower.includes('book') || typeLower.includes('media') || typeLower.includes('education')) return 'books';
      if (typeLower.includes('toy') || typeLower.includes('game') || typeLower.includes('kids')) return 'toys';
      if (typeLower.includes('automotive') || typeLower.includes('car') || typeLower.includes('vehicle')) return 'automotive';
      if (typeLower.includes('health') || typeLower.includes('medical') || typeLower.includes('wellness')) return 'health';
      if (typeLower.includes('food') || typeLower.includes('restaurant') || typeLower.includes('beverage')) return 'food';
      if (typeLower.includes('jewelry') || typeLower.includes('accessory') || typeLower.includes('watch')) return 'jewelry';
      // Default to electronics if no match
      return 'electronics';
    };

    const category = getCategoryFromBusinessType(businessType);

    const sampleProducts = [
      {
        name: `${businessName} Premium ${businessType} 1`,
        description: `High-quality ${businessType} product from ${businessName}. Perfect for everyday use with excellent durability and performance.`,
        price: Math.floor(Math.random() * 5000) + 500,
        originalPrice: Math.floor(Math.random() * 6000) + 600,
        category: category,
        brand: businessName,
        image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500',
        images: ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500'],
        stock: Math.floor(Math.random() * 50) + 10,
        rating: Math.random() * 2 + 3, // 3-5 rating
        reviews: Math.floor(Math.random() * 100) + 10,
        tags: ['premium', 'quality', 'popular'],
        featured: Math.random() > 0.7,
        status: 'active',
        storeId: sellerId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: `${businessName} Essential ${businessType} 2`,
        description: `Essential ${businessType} item that every customer needs. Reliable and affordable solution for your requirements.`,
        price: Math.floor(Math.random() * 3000) + 200,
        originalPrice: Math.floor(Math.random() * 3500) + 250,
        category: category,
        brand: businessName,
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500',
        images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500'],
        stock: Math.floor(Math.random() * 30) + 5,
        rating: Math.random() * 2 + 3,
        reviews: Math.floor(Math.random() * 80) + 5,
        tags: ['essential', 'affordable', 'reliable'],
        featured: false,
        status: 'active',
        storeId: sellerId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: `${businessName} Professional ${businessType} 3`,
        description: `Professional-grade ${businessType} product designed for business use. Superior quality and performance guaranteed.`,
        price: Math.floor(Math.random() * 8000) + 1000,
        originalPrice: Math.floor(Math.random() * 9000) + 1200,
        category: category,
        brand: businessName,
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
        images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500'],
        stock: Math.floor(Math.random() * 20) + 3,
        rating: Math.random() * 2 + 3.5,
        reviews: Math.floor(Math.random() * 60) + 8,
        tags: ['professional', 'business', 'premium'],
        featured: true,
        status: 'active',
        storeId: sellerId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: `${businessName} Budget ${businessType} 4`,
        description: `Affordable ${businessType} option without compromising on quality. Great value for money.`,
        price: Math.floor(Math.random() * 1500) + 100,
        originalPrice: Math.floor(Math.random() * 1800) + 150,
        category: category,
        brand: businessName,
        image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500',
        images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500'],
        stock: Math.floor(Math.random() * 40) + 15,
        rating: Math.random() * 2 + 3,
        reviews: Math.floor(Math.random() * 120) + 20,
        tags: ['budget', 'value', 'popular'],
        featured: false,
        status: 'active',
        storeId: sellerId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: `${businessName} Sports ${businessType} 5`,
        description: `Sports and fitness focused ${businessType} product. Designed for active lifestyle and performance.`,
        price: Math.floor(Math.random() * 4000) + 800,
        originalPrice: Math.floor(Math.random() * 4500) + 900,
        category: category,
        brand: businessName,
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
        images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500'],
        stock: Math.floor(Math.random() * 25) + 8,
        rating: Math.random() * 2 + 3.5,
        reviews: Math.floor(Math.random() * 90) + 15,
        tags: ['sports', 'fitness', 'active'],
        featured: Math.random() > 0.8,
        status: 'active',
        storeId: sellerId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: `${businessName} Luxury ${businessType} 6`,
        description: `Luxury ${businessType} item with premium materials and exquisite craftsmanship.`,
        price: Math.floor(Math.random() * 12000) + 2000,
        originalPrice: Math.floor(Math.random() * 15000) + 2500,
        category: category,
        brand: businessName,
        image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500',
        images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500'],
        stock: Math.floor(Math.random() * 10) + 2,
        rating: Math.random() * 1.5 + 4,
        reviews: Math.floor(Math.random() * 40) + 5,
        tags: ['luxury', 'premium', 'exclusive'],
        featured: true,
        status: 'active',
        storeId: sellerId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: `${businessName} Kids ${businessType} 7`,
        description: `Child-friendly ${businessType} product designed with safety and fun in mind.`,
        price: Math.floor(Math.random() * 2000) + 300,
        originalPrice: Math.floor(Math.random() * 2500) + 400,
        category: category,
        brand: businessName,
        image: 'https://images.unsplash.com/photo-1558060370-539c927c0d2e?w=500',
        images: ['https://images.unsplash.com/photo-1558060370-539c927c0d2e?w=500'],
        stock: Math.floor(Math.random() * 35) + 10,
        rating: Math.random() * 2 + 3,
        reviews: Math.floor(Math.random() * 70) + 12,
        tags: ['kids', 'safe', 'fun'],
        featured: false,
        status: 'active',
        storeId: sellerId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: `${businessName} Kitchen ${businessType} 8`,
        description: `Essential kitchen ${businessType} tool that makes cooking easier and more enjoyable.`,
        price: Math.floor(Math.random() * 2500) + 400,
        originalPrice: Math.floor(Math.random() * 3000) + 500,
        category: category,
        brand: businessName,
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
        images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500'],
        stock: Math.floor(Math.random() * 30) + 8,
        rating: Math.random() * 2 + 3.5,
        reviews: Math.floor(Math.random() * 85) + 18,
        tags: ['kitchen', 'cooking', 'essential'],
        featured: false,
        status: 'active',
        storeId: sellerId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: `${businessName} Health ${businessType} 9`,
        description: `Health and wellness focused ${businessType} product for a better lifestyle.`,
        price: Math.floor(Math.random() * 3500) + 600,
        originalPrice: Math.floor(Math.random() * 4000) + 700,
        category: category,
        brand: businessName,
        image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500',
        images: ['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500'],
        stock: Math.floor(Math.random() * 20) + 5,
        rating: Math.random() * 2 + 3.5,
        reviews: Math.floor(Math.random() * 65) + 10,
        tags: ['health', 'wellness', 'lifestyle'],
        featured: Math.random() > 0.7,
        status: 'active',
        storeId: sellerId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: `${businessName} Pro ${businessType} 10`,
        description: `Professional ${businessType} accessory for enthusiasts and professionals.`,
        price: Math.floor(Math.random() * 6000) + 1000,
        originalPrice: Math.floor(Math.random() * 7000) + 1200,
        category: category,
        brand: businessName,
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
        images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500'],
        stock: Math.floor(Math.random() * 15) + 3,
        rating: Math.random() * 2 + 3.5,
        reviews: Math.floor(Math.random() * 50) + 8,
        tags: ['professional', 'premium', 'accessory'],
        featured: false,
        status: 'active',
        storeId: sellerId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    return sampleProducts;
  };

  // Fetch products for a specific seller
  const fetchSellerProducts = async (sellerId: string) => {
    setLoadingProducts(true);
    try {
      const products = await getProductsBySeller(sellerId);
      setSellerProducts(products);
    } catch (error: any) {
      console.error('Error fetching seller products:', error);
      setMessage(`Error fetching products: ${error.message}`);
      setIsSuccess(false);
    } finally {
      setLoadingProducts(false);
    }
  };

  // View seller products
  const viewSellerProducts = async (seller: Seller) => {
    setSelectedSeller(seller);
    setShowProductsModal(true);
    await fetchSellerProducts(seller.userId);
  };

  // Edit product
  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      category: product.category,
      brand: product.brand,
      image: product.image,
      stock: product.stock,
      rating: product.rating,
      reviews: product.reviews,
      tags: product.tags || [],
      featured: product.featured,
      status: product.status
    });
    setShowEditForm(true);
  };

  // Save edited product
  const handleSaveProduct = async () => {
    if (!editingProduct) return;

    try {
      await updateProductFields(editingProduct.id, {
        ...editFormData,
        updatedAt: new Date(),
      });

      // Update local state
      setSellerProducts(prev => prev.map(product =>
        product.id === editingProduct.id
          ? { ...product, ...editFormData, updatedAt: new Date() }
          : product
      ));

      setMessage('Product updated successfully!');
      setIsSuccess(true);
      setShowEditForm(false);
      setEditingProduct(null);
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Error updating product:', error);
      setMessage(`Error updating product: ${error.message}`);
      setIsSuccess(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteProduct(productId);

      // Update local state
      setSellerProducts(prev => prev.filter(product => product.id !== productId));

      // Update seller stats locally
      if (selectedSeller) {
        const newTotalProducts = Math.max(0, selectedSeller.stats.totalProducts - 1);
        setSellers(prev => prev.map(seller =>
          seller.id === selectedSeller.id
            ? {
              ...seller,
              stats: {
                ...seller.stats,
                totalProducts: newTotalProducts
              }
            }
            : seller
        ));
      }

      setMessage('Product deleted successfully!');
      setIsSuccess(true);
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Error deleting product:', error);
      setMessage(`Error deleting product: ${error.message}`);
      setIsSuccess(false);
    }
  };

  // Toggle product status (active/inactive)
  const handleToggleProductStatus = async (product: any) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';

    try {
      await updateProductFields(product.id, {
        status: newStatus,
        updatedAt: new Date(),
      });

      // Update local state
      setSellerProducts(prev => prev.map(p =>
        p.id === product.id
          ? { ...p, status: newStatus, updatedAt: new Date() }
          : p
      ));

      setMessage(`Product ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
      setIsSuccess(true);
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Error updating product status:', error);
      setMessage(`Error updating product status: ${error.message}`);
      setIsSuccess(false);
    }
  };

  // Add 10 products to a seller
  const addProductsToSeller = async (sellerId: string, businessName: string, businessType: string) => {
    setAddingProducts(sellerId);
    try {
      const sampleProducts = generateSampleProducts(sellerId, businessName, businessType);
      const seller = sellers.find((s) => s.id === sellerId || s.userId === sellerId);

      for (const product of sampleProducts) {
        await saveProduct({
          ...product,
          sellerId: seller?.userId || sellerId,
          sellerName: businessName,
          sellerEmail: seller?.email,
        });
      }

      const currentSeller = sellers.find(s => s.id === sellerId || s.userId === sellerId);
      const newTotalProducts = (currentSeller?.stats.totalProducts || 0) + 10;

      // Update local state
      setSellers(prev => prev.map(s =>
        s.id === sellerId || s.userId === sellerId
          ? {
            ...s,
            stats: {
              ...s.stats,
              totalProducts: newTotalProducts
            }
          }
          : s
      ));

      setMessage(`Successfully added 10 products to ${businessName}!`);
      setIsSuccess(true);
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Error adding products:', error);
      setMessage(`Error adding products: ${error.message}`);
      setIsSuccess(false);
    } finally {
      setAddingProducts(null);
    }
  };

  // Add new seller
  const addNewSeller = async () => {
    try {
      if (!currentUser) {
        setMessage('You must be logged in to perform this action');
        setIsSuccess(false);
        return;
      }

      if (!newSellerData.name || !newSellerData.email || !newSellerData.businessName) {
        setMessage('Please fill in all required fields');
        setIsSuccess(false);
        return;
      }

      console.log('Adding new seller:', newSellerData);

      const profileId = crypto.randomUUID();
      const now = new Date().toISOString();
      const client = getSupabaseBrowserClient();

      const { error: profileError } = await client.from('profiles').upsert({
        id: profileId,
        email: newSellerData.email,
        display_name: newSellerData.name,
        phone: newSellerData.phone,
        address: newSellerData.address,
        role: 'shop',
        created_at: now,
        updated_at: now,
        raw: {
          uid: profileId,
          name: newSellerData.name,
          email: newSellerData.email,
          phone: newSellerData.phone,
          role: 'shop',
          status: 'approved',
          businessName: newSellerData.businessName,
          businessType: newSellerData.businessType,
          address: newSellerData.address,
          stats: {
            totalProducts: 0,
            totalSales: 0,
            totalOrders: 0,
            rating: 0,
          },
        },
      });
      if (profileError) throw profileError;

      await addSellerEmail(newSellerData.email, profileId);

      setNewSellerData({
        name: '',
        email: '',
        phone: '',
        businessName: '',
        businessType: '',
        address: ''
      });
      setShowAddSellerForm(false);
      await loadSellers();
      setMessage('Seller added successfully!');
      setIsSuccess(true);
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Error adding seller:', error);
      setMessage(`Error adding seller: ${error.message}`);
      setIsSuccess(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 admin-content">

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Users className="w-6 h-6 mr-2 text-red-600" />
                Seller Applications Management
              </h1>
              <p className="text-gray-600 mt-1 text-sm">Review and manage seller applications</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => setShowAddSellerForm(true)}
                variant="primary"
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 w-full"
              >
                <Users className="w-4 h-4 mr-2" />
                Add Seller
              </Button>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                  <div className="text-lg font-bold text-gray-900">{sellers.length}</div>
                  <div className="text-xs text-gray-600">Total Applications</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                  <div className="text-lg font-bold text-green-600">
                    {sellers.filter(s => s.status === 'approved').length}
                  </div>
                  <div className="text-xs text-gray-600">Approved</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                  <div className="text-lg font-bold text-yellow-600">
                    {sellers.filter(s => s.status === 'pending').length}
                  </div>
                  <div className="text-xs text-gray-600">Pending Review</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                  <div className="text-lg font-bold text-red-600">
                    {sellers.filter(s => s.status === 'rejected').length}
                  </div>
                  <div className="text-xs text-gray-600">Rejected</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
            {message}
          </div>
        )}

        {/* Sellers List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading sellers...</p>
            </div>
          ) : sellers.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No sellers found</h3>
              <p className="text-gray-600">No sellers are registered yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sellers.map((seller) => (
                <div key={seller.id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow">
                  <div className="p-4">
                    {/* Seller Info */}
                    <div className="flex items-start space-x-3 mb-4">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                          {(seller.name || 'S').charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-semibold text-gray-900 truncate">{seller.name || 'Unknown Seller'}</div>
                        <div className="text-sm text-gray-500 truncate">{seller.email || 'No email'}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {seller.phone}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(seller.status)}`}>
                          {getStatusIcon(seller.status)}
                          <span className="ml-1">{seller.status.charAt(0).toUpperCase() + seller.status.slice(1)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Business Info */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="text-sm font-medium text-gray-900">{seller.businessName || 'No business name'}</div>
                      <div className="text-sm text-gray-500">{seller.businessType}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span className="truncate">{seller.address}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-green-800">Sales</div>
                        <div className="text-lg font-bold text-green-900">₹{seller.stats.totalSales.toLocaleString()}</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-blue-800">Products</div>
                        <div className="text-lg font-bold text-blue-900">{seller.stats.totalProducts}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      {/* Status Actions */}
                      <div className="flex flex-wrap gap-2">
                        {seller.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateSellerStatus(seller.id, 'approved')}
                              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center justify-center"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => updateSellerStatus(seller.id, 'rejected')}
                              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </button>
                          </>
                        )}
                        {seller.status === 'approved' && (
                          <button
                            onClick={() => updateSellerStatus(seller.id, 'rejected')}
                            className="w-full bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </button>
                        )}
                        {seller.status === 'rejected' && (
                          <button
                            onClick={() => updateSellerStatus(seller.id, 'approved')}
                            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center justify-center"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </button>
                        )}
                      </div>

                      {/* View Products Button */}
                      <button
                        onClick={() => viewSellerProducts(seller)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-blue-700 flex items-center justify-center"
                      >
                        <Package className="w-4 h-4 mr-1" />
                        View Products ({seller.stats.totalProducts})
                      </button>

                      {/* Add Products Button */}
                      {seller.status === 'approved' && seller.userId && (
                        <button
                          onClick={() => addProductsToSeller(seller.userId, seller.businessName, seller.businessType)}
                          disabled={addingProducts === seller.userId}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {addingProducts === seller.userId ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Adding Products...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-1" />
                              Add 10 Products
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Products Modal */}
        {showProductsModal && selectedSeller && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 pb-20 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-6xl max-h-[calc(100vh-160px)] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Products by {selectedSeller.businessName}
                </h3>
                <button
                  onClick={() => {
                    setShowProductsModal(false);
                    setSelectedSeller(null);
                    setSellerProducts([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Close modal"
                  aria-label="Close products modal"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Seller:</span>
                    <p className="font-medium">{selectedSeller.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Business:</span>
                    <p className="font-medium">{selectedSeller.businessName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <p className="font-medium">{selectedSeller.businessType}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Products:</span>
                    <p className="font-medium">{sellerProducts.length}</p>
                  </div>
                </div>
              </div>

              {loadingProducts ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                </div>
              ) : sellerProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No products found</h4>
                  <p className="text-gray-600">This seller hasn't added any products yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sellerProducts.map((product) => (
                    <div key={product.id} className="bg-gray-50 rounded-xl p-4 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                            {product.name}
                          </h4>
                          <p className="text-xs text-gray-600 mb-2">{product.brand}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.status === 'active' ? 'bg-green-100 text-green-800' :
                              product.status === 'inactive' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                            {product.status}
                          </span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                              title="Edit product"
                              aria-label="Edit product"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleToggleProductStatus(product)}
                              className="p-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors"
                              title={product.status === 'active' ? 'Deactivate product' : 'Activate product'}
                              aria-label={product.status === 'active' ? 'Deactivate product' : 'Activate product'}
                            >
                              {product.status === 'active' ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              title="Delete product"
                              aria-label="Delete product"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {product.image && (
                        <div className="mb-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <div className="flex items-center">
                            <Star className="w-3 h-3 text-yellow-500 mr-1" />
                            <span>{product.rating?.toFixed(1) || '0.0'} ({product.reviews || 0})</span>
                          </div>
                          <span>Stock: {product.stock || 0}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {product.category}
                          </span>
                          {product.featured && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                              Featured
                            </span>
                          )}
                        </div>

                        {product.tags && product.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {product.tags.slice(0, 3).map((tag: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                            {product.tags.length > 3 && (
                              <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                                +{product.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {showEditForm && editingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 pb-20 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[calc(100vh-160px)] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Edit Product</h3>
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingProduct(null);
                    setEditFormData({});
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Close modal"
                  aria-label="Close edit modal"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                    <input
                      type="text"
                      value={editFormData.name || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                    <input
                      type="text"
                      value={editFormData.brand || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, brand: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter brand name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price (₹) *</label>
                    <input
                      type="number"
                      value={editFormData.price || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter selling price"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Original Price (MRP)</label>
                    <input
                      type="number"
                      value={editFormData.originalPrice || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, originalPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter MRP (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={editFormData.category || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Product category"
                    >
                      <option value="electronics">Electronics</option>
                      <option value="fashion">Fashion</option>
                      <option value="home">Home & Garden</option>
                      <option value="beauty">Beauty & Personal Care</option>
                      <option value="sports">Sports & Fitness</option>
                      <option value="books">Books & Media</option>
                      <option value="toys">Toys & Games</option>
                      <option value="automotive">Automotive</option>
                      <option value="health">Health & Wellness</option>
                      <option value="food">Food & Beverages</option>
                      <option value="jewelry">Jewelry & Accessories</option>
                      <option value="furniture">Furniture</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                      Stock Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={editFormData.stock || ''}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        // Allow empty input while typing
                        if (inputValue === '') {
                          setEditFormData({ ...editFormData, stock: 0 });
                          return;
                        }
                        const value = parseInt(inputValue);
                        // Only update if it's a valid number, allow typing freely
                        if (!isNaN(value)) {
                          setEditFormData({ ...editFormData, stock: value < 1 ? 1 : value });
                        }
                      }}
                      onBlur={(e) => {
                        // Validate on blur - ensure minimum is 1
                        const value = parseInt(e.target.value) || 0;
                        if (value < 1) {
                          setEditFormData({ ...editFormData, stock: 1 });
                        }
                      }}
                      placeholder="Enter stock quantity (minimum 1)"
                      className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 shadow-sm"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Minimum stock quantity is 1
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={editFormData.rating || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, rating: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reviews Count</label>
                    <input
                      type="number"
                      value={editFormData.reviews || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, reviews: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={editFormData.status || 'active'}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Product status"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                    <ImageUpload
                      onImageUpload={(url) => {
                        console.log('🖼️ SellerManagementPage: Image uploaded, setting editFormData.image to:', url);
                        setEditFormData({ ...editFormData, image: url });
                      }}
                      onImageRemove={() => {
                        console.log('🖼️ SellerManagementPage: Image removed, clearing editFormData.image');
                        setEditFormData({ ...editFormData, image: '' });
                      }}
                      currentImage={editFormData.image}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={editFormData.description || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter product description"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={editFormData.featured || false}
                    onChange={(e) => setEditFormData({ ...editFormData, featured: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
                    Featured Product
                  </label>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingProduct(null);
                      setEditFormData({});
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveProduct}
                    variant="primary"
                    size="sm"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Seller Modal */}
        {showAddSellerForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 pb-20 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[calc(100vh-160px)] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Seller</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newSellerData.name}
                    onChange={(e) => setNewSellerData({ ...newSellerData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter seller name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={newSellerData.email}
                    onChange={(e) => setNewSellerData({ ...newSellerData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter seller email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newSellerData.phone}
                    onChange={(e) => setNewSellerData({ ...newSellerData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                  <input
                    type="text"
                    value={newSellerData.businessName}
                    onChange={(e) => setNewSellerData({ ...newSellerData, businessName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter business name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                  <input
                    type="text"
                    value={newSellerData.businessType}
                    onChange={(e) => setNewSellerData({ ...newSellerData, businessType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter business type"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={newSellerData.address}
                    onChange={(e) => setNewSellerData({ ...newSellerData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter business address"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={addNewSeller}
                  variant="primary"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Add Seller
                </Button>
                <Button
                  onClick={() => setShowAddSellerForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerManagementPageMobile;
