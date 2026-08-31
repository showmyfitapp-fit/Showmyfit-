'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, Plus, Edit, Trash2, Search, Filter, Star,
  DollarSign, ShoppingCart, Eye, Save, X, Image as ImageIcon,
  Tag, Calendar, TrendingUp, BarChart3
} from 'lucide-react';
import Button from '@/components/ui/Button';
import ImageUpload from '@/components/common/ImageUpload';
import { useAuth } from '@/contexts/AuthContext';
import {
  deleteProduct,
  getProducts,
  saveProduct,
} from '@/lib/supabase/admin';
import ProductCategoryPicker from '@/components/seller/ProductCategoryPicker';
import SelectDropdown from '@/components/ui/SelectDropdown';
import { useCategories } from '@/hooks/useCategories';
import { getCategorySpecificFields } from '@/lib/categories/categoryFields';
import { buildProductSeoFields } from '@/utils/productSeo';

interface Product {
  id?: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory?: string;
  subcategoryName?: string;
  categoryPath?: string[];
  slug?: string;
  searchKeywords?: string[];
  brand: string;
  image: string;
  images?: string[];
  stock: number;
  rating: number;
  reviews: number;
  tags: string[];
  featured: boolean;
  status: 'active' | 'inactive' | 'draft';
  createdAt: Date;
  updatedAt: Date;
}

