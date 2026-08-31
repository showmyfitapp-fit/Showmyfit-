'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail, Phone, MapPin, Edit, LogOut, Star,
  Calendar, Package, Plus,
  TrendingUp, DollarSign, Tag, XCircle, Save, X, Clock, BarChart3,
  Users, ShoppingBag, Eye, Activity, Download, RefreshCw, TrendingDown, Filter,
  Copy, Check, Link as LinkIcon
} from 'lucide-react';
// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import GoogleMapLocation from '@/components/common/GoogleMapLocation';
import Button from '@/components/ui/Button';
import ImageUpload from '@/components/common/ImageUpload';
import SellerQRCode from '@/components/common/SellerQRCode';
import WhatsAppButton from '@/components/common/WhatsAppButton';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/lib/auth';
import { fetchSellerOrders } from '@/lib/orders';
import {
  deleteProduct,
  getProductsBySeller,
  saveProduct,
  updateProductFields,
} from '@/lib/supabase/admin';
import ReservedProducts from '@/components/seller/ReservedProducts';
import ProductCategoryPicker from '@/components/seller/ProductCategoryPicker';
import SelectDropdown from '@/components/ui/SelectDropdown';
import { useCategories } from '@/hooks/useCategories';
import { getCategorySpecificFields } from '@/lib/categories/categoryFields';
import { buildProductSeoFields } from '@/utils/productSeo';
import { getProductPath } from '@/utils/productUrls';

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
  categorySpecificData?: Record<string, any>;
}

interface SellerProfilePageProps {
  currentUser: any;
  userData: any;
}

