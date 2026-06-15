'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Package, User, TrendingUp, DollarSign } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import Navbar from '@/components/layout/Navbar';
import ProductCard from '@/components/product/ProductCard';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import ImageUpload from '@/components/common/ImageUpload';
import StatsCard from '@/components/common/StatsCard';
import EmptyState from '@/components/common/EmptyState';
import { useToast } from '@/hooks/useToast';
import { getProductPath } from '@/utils/productUrls';
import Toast from '@/components/ui/Toast';

const ShopDashboard: React.FC = () => {
  const router = useRouter();
  const navigate = (path: any) => router.push(path);
  const { state, addProduct, setCurrentShop } = useApp();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    category: 'Electronics',
    description: '',
    imageUrl: ''
  });
  const { toasts, removeToast, success, error } = useToast();

  const categories = ['Electronics', 'Groceries', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Beauty', 'Other'];

  const handleLogout = () => {
    setCurrentShop(null);
    router.push('/');
  };

  const handleProductClick = (product: { id: string; slug?: string }) => {
    router.push(getProductPath(product));
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.currentShop) return;

    if (!productForm.name || !productForm.price) {
      error('Please fill in all required fields');
      return;
    }
    addProduct({
      shopId: state.currentShop.id,
      name: productForm.name,
      price: parseFloat(productForm.price),
      category: productForm.category,
      description: productForm.description,
      imageUrl: productForm.imageUrl || 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg'
    });

    success('Product added successfully!');
    setProductForm({
      name: '',
      price: '',
      category: 'Electronics',
      description: '',
      imageUrl: ''
    });
    setShowAddProduct(false);
  };

  const updateProductForm = (field: string) => (value: string) => {
    setProductForm(prev => ({ ...prev, [field]: value }));
  };

  const shopProducts = state.products.filter(p => p.shopId === state.currentShop?.id);
  const totalRevenue = shopProducts.reduce((sum, product) => sum + product.price, 0);
  const avgPrice = shopProducts.length > 0 ? totalRevenue / shopProducts.length : 0;

  if (!state.currentShop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md mx-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Please log in to access your shop dashboard</p>
          <Link href="/shop/auth">
            <Button variant="secondary" size="lg">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!state.currentShop.approved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md mx-4">
          <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Package className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Approval</h2>
          <p className="text-gray-600 mb-6">
            Your shop registration is under review. You'll receive access once approved by our admin team.
          </p>
          <Button variant="outline" onClick={handleLogout}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userRole="shop" />

      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.type === 'success' ? 'Success' : 'Error'}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats - show only essentials */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Total Products"
            value={shopProducts.length}
            icon={Package}
            color="blue"
          />
        </div>

        {/* Shop Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mr-4">
                <User className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{state.currentShop.name}</h1>
                <p className="text-gray-600">{state.currentShop.address}</p>
                <p className="text-gray-600">{state.currentShop.contact}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                Approved
              </div>
              <p className="text-sm text-gray-500">{shopProducts.length} products</p>
              <Button variant="outline" size="sm" onClick={handleLogout} className="mt-2">
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Your Products</h2>
            <Button
              variant="secondary"
              icon={Plus}
              onClick={() => setShowAddProduct(!showAddProduct)}
            >
              Add Product
            </Button>
          </div>

          {/* Add Product Form */}
          {showAddProduct && (
            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Product</h3>
              <form onSubmit={handleAddProduct} className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <ImageUpload
                    currentImage={productForm.imageUrl}
                    onImageUpload={updateProductForm('imageUrl')}
                  />
                </div>

                <FormInput
                  label="Product Name"
                  value={productForm.name}
                  onChange={updateProductForm('name')}
                  required
                />

                <FormInput
                  label="Price ($)"
                  type="number"
                  value={productForm.price}
                  onChange={updateProductForm('price')}
                  required
                />

                <FormInput
                  label="Category"
                  type="select"
                  value={productForm.category}
                  onChange={updateProductForm('category')}
                  options={categories}
                />

                <div className="md:col-span-2">
                  <FormInput
                    label="Description (Optional)"
                    type="textarea"
                    value={productForm.description}
                    onChange={updateProductForm('description')}
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2 flex gap-4">
                  <Button type="submit" variant="secondary">
                    Add Product
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddProduct(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Products Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shopProducts.map(product => (
              <ProductCard
                key={product.id}
                product={{ ...product, image: product.imageUrl }}
                onClick={() => handleProductClick(product)}
              />
            ))}
          </div>

          {shopProducts.length === 0 && !showAddProduct && (
            <EmptyState
              icon={Package}
              title="No products yet"
              description="Start by adding your first product to showcase your shop"
              actionLabel="Add Your First Product"
              onAction={() => setShowAddProduct(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopDashboard;