'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Store,
  Package,
  ShoppingBag,
  BarChart3,
  Settings,
  TrendingUp,
  DollarSign,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import AdminReservedProducts from '@/components/admin/AdminReservedProducts';

interface DashboardStats {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  pendingSellers: number;
  recentOrders: number;
  totalRevenue: number;
  activeUsers: number;
}

const AdminDashboard: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalSellers: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingSellers: 0,
    recentOrders: 0,
    totalRevenue: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);

  // Check if user is admin
  if (!currentUser || userData?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 admin-content">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">You need admin access to view the dashboard.</p>
            <Button onClick={() => window.location.href = '/profile'} variant="primary" size="lg">
              Go to Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Load dashboard stats
  const loadStats = async () => {
    setLoading(true);
    try {
      // Load users
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const totalUsers = usersSnapshot.docs.length;
      const activeUsers = usersSnapshot.docs.filter(doc => doc.data().status === 'active').length;

      // Load sellers
      const sellersQuery = query(collection(db, 'users'), where('role', '==', 'shop'));
      const sellersSnapshot = await getDocs(sellersQuery);
      const totalSellers = sellersSnapshot.docs.length;
      const pendingSellers = sellersSnapshot.docs.filter(doc => doc.data().status === 'pending').length;

      // Load products
      const productsQuery = query(collection(db, 'products'));
      const productsSnapshot = await getDocs(productsQuery);
      const totalProducts = productsSnapshot.docs.length;

      // Load orders
      const ordersQuery = query(collection(db, 'orders'));
      const ordersSnapshot = await getDocs(ordersQuery);
      const totalOrders = ordersSnapshot.docs.length;
      const recentOrders = ordersSnapshot.docs.filter(doc => {
        const orderDate = doc.data().createdAt?.toDate();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return orderDate && orderDate > weekAgo;
      }).length;

      // Calculate total revenue
      let totalRevenue = 0;
      ordersSnapshot.docs.forEach(doc => {
        const orderData = doc.data();
        if (orderData.status === 'delivered' && orderData.total) {
          totalRevenue += orderData.total;
        }
      });

      setStats({
        totalUsers,
        totalSellers,
        totalProducts,
        totalOrders,
        pendingSellers,
        recentOrders,
        totalRevenue,
        activeUsers
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const adminTools = [
    {
      title: 'User Management',
      description: 'Manage user accounts and permissions',
      icon: Users,
      link: '/admin/users',
      color: 'bg-blue-500',
      stats: stats.totalUsers
    },
    {
      title: 'Seller Management',
      description: 'Approve and manage seller accounts',
      icon: Store,
      link: '/admin/sellers',
      color: 'bg-green-500',
      stats: stats.totalSellers,
      pending: stats.pendingSellers
    },
    {
      title: 'Product Management',
      description: 'Manage products and inventory',
      icon: Package,
      link: '/admin/products',
      color: 'bg-purple-500',
      stats: stats.totalProducts
    },
    {
      title: 'Category Management',
      description: 'Categories, analytics, and product migration',
      icon: Store,
      link: '/admin/categories',
      color: 'bg-indigo-500',
      stats: null
    },
    {
      title: 'Category Migration',
      description: 'Backfill subcategories and SEO fields on products',
      icon: Zap,
      link: '/admin/category-migration',
      color: 'bg-indigo-600',
      stats: null
    },
    {
      title: 'Home Page Management',
      description: 'Manage featured products, deals, and offers',
      icon: BarChart3,
      link: '/admin/homepage',
      color: 'bg-pink-500',
      stats: null
    },
    {
      title: 'Reserved Products',
      description: 'View and manage all product reservations',
      icon: Clock,
      link: '/admin/reserved-products',
      color: 'bg-orange-500',
      stats: null
    },
    {
      title: 'Order Management',
      description: 'Track and manage orders',
      icon: ShoppingBag,
      link: '/admin/orders',
      color: 'bg-orange-500',
      stats: stats.totalOrders
    },
    {
      title: 'System Settings',
      description: 'Configure platform settings',
      icon: Settings,
      link: '/admin/settings',
      color: 'bg-gray-500',
      stats: null
    },
    {
      title: 'Image Migration',
      description: 'Compress existing product images',
      icon: Zap,
      link: '/admin/image-migration',
      color: 'bg-purple-500',
      stats: null
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 admin-content">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-red-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your platform.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.totalUsers.toLocaleString()}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {stats.activeUsers} active
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sellers</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.totalSellers.toLocaleString()}</p>
                <p className="text-sm text-yellow-600 flex items-center mt-1">
                  <Clock className="w-4 h-4 mr-1" />
                  {stats.pendingSellers} pending
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.totalProducts.toLocaleString()}</p>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <Package className="w-4 h-4 mr-1" />
                  In inventory
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : `₹${stats.totalRevenue.toLocaleString()}`}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <DollarSign className="w-4 h-4 mr-1" />
                  {stats.recentOrders} orders this week
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Admin Tools */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminTools.map((tool, index) => (
              <Link href={tool.link} className="group">
                <div className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors group-hover:shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center`}>
                      <tool.icon className="w-6 h-6 text-white" />
                    </div>
                    {tool.stats !== null && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{tool.stats.toLocaleString()}</p>
                        {tool.pending !== undefined && tool.pending > 0 && (
                          <p className="text-sm text-yellow-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {tool.pending} pending
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{tool.title}</h3>
                  <p className="text-gray-600 text-sm">{tool.description}</p>
                  <div className="mt-4 flex items-center text-blue-600 group-hover:text-blue-700">
                    <Eye className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Manage</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" size="lg" onClick={() => window.location.href = '/admin/sellers'}>
              <CheckCircle className="w-5 h-5 mr-2" />
              Review Pending Sellers
            </Button>
            <Button variant="outline" size="lg" onClick={() => window.location.href = '/admin/products'}>
              <Package className="w-5 h-5 mr-2" />
              Add New Product
            </Button>
            <Button variant="outline" size="lg" onClick={() => window.location.href = '/admin/settings'}>
              <Settings className="w-5 h-5 mr-2" />
              Update Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