const SellerProfilePage: React.FC<SellerProfilePageProps> = ({ currentUser, userData }) => {
  const { signOut, refreshUserData, loading: authLoading } = useAuth();
  const router = useRouter();
  const navigate = (path: any) => router.push(path);

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Ensure we have valid user data before rendering
  if (!currentUser && !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to view your seller profile.</p>
          <Button onClick={() => router.push('/auth')}>Go to Login</Button>
        </div>
      </div>
    );
  }
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    displayName: userData?.displayName || currentUser?.displayName || '',
    phone: userData?.phone || '',
    address: userData?.address || '',
    businessName: userData?.businessName || '',
    businessType: userData?.businessType || '',
    businessDescription: userData?.businessDescription || '',
    location: userData?.location || null,
    profilePicture: userData?.profileImage || '',
    bannerImage: userData?.bannerImage || userData?.coverImage || '',
    instagramUrl: userData?.instagramUrl || userData?.instagram || '',
    facebookUrl: userData?.facebookUrl || userData?.facebook || ''
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showProfilePicUpload, setShowProfilePicUpload] = useState(false);
  const [profileLinkCopied, setProfileLinkCopied] = useState(false);
  const [categorySpecificData, setCategorySpecificData] = useState<Record<string, any>>({});
  const { topLevel: topLevelCategories } = useCategories();

  // Analytics & Charts State
  const [sellerStats, setSellerStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalViews: 0,
    conversionRate: 0,
    avgOrderValue: 0,
    loading: true
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [categorySalesData, setCategorySalesData] = useState<any[]>([]);
  const [orderData, setOrderData] = useState<any[]>([]);
  const [productPerformance, setProductPerformance] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [periodComparison, setPeriodComparison] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('7d');

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Predefined color palette for quick selection
  const predefinedColors = [
    'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange', 'Brown', 'Grey', 'Maroon', 'Navy', 'Beige', 'Teal', 'Olive', 'Gold', 'Silver'
  ];

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

  const statusOptions = [
    { value: 'active', label: 'Active', icon: '✅', color: 'text-green-600' },
    { value: 'inactive', label: 'Inactive', icon: '❌', color: 'text-red-600' },
    { value: 'draft', label: 'Draft', icon: '📝', color: 'text-yellow-600' }
  ];

  // Handle click outside overlay
  useEffect(() => {
    const handleOverlayClick = (event: MouseEvent) => {
      if (showAddProduct && (event.target as Element).classList.contains('bg-black')) {
        setShowAddProduct(false);
        setEditingProduct(null);
        resetForm();
      }
    };

    if (showAddProduct) {
      document.addEventListener('mousedown', handleOverlayClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOverlayClick);
    };
  }, [showAddProduct]);

  // Load seller products
  const loadProducts = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const productsData = (await getProductsBySeller(currentUser.uid)) as Product[];

      console.log('📦 Loaded products:', productsData);
      console.log('🖼️ Product images:', productsData.map(p => ({ id: p.id, name: p.name, image: p.image })));

      setProducts(productsData);

      // Fetch seller analytics after products are loaded
      if (currentUser?.uid) {
        await fetchSellerAnalytics(productsData);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch seller analytics and charts data
  const fetchSellerAnalytics = async (sellerProducts: Product[]) => {
    if (!currentUser?.uid) return;

    try {
      setSellerStats(prev => ({ ...prev, loading: true }));

      const orders = (await fetchSellerOrders(currentUser.uid)).map((order) => ({
        ...order,
        totalAmount: order.total,
        createdAt: { toDate: () => order.createdAt || new Date() },
      }));

      // Calculate stats
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate conversion rate (simplified - orders/products)
      const conversionRate = sellerProducts.length > 0 ? (totalOrders / sellerProducts.length) * 100 : 0;

      setSellerStats({
        totalRevenue,
        totalOrders,
        totalViews: 0, // Would need view tracking
        conversionRate: Math.round(conversionRate * 10) / 10,
        avgOrderValue: Math.round(avgOrderValue),
        loading: false
      });

      // Revenue trends (last 7 days)
      const revenueByDay: { [key: string]: number } = {};
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        revenueByDay[key] = 0;
        return { name: key, revenue: 0 };
      });

      orders.forEach(order => {
        if (order.createdAt) {
          const orderDate = order.createdAt.toDate();
          const key = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (revenueByDay.hasOwnProperty(key)) {
            revenueByDay[key] += order.totalAmount || 0;
          }
        }
      });

      setRevenueData(last7Days.map(day => ({
        name: day.name,
        revenue: revenueByDay[day.name] || 0
      })));

      // Sales by category
      const categorySales: { [key: string]: number } = {};
      orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const product = sellerProducts.find(p => p.id === item.productId);
            if (product && product.category) {
              categorySales[product.category] = (categorySales[product.category] || 0) + (item.price || 0) * (item.quantity || 1);
            }
          });
        }
      });

      setCategorySalesData(Object.entries(categorySales)
        .map(([name, value]) => ({ name, value: Math.round(value) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6));

      // Order statistics (last 7 days)
      const ordersByDay: { [key: string]: number } = {};
      const orderDays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        ordersByDay[key] = 0;
        return { name: key, orders: 0 };
      });

      orders.forEach(order => {
        if (order.createdAt) {
          const orderDate = order.createdAt.toDate();
          const key = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (ordersByDay.hasOwnProperty(key)) {
            ordersByDay[key]++;
          }
        }
      });

      setOrderData(orderDays.map(day => ({
        name: day.name,
        orders: ordersByDay[day.name] || 0
      })));

      // Product performance (top 5)
      const productSales: { [key: string]: { name: string; sales: number; revenue: number } } = {};

      orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const product = sellerProducts.find(p => p.id === item.productId);
            if (product) {
              if (!productSales[product.id!]) {
                productSales[product.id!] = {
                  name: product.name || 'Unknown',
                  sales: 0,
                  revenue: 0
                };
              }
              productSales[product.id!].sales += item.quantity || 1;
              productSales[product.id!].revenue += (item.price || 0) * (item.quantity || 1);
            }
          });
        }
      });

      setProductPerformance(Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map((p, i) => ({
          name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
          sales: p.sales,
          revenue: Math.round(p.revenue)
        })));

      // Monthly trends
      const monthlyData: { [key: string]: { revenue: number; orders: number } } = {};
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyData[key] = { revenue: 0, orders: 0 };
        return { name: key, revenue: 0, orders: 0 };
      });

      orders.forEach(order => {
        if (order.createdAt) {
          const orderDate = order.createdAt.toDate();
          const key = orderDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          if (monthlyData.hasOwnProperty(key)) {
            monthlyData[key].revenue += order.totalAmount || 0;
            monthlyData[key].orders++;
          }
        }
      });

      setMonthlyTrends(last6Months.map(month => ({
        name: month.name,
        revenue: Math.round(monthlyData[month.name]?.revenue || 0),
        orders: monthlyData[month.name]?.orders || 0
      })));

      setRecentOrders(orders.slice(0, 10).map((order) => ({
        id: order.id,
        orderId: String(order.id).slice(-8).toUpperCase(),
        customer: order.customerName || order.userId || 'Unknown',
        amount: order.totalAmount || 0,
        status: order.status || 'pending',
        date: order.createdAt.toDate(),
        items: order.items?.length || 0
      })));

      // Period comparison
      const now = new Date();
      const thisWeekStart = new Date(now);
      thisWeekStart.setDate(now.getDate() - now.getDay());
      thisWeekStart.setHours(0, 0, 0, 0);

      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      const lastWeekEnd = new Date(thisWeekStart);
      lastWeekEnd.setMilliseconds(-1);

      const thisWeekOrders = orders.filter((o: any) => {
        const orderDate = o.createdAt?.toDate();
        return orderDate && orderDate >= thisWeekStart;
      });

      const lastWeekOrders = orders.filter((o: any) => {
        const orderDate = o.createdAt?.toDate();
        return orderDate && orderDate >= lastWeekStart && orderDate < thisWeekStart;
      });

      const thisWeekRevenue = thisWeekOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
      const lastWeekRevenue = lastWeekOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
      const revenueChange = lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0;

      setPeriodComparison({
        revenue: {
          thisWeek: thisWeekRevenue,
          lastWeek: lastWeekRevenue,
          change: revenueChange
        },
        orders: {
          thisWeek: thisWeekOrders.length,
          lastWeek: lastWeekOrders.length,
          change: lastWeekOrders.length > 0 ? ((thisWeekOrders.length - lastWeekOrders.length) / lastWeekOrders.length) * 100 : 0
        }
      });

    } catch (error) {
      console.error('Error fetching seller analytics:', error);
      setSellerStats(prev => ({ ...prev, loading: false }));
    }
  };

  // Export functions
  const exportSellerReport = () => {
    const doc = new jsPDF();
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Header
    doc.setFillColor(59, 130, 246); // Blue
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Seller Dashboard Report', margin, 25);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 35);

    yPos = 50;
    doc.setTextColor(0, 0, 0);

    // Store Summary
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Store Summary', margin, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const summaryStats = [
      ['Business Name', userData?.businessName || 'N/A'],
      ['Total Products', products.length.toString()],
      ['Active Products', products.filter(p => p.status === 'active').length.toString()],
      ['Total Orders', sellerStats.totalOrders.toString()],
      ['Total Revenue', `₹${sellerStats.totalRevenue.toLocaleString()}`],
      ['Avg Order Value', `₹${sellerStats.avgOrderValue.toLocaleString()}`],
      ['Conversion Rate', `${sellerStats.conversionRate}%`]
    ];

    summaryStats.forEach(([label, value]) => {
      doc.text(`${label}:`, margin, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(value, margin + 80, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 7;
    });

    yPos += 5;

    // Recent Orders Table
    if (recentOrders.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Recent Orders', margin, yPos);
      yPos += 10;

      const orderHeaders = [['Order ID', 'Amount', 'Items', 'Status', 'Date']];
      const orderRows = recentOrders.slice(0, 20).map(o => [
        o.orderId,
        `₹${o.amount.toLocaleString()}`,
        o.items.toString(),
        o.status,
        o.date.toLocaleDateString()
      ]);

      (doc as any).autoTable({
        head: orderHeaders,
        body: orderRows,
        startY: yPos,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 8 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Category Sales
    if (categorySalesData.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Sales by Category', margin, yPos);
      yPos += 10;

      const categoryHeaders = [['Category', 'Revenue (₹)']];
      const categoryRows = categorySalesData.map(c => [c.name, c.value.toLocaleString()]);

      (doc as any).autoTable({
        head: categoryHeaders,
        body: categoryRows,
        startY: yPos,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 10 }
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Page ${i} of ${pageCount} | ShowMyFit Seller Dashboard`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`seller_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  useEffect(() => {
    loadProducts();
  }, [currentUser]);

  // Handle authentication redirect - only redirect if loading is complete and no user
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/auth');
    }
  }, [authLoading, currentUser, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      displayName: userData?.displayName || currentUser?.displayName || '',
      phone: userData?.phone || '',
      address: userData?.address || '',
      businessName: userData?.businessName || '',
      businessType: userData?.businessType || '',
      businessDescription: userData?.businessDescription || '',
      location: userData?.location || null,
      profilePicture: userData?.profileImage || '',
      bannerImage: userData?.bannerImage || userData?.coverImage || '',
      instagramUrl: userData?.instagramUrl || userData?.instagram || '',
      facebookUrl: userData?.facebookUrl || userData?.facebook || ''
    });
  };

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      console.log('Saving profile data:', editData);

      // Update the user profile with all business information
      await updateUserProfile(currentUser.uid, {
        displayName: editData.displayName,
        phone: editData.phone,
        address: editData.address,
        businessName: editData.businessName,
        businessType: editData.businessType,
        businessDescription: editData.businessDescription,
        businessAddress: editData.address, // Use address as business address
        location: editData.location,
        bannerImage: editData.bannerImage,
        instagramUrl: editData.instagramUrl,
        facebookUrl: editData.facebookUrl
      });

      console.log('Profile update successful, refreshing user data...');

      // Refresh user data to get the updated information
      await refreshUserData();

      console.log('User data refreshed successfully');

      setIsEditing(false);
      setMessage('Profile updated successfully!');
      setIsSuccess(true);
      setTimeout(() => {
        setMessage('');
        setIsSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Failed to update profile. Please try again.');
      setIsSuccess(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      displayName: userData?.displayName || currentUser?.displayName || '',
      phone: userData?.phone || '',
      address: userData?.address || '',
      businessName: userData?.businessName || '',
      businessType: userData?.businessType || '',
      businessDescription: userData?.businessDescription || '',
      location: userData?.location || null,
      profilePicture: userData?.profileImage || '',
      bannerImage: userData?.bannerImage || userData?.coverImage || '',
      instagramUrl: userData?.instagramUrl || userData?.instagram || '',
      facebookUrl: userData?.facebookUrl || userData?.facebook || ''
    });
  };

  const handleCopyProfileLink = async () => {
    if (!currentUser?.uid) return;

    const profileUrl = `https://showmyfit.com/seller/${currentUser.uid}`;

    try {
      await navigator.clipboard.writeText(profileUrl);
      setProfileLinkCopied(true);
      setTimeout(() => setProfileLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy profile link:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = profileUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setProfileLinkCopied(true);
        setTimeout(() => setProfileLinkCopied(false), 2000);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleProfilePicUpload = async (url: string) => {
    setEditData({ ...editData, profilePicture: url });

    // Save profile picture to database immediately
    if (currentUser) {
      try {
        console.log('💾 Saving profile picture to database:', url);
        await updateUserProfile(currentUser.uid, {
          profileImage: url
        });

        // Refresh user data to reflect the change
        await refreshUserData();

        setMessage('Profile picture updated successfully!');
        setIsSuccess(true);
        setTimeout(() => {
          setMessage('');
          setIsSuccess(false);
        }, 3000);
      } catch (error) {
        console.error('Error saving profile picture:', error);
        setMessage('Failed to save profile picture. Please try again.');
        setIsSuccess(false);
        setTimeout(() => setMessage(''), 3000);
      }
    }

    setShowProfilePicUpload(false);
  };

  const handleBannerImageUpload = async (url: string) => {
    setEditData({ ...editData, bannerImage: url });

    // Save banner image to database immediately
    if (currentUser) {
      try {
        console.log('💾 Saving banner image to database:', url);
        await updateUserProfile(currentUser.uid, {
          bannerImage: url
        });

        // Refresh user data to reflect the change
        await refreshUserData();

        setMessage('Banner image updated successfully!');
        setIsSuccess(true);
        setTimeout(() => {
          setMessage('');
          setIsSuccess(false);
        }, 3000);
      } catch (error) {
        console.error('Error saving banner image:', error);
        setMessage('Failed to save banner image. Please try again.');
        setIsSuccess(false);
        setTimeout(() => setMessage(''), 3000);
      }
    }
  };

  const handleBannerImageRemove = () => {
    setEditData({ ...editData, bannerImage: '' });
    if (currentUser) {
      updateUserProfile(currentUser.uid, {
        bannerImage: ''
      }).then(() => {
        refreshUserData();
      });
    }
  };

  const handleProfilePicRemove = async () => {
    setEditData({ ...editData, profilePicture: '' });

    // Remove profile picture from database immediately
    if (currentUser) {
      try {
        console.log('💾 Removing profile picture from database');
        await updateUserProfile(currentUser.uid, {
          profileImage: ''
        });

        // Refresh user data to reflect the change
        await refreshUserData();

        setMessage('Profile picture removed successfully!');
        setIsSuccess(true);
        setTimeout(() => {
          setMessage('');
          setIsSuccess(false);
        }, 3000);
      } catch (error) {
        console.error('Error removing profile picture:', error);
        setMessage('Failed to remove profile picture. Please try again.');
        setIsSuccess(false);
        setTimeout(() => setMessage(''), 3000);
      }
    }

    setShowProfilePicUpload(false);
  };

  const resetForm = () => {
    setFormData({
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
    setCategorySpecificData({});
  };

  // Tags feature removed per request

  // Validation function to check if form is valid
  const isFormValid = (): boolean => {
    // Check required fields
    const hasName = formData.name.trim() !== '';
    const hasBrand = formData.brand.trim() !== '';
    const hasPrice = formData.price > 0;
    const hasOriginalPrice = (formData.originalPrice ?? 0) > 0;
    const hasCategory = formData.category !== '';
    const hasSubcategory = formData.subcategory !== '';
    const hasStock = formData.stock >= 1;
    const hasImage = formData.image.trim() !== '';

    const categoryFields = getCategorySpecificFields(
      formData.category,
      categorySpecificData,
      formData.subcategoryName
    );
    const hasSizesField = 'sizes' in categoryFields && categoryFields.sizes?.type === 'multi-select';
    const hasSizes = hasSizesField
      ? (categorySpecificData.sizes && Array.isArray(categorySpecificData.sizes) && categorySpecificData.sizes.length > 0)
      : true;

    return hasName && hasBrand && hasPrice && hasOriginalPrice && hasCategory && hasSubcategory && hasStock && hasImage && hasSizes;
  };

  // Edit existing product: prefill the form and open modal
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price,
      originalPrice: product.originalPrice || 0,
      category: product.category,
      subcategory: product.subcategory || product.categorySpecificData?.subcategory || '',
      subcategoryName: product.subcategoryName || product.categorySpecificData?.subcategory || '',
      brand: product.brand,
      image: product.image,
      images: product.images || [],
      stock: product.stock,
      rating: product.rating || 0,
      reviews: product.reviews || 0,
      tags: [],
      featured: false,
      status: product.status || 'active',
      createdAt: product.createdAt,
      updatedAt: new Date()
    });
    setCategorySpecificData(product.categorySpecificData || {});
    setShowAddProduct(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Check if user has seller role
    if (userData?.role !== 'shop') {
      setMessage('Only sellers can create products. Please apply to become a seller first.');
      setIsSuccess(false);
      return;
    }

    try {
      console.log('🔍 Creating product for user:', {
        uid: currentUser.uid,
        role: userData?.role,
        displayName: userData?.displayName || currentUser.displayName
      });

      const seoFields = buildProductSeoFields({
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        subcategory: formData.subcategory,
        subcategoryName: formData.subcategoryName,
        tags: formData.tags,
        sellerName: userData?.displayName || currentUser.displayName,
        description: formData.description,
        existingSlug: editingProduct?.slug,
        productId: editingProduct?.id,
      });

      const productData = {
        ...formData,
        ...seoFields,
        sellerId: currentUser.uid,
        sellerName: userData?.displayName || currentUser.displayName,
        categorySpecificData,
        createdAt: editingProduct ? formData.createdAt : new Date(),
        updatedAt: new Date()
      };

      console.log('📦 Product data to save:', productData);
      console.log('🖼️ Product image URL:', productData.image);

      if (editingProduct) {
        await saveProduct(productData, editingProduct.id);
        setMessage('Product updated successfully!');
      } else {
        await saveProduct(productData);
        setMessage('Product added successfully!');
      }

      setIsSuccess(true);
      setShowAddProduct(false);
      setEditingProduct(null);
      resetForm();
      await loadProducts();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Error saving product:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details
      });

      let errorMessage = 'Failed to save product. Please try again.';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please make sure you are logged in as a seller.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      }

      setMessage(errorMessage);
      setIsSuccess(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteProduct(productId);
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  const handleToggleProductStatus = async (productId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateProductFields(productId, { status: newStatus });
      await loadProducts();
    } catch (error) {
      console.error('Error updating product status:', error);
      alert('Failed to update product status. Please try again.');
    }
  };

  // Show loading while authentication is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated (after loading is complete)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Message Display */}
      {message && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg ${isSuccess ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
          {message}
        </div>
      )}

      <div className="main-content pt-4">
        <div className="max-w-7xl mx-auto px-4 py-6">

          {/* Edit Profile Form - Show at Top When Editing */}
          {isEditing ? (
            <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Cancel editing"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={editData.displayName}
                    onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your display name"
                    aria-label="Display Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your phone number"
                    aria-label="Phone Number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={editData.address}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter your address"
                    aria-label="Address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                  <input
                    type="text"
                    value={editData.businessName}
                    onChange={(e) => setEditData({ ...editData, businessName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your business name"
                    aria-label="Business Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                  <input
                    type="text"
                    value={editData.businessType}
                    onChange={(e) => setEditData({ ...editData, businessType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your business type"
                    aria-label="Business Type"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
                  <textarea
                    value={editData.businessDescription}
                    onChange={(e) => setEditData({ ...editData, businessDescription: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter your business description"
                    aria-label="Business Description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cover Banner Image</label>
                  <p className="text-xs text-gray-500 mb-3">
                    Upload a banner image for your store profile (recommended: 1200x400px)
                  </p>
                  <ImageUpload
                    onImageUpload={handleBannerImageUpload}
                    onImageRemove={handleBannerImageRemove}
                    currentImage={editData.bannerImage}
                    maxSize={5}
                    className="w-full"
                  />
                  {editData.bannerImage && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={editData.bannerImage}
                        alt="Banner preview"
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                  <input
                    type="url"
                    value={editData.instagramUrl}
                    onChange={(e) => setEditData({ ...editData, instagramUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://instagram.com/yourprofile"
                    aria-label="Instagram URL"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter your Instagram profile URL</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
                  <input
                    type="url"
                    value={editData.facebookUrl}
                    onChange={(e) => setEditData({ ...editData, facebookUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://facebook.com/yourpage"
                    aria-label="Facebook URL"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter your Facebook page/profile URL</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Store Location</label>
                    {editData.location && (
                      <Button
                        onClick={() => {
                          const { lat, lng } = editData.location;
                          const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}&z=15&t=m&hl=en&gl=IN&mapclient=embed`;
                          window.open(mapsUrl, '_blank');
                        }}
                        variant="outline"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400"
                      >
                        <MapPin className="w-4 h-4 mr-1" />
                        View on Google Maps
                      </Button>
                    )}
                  </div>
                  <GoogleMapLocation
                    location={editData.location}
                    onLocationChange={(location) => setEditData({ ...editData, location })}
                    isEditing={true}
                    height="250px"
                  />
                </div>
                <div className="flex space-x-3 pt-4 sticky bottom-0 bg-white pb-2 border-t border-gray-200 -mx-6 px-6">
                  <Button onClick={handleSave} variant="primary" className="flex-1">
                    Save Changes
                  </Button>
                  <Button onClick={handleCancel} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Facebook-style Banner with Circular Profile Picture */}
              <div className="relative mb-6">
                {/* Banner/Cover Photo */}
                <div className="relative w-full h-48 md:h-56 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 overflow-hidden">
                  {userData?.bannerImage ? (
                    <img
                      src={userData.bannerImage}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>

                {/* Profile Section - White Card with Overlapping Profile Picture */}
                <div className="bg-white rounded-t-3xl -mt-20 relative z-10 shadow-lg">
                  <div className="px-4 md:px-6 pt-24 pb-6">
                    {/* Profile Picture - Circular, Overlapping Banner */}
                    <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
                      <div className="relative flex-shrink-0">
                        {editData.profilePicture ? (
                          <img
                            src={editData.profilePicture}
                            alt="Profile"
                            className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-2xl"
                          />
                        ) : (
                          <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-5xl md:text-6xl font-bold border-4 border-white shadow-2xl">
                            {(() => {
                              const name = userData?.displayName || currentUser?.displayName;
                              const initial = (name && typeof name === 'string' && name.length > 0) ? name.charAt(0) : 'S';
                              return initial.toUpperCase();
                            })()}
                          </div>
                        )}
                        <button
                          onClick={() => setShowProfilePicUpload(!showProfilePicUpload)}
                          className="absolute -bottom-1 -right-1 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg hover:scale-110 border-4 border-white z-10"
                          title="Edit profile picture"
                          aria-label="Edit profile picture"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Profile Details */}
                      <div className="flex-1 pt-2 pb-2">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                          {userData?.businessName || userData?.displayName || currentUser?.displayName || 'Seller'}
                        </h1>
                        {userData?.businessType && (
                          <p className="text-base md:text-lg text-gray-600 mb-2">{userData.businessType}</p>
                        )}
                        {userData?.businessDescription && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{userData.businessDescription}</p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons - Small buttons on top */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <Button
                        onClick={handleEdit}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1.5 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all text-sm"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Profile</span>
                      </Button>

                      {currentUser?.uid && (
                        <SellerQRCode
                          sellerId={currentUser.uid || ''}
                          sellerName={userData?.displayName || currentUser?.displayName || ''}
                          businessName={userData?.businessName || ''}
                          className="flex items-center"
                        />
                      )}

                      <Button
                        onClick={exportSellerReport}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1.5 border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-all text-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export</span>
                      </Button>
                    </div>

                    {/* Add Product Button - Long button at bottom */}
                    <Button
                      onClick={() => setShowAddProduct(true)}
                      variant="primary"
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all py-3 text-base font-medium"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Add Product</span>
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Only show other content when NOT editing */}
          {!isEditing && (
            <React.Fragment>
              {/* Profile Picture Upload Modal */}
              {showProfilePicUpload && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Update Profile Picture</h2>
                    <button
                      onClick={() => setShowProfilePicUpload(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Close profile picture upload"
                      aria-label="Close profile picture upload"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="max-w-md mx-auto">
                    <ImageUpload
                      onImageUpload={handleProfilePicUpload}
                      onImageRemove={handleProfilePicRemove}
                      currentImage={editData.profilePicture}
                      maxSize={5}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Upload a profile picture (max 5MB, JPEG, PNG, or WEBP)
                    </p>

                    <div className="flex space-x-3 mt-4">
                      <Button
                        onClick={() => {
                          // Save the profile picture immediately when uploaded
                          setShowProfilePicUpload(false);
                        }}
                        variant="primary"
                        size="sm"
                        className="flex-1"
                      >
                        Done
                      </Button>
                      <Button
                        onClick={() => setShowProfilePicUpload(false)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Message */}
              {message && (
                <div className={`mb-6 p-4 rounded-lg ${isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {message}
                </div>
              )}

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Left Column - Profile Info & Stats */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Stats Cards - Enhanced Design */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Store Statistics
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl hover:shadow-md transition-all">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Package className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Products</p>
                            <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl hover:shadow-md transition-all">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                            <TrendingUp className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Active Products</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {products.filter(p => p.status === 'active').length}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-xl hover:shadow-md transition-all">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                            <DollarSign className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">
                              ₹{sellerStats.loading ? '...' : sellerStats.totalRevenue.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-indigo-100/50 rounded-xl hover:shadow-md transition-all">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                            <ShoppingBag className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Orders</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {sellerStats.loading ? '...' : sellerStats.totalOrders}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-teal-100/50 rounded-xl hover:shadow-md transition-all">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Eye className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                            <p className="text-2xl font-bold text-gray-900">
                              ₹{sellerStats.loading ? '...' : sellerStats.avgOrderValue.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-pink-100/50 rounded-xl hover:shadow-md transition-all">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Activity className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {sellerStats.loading ? '...' : `${sellerStats.conversionRate}%`}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100/50 rounded-xl hover:shadow-md transition-all">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Star className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Rating</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {(userData?.stats?.rating || 0).toFixed(1)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-xl hover:shadow-md transition-all">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Clock className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Reserved</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {userData?.stats?.reservedCount || '0'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Link Card - Enhanced Design */}
                  {currentUser?.uid && (
                    <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-2xl shadow-xl overflow-hidden">
                      <div className="bg-white/10 backdrop-blur-sm px-6 py-4">
                        <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                          <LinkIcon className="w-5 h-5" />
                          My Profile Link
                        </h3>
                      </div>
                      <div className="p-6 bg-white/95">
                        <p className="text-sm text-gray-700 mb-4 text-center font-medium">
                          Share your store profile with customers
                        </p>
                        <div className="mb-4">
                          <div className="flex items-center gap-2 bg-white rounded-xl p-3 border-2 border-gray-200 shadow-sm hover:border-green-400 transition-all">
                            <input
                              type="text"
                              value={`https://showmyfit.com/seller/${currentUser.uid}`}
                              readOnly
                              className="flex-1 text-sm font-mono text-gray-700 bg-transparent border-none outline-none truncate"
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                              aria-label="Profile link"
                            />
                            <button
                              onClick={handleCopyProfileLink}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl whitespace-nowrap font-medium"
                              title="Copy profile link"
                            >
                              {profileLinkCopied ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  <span className="text-sm">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  <span className="text-sm">Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 text-center">
                          💡 Share this link on social media, WhatsApp, or email
                        </p>
                      </div>
                    </div>
                  )}

                  {/* QR Code Card - Enhanced Design */}
                  {currentUser?.uid && (
                    <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl overflow-hidden">
                      <div className="bg-white/10 backdrop-blur-sm px-6 py-4">
                        <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                          My Store QR Code
                        </h3>
                      </div>
                      <div className="p-6 bg-white/95 text-center">
                        <p className="text-sm text-gray-700 mb-4 font-medium">
                          Scan to visit your store on ShowMyFit
                        </p>
                        <div className="flex justify-center mb-4">
                          <div className="bg-white p-4 rounded-xl shadow-lg">
                            <SellerQRCode
                              sellerId={currentUser?.uid || ''}
                              sellerName={userData?.displayName || currentUser?.displayName || ''}
                              businessName={userData?.businessName || ''}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-600">
                          💡 Share on social media, business cards, or print for your store
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Profile Information */}
                  {!isEditing && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{currentUser?.email}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{userData?.phone || 'Not provided'}</span>
                        </div>
                        <div className="flex items-start space-x-3">
                          <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                          <span className="text-gray-600">{userData?.address || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            Joined {userData?.createdAt ?
                              (userData.createdAt instanceof Date ?
                                userData.createdAt.toLocaleDateString() :
                                new Date(userData.createdAt).toLocaleDateString()
                              ) : 'Unknown'}
                          </span>
                        </div>
                        <div className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-700">Store Location</p>
                            {userData?.location && (
                              <Button
                                onClick={() => {
                                  const { lat, lng } = userData.location;
                                  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}&z=15&t=m&hl=en&gl=IN&mapclient=embed`;
                                  window.open(mapsUrl, '_blank');
                                }}
                                variant="outline"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400"
                              >
                                <MapPin className="w-4 h-4 mr-1" />
                                View on Google Maps
                              </Button>
                            )}
                          </div>
                          <GoogleMapLocation
                            location={userData?.location || null}
                            onLocationChange={() => { }}
                            isEditing={false}
                            height="200px"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Right Column - Products & Analytics */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Analytics Section */}
                    <div className="space-y-6">
                      {/* Period Comparison */}
                      {periodComparison && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                            This Week vs Last Week
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm text-green-700">Revenue</div>
                                {periodComparison.revenue.change >= 0 ? (
                                  <TrendingUp className="w-5 h-5 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-5 h-5 text-red-600" />
                                )}
                              </div>
                              <div className="text-2xl font-bold text-green-900">
                                ₹{periodComparison.revenue.thisWeek.toLocaleString()}
                              </div>
                              <div className={`text-sm mt-1 ${periodComparison.revenue.change >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {periodComparison.revenue.change >= 0 ? '+' : ''}{periodComparison.revenue.change.toFixed(1)}% vs last week
                              </div>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm text-blue-700">Orders</div>
                                {periodComparison.orders.change >= 0 ? (
                                  <TrendingUp className="w-5 h-5 text-blue-600" />
                                ) : (
                                  <TrendingDown className="w-5 h-5 text-red-600" />
                                )}
                              </div>
                              <div className="text-2xl font-bold text-blue-900">
                                {periodComparison.orders.thisWeek}
                              </div>
                              <div className={`text-sm mt-1 ${periodComparison.orders.change >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                                {periodComparison.orders.change >= 0 ? '+' : ''}{periodComparison.orders.change.toFixed(1)}% vs last week
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Charts Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revenue Trends */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                              Revenue Trends
                            </h3>
                            <button
                              onClick={() => exportSellerReport()}
                              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Export
                            </button>
                          </div>
                          {/* TEMPORARILY DISABLED - Recharts causing forwardRef error */}
                          <div className="h-48 flex items-center justify-center">
                            <div className="text-gray-400">Charts temporarily disabled</div>
                          </div>
                        </div>

                        {/* Sales by Category */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Tag className="w-5 h-5 mr-2 text-purple-600" />
                            Sales by Category
                          </h3>
                          {sellerStats.loading || categorySalesData.length === 0 ? (
                            <div className="h-48 flex items-center justify-center">
                              <div className="animate-pulse text-gray-400">Loading chart...</div>
                            </div>
                          ) : (
                            <div className="h-48">
                              <Pie
                                data={{
                                  labels: categorySalesData.map(d => d.name),
                                  datasets: [{
                                    data: categorySalesData.map(d => d.value),
                                    backgroundColor: [
                                      'rgba(139, 92, 246, 0.8)',
                                      'rgba(59, 130, 246, 0.8)',
                                      'rgba(16, 185, 129, 0.8)',
                                      'rgba(251, 191, 36, 0.8)',
                                      'rgba(239, 68, 68, 0.8)',
                                      'rgba(236, 72, 153, 0.8)'
                                    ],
                                    borderColor: [
                                      'rgb(139, 92, 246)',
                                      'rgb(59, 130, 246)',
                                      'rgb(16, 185, 129)',
                                      'rgb(251, 191, 36)',
                                      'rgb(239, 68, 68)',
                                      'rgb(236, 72, 153)'
                                    ],
                                    borderWidth: 2
                                  }]
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      position: 'bottom' as const,
                                    },
                                    tooltip: {
                                      callbacks: {
                                        label: function (context) {
                                          const label = context.label || '';
                                          const value = context.parsed || 0;
                                          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                                          const percentage = ((value / total) * 100).toFixed(0);
                                          return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
                                        }
                                      }
                                    }
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Order Statistics */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <ShoppingBag className="w-5 h-5 mr-2 text-blue-600" />
                            Daily Orders
                          </h3>
                          {sellerStats.loading || orderData.length === 0 ? (
                            <div className="h-48 flex items-center justify-center">
                              <div className="animate-pulse text-gray-400">Loading chart...</div>
                            </div>
                          ) : (
                            <div className="h-48">
                              <Bar
                                data={{
                                  labels: orderData.map(d => d.name),
                                  datasets: [{
                                    label: 'Orders',
                                    data: orderData.map(d => d.orders),
                                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                                    borderColor: 'rgb(59, 130, 246)',
                                    borderWidth: 1,
                                    borderRadius: 8
                                  }]
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      display: false
                                    }
                                  },
                                  scales: {
                                    y: {
                                      beginAtZero: true,
                                      ticks: {
                                        stepSize: 1
                                      }
                                    }
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Product Performance */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Star className="w-5 h-5 mr-2 text-yellow-600" />
                            Top Products
                          </h3>
                          {sellerStats.loading || productPerformance.length === 0 ? (
                            <div className="h-48 flex items-center justify-center">
                              <div className="animate-pulse text-gray-400">Loading chart...</div>
                            </div>
                          ) : (
                            <div className="h-48">
                              <Bar
                                data={{
                                  labels: productPerformance.map(d => d.name),
                                  datasets: [{
                                    label: 'Revenue (₹)',
                                    data: productPerformance.map(d => d.revenue),
                                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                                    borderColor: 'rgb(245, 158, 11)',
                                    borderWidth: 1,
                                    borderRadius: 8
                                  }]
                                }}
                                options={{
                                  indexAxis: 'y' as const,
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      display: false
                                    },
                                    tooltip: {
                                      callbacks: {
                                        label: function (context) {
                                          return `₹${(context.parsed.x ?? 0).toLocaleString()}`;
                                        }
                                      }
                                    }
                                  },
                                  scales: {
                                    x: {
                                      beginAtZero: true,
                                      ticks: {
                                        callback: function (value) {
                                          return '₹' + value.toLocaleString();
                                        }
                                      }
                                    }
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Monthly Trends */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
                          Monthly Trends (Last 6 Months)
                        </h3>
                        {sellerStats.loading || monthlyTrends.length === 0 ? (
                          <div className="h-64 flex items-center justify-center">
                            <div className="animate-pulse text-gray-400">Loading chart...</div>
                          </div>
                        ) : (
                          <div className="h-64">
                            <Bar
                              data={{
                                labels: monthlyTrends.map(d => d.name),
                                datasets: [
                                  {
                                    label: 'Revenue (₹)',
                                    data: monthlyTrends.map(d => d.revenue),
                                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                                    borderColor: 'rgb(59, 130, 246)',
                                    borderWidth: 1,
                                    borderRadius: 8,
                                    yAxisID: 'y'
                                  },
                                  {
                                    label: 'Orders',
                                    data: monthlyTrends.map(d => d.orders),
                                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                                    borderColor: 'rgb(16, 185, 129)',
                                    borderWidth: 1,
                                    borderRadius: 8,
                                    yAxisID: 'y1'
                                  }
                                ]
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    display: true,
                                    position: 'top' as const,
                                  },
                                  tooltip: {
                                    callbacks: {
                                      label: function (context) {
                                        const label = context.dataset.label || '';
                                        const value = context.parsed.y ?? 0;
                                        if (label.includes('Revenue')) {
                                          return `${label}: ₹${value.toLocaleString()}`;
                                        }
                                        return `${label}: ${value}`;
                                      }
                                    }
                                  }
                                },
                                scales: {
                                  y: {
                                    type: 'linear' as const,
                                    display: true,
                                    position: 'left' as const,
                                    beginAtZero: true,
                                    ticks: {
                                      callback: function (value) {
                                        return '₹' + value.toLocaleString();
                                      }
                                    }
                                  },
                                  y1: {
                                    type: 'linear' as const,
                                    display: true,
                                    position: 'right' as const,
                                    beginAtZero: true,
                                    grid: {
                                      drawOnChartArea: false
                                    }
                                  }
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Recent Orders Table */}
                      {recentOrders.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                              <Clock className="w-5 h-5 mr-2 text-orange-600" />
                              Recent Orders
                            </h3>
                            <button
                              onClick={() => exportSellerReport()}
                              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Export PDF
                            </button>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Order ID</th>
                                  <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Amount</th>
                                  <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Items</th>
                                  <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Status</th>
                                  <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {recentOrders.map((order) => (
                                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-2 px-3 text-sm font-mono text-gray-900">{order.orderId}</td>
                                    <td className="py-2 px-3 text-sm font-semibold text-gray-900">₹{order.amount.toLocaleString()}</td>
                                    <td className="py-2 px-3 text-sm text-gray-700">{order.items}</td>
                                    <td className="py-2 px-3">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-red-100 text-red-800'
                                        }`}>
                                        {order.status}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-sm text-gray-600">
                                      {order.date.toLocaleDateString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Products Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">My Products ({products.length})</h3>
                        <Button
                          onClick={() => setShowAddProduct(true)}
                          variant="primary"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Product
                        </Button>
                      </div>

                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-gray-600">Loading products...</p>
                        </div>
                      ) : products.length === 0 ? (
                        <div className="text-center py-8">
                          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
                          <p className="text-gray-600 mb-4">Start by adding your first product to your store.</p>
                          <Button
                            onClick={() => setShowAddProduct(true)}
                            variant="primary"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your First Product
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {products.map((product) => (
                            <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              {/* Clickable Product Link */}
                              <Link
                                href={product.id ? getProductPath({ id: product.id, slug: product.slug }) : '#'}
                                className="block hover:opacity-90 transition-opacity cursor-pointer"
                              >
                                {/* Product Image */}
                                {product.image && (
                                  <div className="mb-4">
                                    <img
                                      src={product.image}
                                      alt={product.name}
                                      className="w-full h-48 object-cover rounded-lg"
                                      onError={(e) => {
                                        console.error('Error loading product image:', product.image);
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}

                                <div className="flex items-start justify-between mb-3">
                                  <h4 className="font-semibold text-gray-900 truncate">{product.name}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {product.status}
                                  </span>
                                </div>

                                {product.description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>}

                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-lg font-bold text-blue-600">₹{product.price.toLocaleString()}</span>
                                  <span className="text-sm text-gray-500">Stock: {product.stock}</span>
                                </div>

                                {/* Click indicator */}
                                <div className="text-center mt-2">
                                  <span className="text-xs text-blue-600 font-medium hover:text-blue-800 transition-colors">
                                    Click to view details →
                                  </span>
                                </div>
                              </Link>

                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => handleToggleProductStatus(product.id!, product.status)}
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                >
                                  {product.status === 'active' ? 'Deactivate' : 'Activate'}
                                </Button>
                                <Button
                                  onClick={() => handleEditProduct(product)}
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                >
                                  Edit
                                </Button>
                                <Button
                                  onClick={() => handleDeleteProduct(product.id!)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reserved Products Section */}
              <div className="mb-8">
                <ReservedProducts sellerId={currentUser?.uid || ''} />
              </div>

              {/* Add/Edit Product Form Overlay */}
              {showAddProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 pb-16 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">
                          {editingProduct ? 'Edit Product' : 'Add New Product'}
                        </h2>
                        <button
                          onClick={() => {
                            setShowAddProduct(false);
                            setEditingProduct(null);
                            resetForm();
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                          title="Close form"
                          aria-label="Close form"
                        >
                          <XCircle className="w-6 h-6" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        {/* Cancel Button - Full Width on Mobile */}
                        <Button
                          onClick={() => {
                            setShowAddProduct(false);
                            setEditingProduct(null);
                            resetForm();
                          }}
                          variant="outline"
                          className="w-full sm:w-auto"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 pb-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product Name *
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Enter product name"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Brand *
                          </label>
                          <input
                            type="text"
                            value={formData.brand}
                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Enter brand name"
                            required
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Enter selling price"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">Enter selling price in rupees</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Original Price (MRP) (₹) *
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Enter original price / MRP"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">Enter MRP for discount calculation</p>
                        </div>

                        <div className="md:col-span-2">
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
                            className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-gray-400 shadow-sm hover:shadow-md"
                            placeholder="Enter stock quantity (minimum 1)"
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
                              console.log('🖼️ SellerProfilePage: Image uploaded, setting formData.image to:', url);
                              setFormData({ ...formData, image: url });
                            }}
                            onImageRemove={() => {
                              console.log('🖼️ SellerProfilePage: Image removed, clearing formData.image');
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
                                className="w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors duration-200 flex flex-col items-center justify-center"
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
                            buttonClassName="focus:ring-green-500"
                          />
                        </div>
                      </div>

                      {/* Category-Specific Fields */}
                      {Object.keys(getCategorySpecificFields(formData.category, categorySpecificData, formData.subcategoryName)).length > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Tag className="w-5 h-5 mr-2 text-blue-600" />
                            {topLevelCategories.find((c) => c.slug === formData.category)?.icon}{' '}
                            {topLevelCategories.find((c) => c.slug === formData.category)?.name} Specific Details
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(getCategorySpecificFields(formData.category, categorySpecificData, formData.subcategoryName)).map(([key, field]) => {
                              const currentField = field;
                              return (
                                <div key={key} className={currentField.type === 'multi-text' ? 'md:col-span-2' : ''}>
                                  <label htmlFor={`category-${key}`} className="block text-sm font-medium text-gray-700 mb-2">
                                    {currentField.label}
                                    {currentField.type === 'multi-select' && <span className="text-red-500 ml-1">*</span>}
                                  </label>

                                  {currentField.type === 'select' ? (
                                    <SelectDropdown
                                      id={`category-${key}`}
                                      value={(categorySpecificData[key] as string) || ''}
                                      onChange={(value) => setCategorySpecificData({ ...categorySpecificData, [key]: value })}
                                      placeholder={`Select ${currentField.label}`}
                                      options={(currentField.options || []).map((option: string) => ({
                                        value: option,
                                        label: option,
                                      }))}
                                    />
                                  ) : currentField.type === 'multi-select' ? (
                                    <div className="space-y-2">
                                      <div className="flex flex-wrap gap-2">
                                        {(currentField.options || []).map((option: string) => {
                                          const isSelected = (categorySpecificData[key] || []).includes(option);
                                          return (
                                            <button
                                              key={option}
                                              type="button"
                                              onClick={() => {
                                                const currentValues = categorySpecificData[key] || [];
                                                const newValues = isSelected
                                                  ? currentValues.filter((v: string) => v !== option)
                                                  : [...currentValues, option];
                                                setCategorySpecificData({ ...categorySpecificData, [key]: newValues });
                                              }}
                                              className={`px-3 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${isSelected
                                                ? 'bg-blue-500 text-white border-2 border-blue-500'
                                                : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-200'
                                                }`}
                                            >
                                              {option}
                                            </button>
                                          );
                                        })}
                                      </div>
                                      <p className="text-xs text-gray-500">Click to select multiple options</p>
                                      {/* Show custom sizes input when "Other" is selected */}
                                      {key === 'sizes' && (categorySpecificData[key] || []).includes('Other') && (
                                        <input
                                          id={`category-${key}Other`}
                                          type="text"
                                          value={categorySpecificData['sizeOther'] || ''}
                                          onChange={(e) => setCategorySpecificData({ ...categorySpecificData, sizeOther: e.target.value })}
                                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
                                          placeholder="Enter custom sizes separated by commas (e.g., Free Size, One Size, etc.)"
                                        />
                                      )}
                                    </div>
                                  ) : currentField.type === 'multi-text' ? (
                                    <div>
                                      {key === 'colors' && (
                                        <div className="mb-3">
                                          <div className="flex flex-wrap gap-2">
                                            {predefinedColors.map((c) => {
                                              const current = (categorySpecificData.colors || '').split(',').map((s: string) => s.trim()).filter(Boolean);
                                              const isSelected = current.includes(c);
                                              const addColor = () => {
                                                if (!isSelected) {
                                                  const next = [...current, c].join(', ');
                                                  setCategorySpecificData({ ...categorySpecificData, colors: next });
                                                }
                                              };
                                              const removeColor = () => {
                                                const next = current.filter((v: string) => v !== c).join(', ');
                                                setCategorySpecificData({ ...categorySpecificData, colors: next });
                                              };
                                              return (
                                                <button
                                                  key={c}
                                                  type="button"
                                                  onClick={isSelected ? removeColor : addColor}
                                                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                                                  title={c}
                                                  aria-label={`Select color ${c}`}
                                                >
                                                  <span className={`inline-block w-3 h-3 rounded-full mr-2 align-middle bg-[${c.toLowerCase()}]`}></span>
                                                  {c}
                                                </button>
                                              );
                                            })}
                                          </div>
                                          <p className="text-xs text-gray-500 mt-1">Tap to toggle predefined colors. You can also add custom colors below.</p>
                                        </div>
                                      )}
                                      <textarea
                                        id={`category-${key}`}
                                        value={categorySpecificData[key] || ''}
                                        onChange={(e) => setCategorySpecificData({ ...categorySpecificData, [key]: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder={key === 'colors' ? 'Enter additional colors separated by commas (e.g., Lavender, Mint)' : (currentField.placeholder || `Enter ${currentField.label.toLowerCase()}`)}
                                        rows={3}
                                      />
                                      <p className="text-xs text-gray-500 mt-1">Separate multiple items with commas</p>
                                    </div>
                                  ) : (currentField.type as string) === 'number' ? (
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={categorySpecificData[key] || ''}
                                      onChange={(e) => {
                                        const value = Math.max(0, parseFloat(e.target.value) || 0);
                                        setCategorySpecificData({ ...categorySpecificData, [key]: value });
                                      }}
                                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder={currentField.placeholder || `Enter ${currentField.label.toLowerCase()}`}
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={categorySpecificData[key] || ''}
                                      onChange={(e) => setCategorySpecificData({ ...categorySpecificData, [key]: e.target.value })}
                                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder={currentField.placeholder || `Enter ${currentField.label.toLowerCase()}`}
                                    />
                                  )}
                                </div>
                              );
                            })}
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Enter product description (optional)"
                        />
                      </div>

                      {/* Tags and Featured Product removed per request */}

                      {/* Validation Message */}
                      {!isFormValid() && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                          <p className="text-sm font-medium text-yellow-800 mb-2">
                            Please complete all required fields to continue:
                          </p>
                          <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                            {formData.name.trim() === '' && <li>Product Name is required</li>}
                            {formData.brand.trim() === '' && <li>Brand Name is required</li>}
                            {formData.price <= 0 && <li>Selling Price must be greater than 0</li>}
                            {(formData.originalPrice ?? 0) <= 0 && <li>Original Price (MRP) must be greater than 0</li>}
                            {formData.category === '' && <li>Category must be selected</li>}
                            {formData.stock < 1 && <li>Stock Quantity must be at least 1</li>}
                            {formData.image.trim() === '' && <li>At least one product image must be uploaded</li>}
                            {(() => {
                              const categoryFields = getCategorySpecificFields(formData.category, categorySpecificData, formData.subcategoryName);
                              const hasSizesField = 'sizes' in categoryFields && categoryFields.sizes?.type === 'multi-select';
                              const hasSizes = hasSizesField
                                ? (categorySpecificData.sizes && Array.isArray(categorySpecificData.sizes) && categorySpecificData.sizes.length > 0)
                                : true;
                              return hasSizesField && !hasSizes && <li>At least one size must be selected</li>;
                            })()}
                          </ul>
                        </div>
                      )}

                      <div className="flex justify-end space-x-4 pt-6 pb-8 border-t border-gray-200">
                        <Button
                          type="button"
                          onClick={() => {
                            setShowAddProduct(false);
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
                          className={`${!isFormValid() ? 'bg-gray-400 cursor-not-allowed hover:bg-gray-400 opacity-60' : 'bg-green-600 hover:bg-green-700'}`}
                          disabled={!isFormValid()}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {editingProduct ? 'Update Product' : 'Add Product'}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Sign Out Button */}
              <div className="text-center">
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </React.Fragment>
          )}
        </div>
      </div>
      {/* WhatsApp Floating Button - Appears on seller profile page */}
      <WhatsAppButton
        phoneNumber="918281474541"
        message="Hello, I need help with ShowMyFit"
      />
    </div>
  );
};

export default SellerProfilePage;