const ProductManagementPage: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState<Product>({
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    category: '',
    subcategory: '',
    subcategoryName: '',
    brand: '',
    image: '',
    images: [],
    stock: 1,
    rating: 0,
    reviews: 0,
    tags: [],
    featured: false,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const [categorySpecificData, setCategorySpecificData] = useState<Record<string, any>>({});
  const { topLevel: topLevelCategories } = useCategories();
  const categoryFields = getCategorySpecificFields(
    formData.category,
    categorySpecificData,
    formData.subcategoryName
  );

  const statusOptions = [
    { value: 'active', label: 'Active', icon: '✅', color: 'text-green-600' },
    { value: 'inactive', label: 'Inactive', icon: '❌', color: 'text-red-600' },
    { value: 'draft', label: 'Draft', icon: '📝', color: 'text-yellow-600' }
  ];

  // Load products
  const loadProducts = async () => {
    setLoading(true);
    try {
      const productsData = (await getProducts()) as Product[];
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      setMessage('Error loading products');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const seoFields = buildProductSeoFields({
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        subcategory: formData.subcategory,
        subcategoryName: formData.subcategoryName,
        tags: formData.tags,
        description: formData.description,
        existingSlug: editingProduct?.slug,
        productId: editingProduct?.id,
      });

      const productData = {
        ...formData,
        ...seoFields,
        categorySpecificData: categorySpecificData,
        updatedAt: new Date()
      };

      if (editingProduct) {
        await saveProduct(productData, editingProduct.id!);
        setMessage('Product updated successfully!');
      } else {
        productData.createdAt = new Date();
        await saveProduct(productData);
        setMessage('Product added successfully!');
      }

      setIsSuccess(true);
      setShowAddForm(false);
      setEditingProduct(null);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      setMessage('Error saving product');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '' as any,
      originalPrice: '' as any,
      category: '',
      subcategory: '',
      subcategoryName: '',
      brand: '',
      image: '',
      images: [],
      stock: '' as any,
      rating: 0,
      reviews: 0,
      tags: [],
      featured: false,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    setCategorySpecificData({});
  };

  // Edit product
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setCategorySpecificData((product as any).categorySpecificData || {});
    setShowAddForm(true);
  };

  // Delete product
  const handleDelete = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
        setMessage('Product deleted successfully!');
        setIsSuccess(true);
        loadProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        setMessage('Error deleting product');
        setIsSuccess(false);
      }
    }
  };

  // Add tag
  const addTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tag.trim()] });
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  if (!currentUser || userData?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="main-content pt-24">
          <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
              <p className="text-gray-600 mb-6">You need admin access to manage products.</p>
              <Button onClick={() => router.push('/profile')} variant="primary" size="lg">
                Go to Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 admin-content">

      <div className="main-content pt-24">
        <div className="min-h-screen px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                    <Package className="w-8 h-8 mr-3 text-red-600" />
                    Product Management
                  </h1>
                  <p className="text-gray-600">Manage your product catalog</p>
                </div>
                <Button
                  onClick={() => {
                    setShowAddForm(true);
                    setEditingProduct(null);
                    resetForm();
                  }}
                  variant="primary"
                  className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Product
                </Button>
              </div>

            </div>

            {/* Add/Edit Product Form */}
            {showAddForm && (
              <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <div className="flex gap-3">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          // Electronics test data
                          const testData = {
                            name: 'iPhone 15 Pro Max',
                            description: 'Latest iPhone with advanced camera system and A17 Pro chip',
                            price: 129999,
                            originalPrice: 139999,
                            category: 'electronics',
                            brand: 'Apple',
                            image: 'https://images.unsplash.com/photo-1592899677977-9c10b588e483?w=500',
                            images: [
                              'https://images.unsplash.com/photo-1592899677977-9c10b588e483?w=500',
                              'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500'
                            ],
                            stock: 50,
                            rating: 4.8,
                            reviews: 1250,
                            tags: ['smartphone', 'apple', 'premium', 'camera'],
                            featured: true,
                            status: 'active' as const,
                            createdAt: new Date(),
                            updatedAt: new Date()
                          };
                          setFormData(testData);
                          setCategorySpecificData({
                            brand: 'Apple',
                            model: 'iPhone 15 Pro Max',
                            screenSize: '6.7',
                            storage: '256GB',
                            color: 'Natural Titanium',
                            warranty: '1 Year',
                            connectivity: '5G, Wi-Fi 6E, Bluetooth 5.3'
                          });
                        }}
                        variant="secondary"
                        size="sm"
                      >
                        📱 Phone
                      </Button>
                      <Button
                        onClick={() => {
                          // Fashion test data
                          const testData = {
                            name: 'Nike Air Max 270',
                            description: 'Comfortable running shoes with Max Air cushioning',
                            price: 8999,
                            originalPrice: 9999,
                            category: 'fashion',
                            brand: 'Nike',
                            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
                            images: [
                              'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
                              'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500'
                            ],
                            stock: 25,
                            rating: 4.5,
                            reviews: 890,
                            tags: ['shoes', 'nike', 'running', 'sports'],
                            featured: false,
                            status: 'active' as const,
                            createdAt: new Date(),
                            updatedAt: new Date()
                          };
                          setFormData(testData);
                          setCategorySpecificData({
                            size: 'L',
                            color: 'Black/White',
                            material: 'Mesh and Synthetic',
                            gender: 'Unisex',
                            season: 'All Season'
                          });
                        }}
                        variant="secondary"
                        size="sm"
                      >
                        👕 Fashion
                      </Button>
                      <Button
                        onClick={() => {
                          // Automotive test data
                          const testData = {
                            name: 'Honda City VX',
                            description: 'Premium sedan with advanced safety features and fuel efficiency',
                            price: 1250000,
                            originalPrice: 1350000,
                            category: 'automotive',
                            brand: 'Honda',
                            image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=500',
                            images: [
                              'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=500',
                              'https://images.unsplash.com/photo-1549317336-206569e8475c?w=500'
                            ],
                            stock: 5,
                            rating: 4.6,
                            reviews: 234,
                            tags: ['car', 'honda', 'sedan', 'premium'],
                            featured: true,
                            status: 'active' as const,
                            createdAt: new Date(),
                            updatedAt: new Date()
                          };
                          setFormData(testData);
                          setCategorySpecificData({
                            year: 2024,
                            mileage: '0',
                            fuelType: 'Petrol',
                            transmission: 'Automatic',
                            bodyType: 'Sedan',
                            engine: '1.5L i-VTEC'
                          });
                        }}
                        variant="secondary"
                        size="sm"
                      >
                        🚗 Car
                      </Button>
                    </div>
                    <Button
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingProduct(null);
                        resetForm();
                      }}
                      variant="outline"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Enter product name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Brand
                      </label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Enter brand name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selling Price (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value));
                          setFormData({ ...formData, price: value });
                        }}
                        placeholder="Enter selling price"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter selling price in rupees</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Original Price (MRP) (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.originalPrice || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value));
                          setFormData({ ...formData, originalPrice: value });
                        }}
                        placeholder="Enter original price / MRP (optional)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter MRP for discount calculation (optional)</p>
                    </div>

                    <div>
                      <ProductCategoryPicker
                        category={formData.category}
                        subcategory={formData.subcategory || ''}
                        onCategoryChange={(categorySlug) => {
                          setFormData((prev) => ({
                            ...prev,
                            category: categorySlug,
                            subcategory: '',
                            subcategoryName: '',
                          }));
                          setCategorySpecificData({});
                        }}
                        onSubcategoryChange={(subcategorySlug, subcategoryName) => {
                          setFormData((prev) => ({
                            ...prev,
                            subcategory: subcategorySlug,
                            subcategoryName,
                          }));
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                        Stock Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={formData.stock || ''}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          // Allow empty input while typing
                          if (inputValue === '') {
                            setFormData({ ...formData, stock: 0 });
                            return;
                          }
                          const value = parseInt(inputValue);
                          // Only update if it's a valid number, allow typing freely
                          if (!isNaN(value)) {
                            setFormData({ ...formData, stock: value < 1 ? 1 : value });
                          }
                        }}
                        onBlur={(e) => {
                          // Validate on blur - ensure minimum is 1
                          const value = parseInt(e.target.value) || 0;
                          if (value < 1) {
                            setFormData({ ...formData, stock: 1 });
                          }
                        }}
                        placeholder="Enter stock quantity (minimum 1)"
                        className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 hover:border-gray-400 shadow-sm hover:shadow-md"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-2 flex items-center">
                        <span className="mr-1">⚠️</span>
                        Minimum stock quantity is 1. Products cannot have 0 stock.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Main Image *
                      </label>
                      <ImageUpload
                        onImageUpload={(url) => {
                          console.log('🖼️ ProductManagementPage: Image uploaded, setting formData.image to:', url);
                          setFormData({ ...formData, image: url });
                        }}
                        onImageRemove={() => {
                          console.log('🖼️ ProductManagementPage: Image removed, clearing formData.image');
                          setFormData({ ...formData, image: '' });
                        }}
                        currentImage={formData.image}
                        maxSize={10}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">Upload the primary product image (max 10MB)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Images
                      </label>
                      <div className="space-y-4">
                        {(formData.images || []).map((image, index) => (
                          <div key={index} className="relative">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600">Image {index + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newImages = (formData.images || []).filter((_, i) => i !== index);
                                  setFormData({ ...formData, images: newImages });
                                }}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors duration-200"
                                title={`Remove image ${index + 1}`}
                                aria-label={`Remove image ${index + 1}`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <ImageUpload
                              onImageUpload={(url) => {
                                const newImages = [...(formData.images || [])];
                                newImages[index] = url;
                                setFormData({ ...formData, images: newImages });
                              }}
                              onImageRemove={() => {
                                const newImages = (formData.images || []).filter((_, i) => i !== index);
                                setFormData({ ...formData, images: newImages });
                              }}
                              currentImage={image}
                              maxSize={10}
                              className="w-full"
                            />
                          </div>
                        ))}
                        {(formData.images || []).length < 5 && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, images: [...(formData.images || []), ''] });
                            }}
                            className="w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-red-500 hover:text-red-600 transition-colors duration-200 flex flex-col items-center justify-center"
                          >
                            <Plus className="w-6 h-6 mb-2" />
                            <span>Add Additional Image</span>
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Add up to 5 additional product images (max 10MB each)</p>
                    </div>

                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <SelectDropdown
                        id="status"
                        value={formData.status}
                        onChange={(value) =>
                          setFormData({ ...formData, status: value as 'active' | 'inactive' | 'draft' })
                        }
                        placeholder="Select Status"
                        options={statusOptions.map((status) => ({
                          value: status.value,
                          label: (
                            <span className="flex items-center space-x-2">
                              <span className="text-lg">{status.icon}</span>
                              <span className={`font-medium ${status.color}`}>{status.label}</span>
                            </span>
                          ),
                        }))}
                        buttonClassName="focus:ring-red-500"
                      />
                    </div>
                  </div>

                  {/* Category-Specific Fields */}
                  {Object.keys(categoryFields).length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Tag className="w-5 h-5 mr-2 text-blue-600" />
                        {topLevelCategories.find((c) => c.slug === formData.category)?.icon}{' '}
                        {topLevelCategories.find((c) => c.slug === formData.category)?.name} Specific Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(categoryFields).map(([key, field]) => (
                          <div key={key} className={field.type === 'multi-text' ? 'md:col-span-2' : ''}>
                            <label htmlFor={`category-${key}`} className="block text-sm font-medium text-gray-700 mb-2">
                              {field.label}
                            </label>
                            {field.type === 'select' ? (
                              <SelectDropdown
                                id={`category-${key}`}
                                value={categorySpecificData[key] || ''}
                                onChange={(value) => setCategorySpecificData({ ...categorySpecificData, [key]: value })}
                                placeholder={`Select ${field.label}`}
                                options={(field.options || []).map((option: string) => ({
                                  value: option,
                                  label: option,
                                }))}
                              />
                            ) : field.type === 'multi-select' ? (
                              <div className="flex flex-wrap gap-2">
                                {(field.options || []).map((option: string) => {
                                  const selected = (categorySpecificData[key] || []).includes(option);
                                  return (
                                    <button
                                      key={option}
                                      type="button"
                                      onClick={() => {
                                        const current = categorySpecificData[key] || [];
                                        const next = selected
                                          ? current.filter((value: string) => value !== option)
                                          : [...current, option];
                                        setCategorySpecificData({ ...categorySpecificData, [key]: next });
                                      }}
                                      className={`px-3 py-2 rounded-full text-sm font-medium border-2 ${
                                        selected
                                          ? 'bg-blue-500 text-white border-blue-500'
                                          : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                                      }`}
                                    >
                                      {option}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <input
                                id={`category-${key}`}
                                type="text"
                                value={categorySpecificData[key] || ''}
                                onChange={(e) => setCategorySpecificData({ ...categorySpecificData, [key]: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter product description (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-red-600 hover:text-red-800"
                            aria-label={`Remove ${tag} tag`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add a tag and press Enter"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
                      Featured Product
                    </label>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingProduct(null);
                        resetForm();
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Save className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {editingProduct ? 'Update Product' : 'Add Product'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Products List */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Products ({filteredProducts.length})
                </h2>

                {/* Search Bar */}
                <div className="relative flex-1 md:max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search products by name, brand, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 hover:border-gray-400 shadow-sm hover:shadow-md"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No products found</p>
                  <p className="text-gray-400">Add your first product to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg mb-1">{product.name}</h3>
                          <p className="text-gray-600 text-sm">{product.brand}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleEdit(product)}
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(product.id!)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {product.image && (
                        <div className="mb-4">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-2xl font-bold text-gray-900">₹{product.price}</span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-lg text-gray-500 line-through">₹{product.originalPrice}</span>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 mr-1" />
                            {product.rating} ({product.reviews})
                          </span>
                          <span>Stock: {product.stock}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.status === 'active' ? 'bg-green-100 text-green-800' :
                              product.status === 'inactive' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                            {product.status}
                          </span>
                          {product.featured && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Featured
                            </span>
                          )}
                        </div>

                        {product.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {product.tags.slice(0, 3).map((tag, index) => (
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

            {/* Message */}
            {message && (
              <div className={`mt-6 p-4 rounded-lg flex items-center ${isSuccess ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                {isSuccess ? '✅' : '❌'} {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductManagementPage;
