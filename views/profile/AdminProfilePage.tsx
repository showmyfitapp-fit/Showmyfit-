'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield, Users, Store, BarChart3, Settings, LogOut,
  TrendingUp, Eye, Edit, Trash2, CheckCircle, XCircle,
  User, Mail, Phone, MapPin, Calendar, Award, Crown,
  ShoppingBag, Heart, Star, Package, DollarSign, Activity,
  Download, Search, HelpCircle, Filter, RefreshCw, FileText,
  Bell, Zap, Clock, TrendingDown, AlertCircle, Database,
  ChevronDown, Command, MoreVertical, PlayCircle, PauseCircle, Bike
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
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

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
import Button from '@/components/ui/Button';
import WhatsAppButton from '@/components/common/WhatsAppButton';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserData } from '@/lib/auth';
import {
  getAdminDashboardData,
  orderCreatedAt,
  orderTotal,
} from '@/lib/supabase/admin';
import { fetchDeliveryPartners, type DeliveryPartner } from '@/lib/delivery';

interface AdminProfilePageProps {
  currentUser: any;
  userData: any;
}

const AdminProfilePage: React.FC<AdminProfilePageProps> = ({ currentUser, userData }) => {
  const { signOut } = useAuth();
  const router = useRouter();
  const navigate = (path: any) => router.push(path);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    displayName: userData?.displayName || currentUser?.displayName || '',
    phone: userData?.phone || '',
    address: userData?.address || ''
  });

  // Real-time data state
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSellers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    userGrowth: 0,
    conversionRate: 0,
    avgOrderValue: 0,
    loading: true
  });

  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);

  // Chart data states
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [orderData, setOrderData] = useState<any[]>([]);
  const [productPerformance, setProductPerformance] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  // Chart colors
  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

  // Time range filter
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('7d');

  // Additional KPIs
  const [kpis, setKpis] = useState({
    repeatCustomerRate: 0,
    averageSessionDuration: 0,
    cartAbandonmentRate: 0,
    topSellingCategory: '',
    peakHour: '',
    loading: true
  });

  // New features state
  const [notificationCount, setNotificationCount] = useState(0);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [periodComparison, setPeriodComparison] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState({
    database: 'healthy',
    api: 'healthy',
    storage: 'healthy'
  });
  const [selectedApprovals, setSelectedApprovals] = useState<string[]>([]);
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([]);

  // Fetch real-time data
  const fetchRealTimeData = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));

      const {
        profiles,
        sellers,
        products,
        pendingApprovals: pendingApprovalsData,
        orders,
      } = await getAdminDashboardData();

      const totalUsers = profiles.length;
      const activeSellers = sellers.length;
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + orderTotal(order), 0);

      // Calculate user growth (last 30 days vs previous 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const recentUsers = profiles.filter((profile) => {
        const createdAt = profile.createdAt instanceof Date
          ? profile.createdAt
          : new Date(profile.createdAt);
        return createdAt >= thirtyDaysAgo;
      }).length;

      const previousUsers = profiles.filter((profile) => {
        const createdAt = profile.createdAt instanceof Date
          ? profile.createdAt
          : new Date(profile.createdAt);
        return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
      }).length;

      const userGrowth = previousUsers > 0 ? ((recentUsers - previousUsers) / previousUsers) * 100 : 0;
      const conversionRate = totalUsers > 0 ? (totalOrders / totalUsers) * 100 : 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      setStats({
        totalUsers,
        activeSellers,
        totalOrders,
        totalRevenue,
        userGrowth: Math.round(userGrowth * 10) / 10,
        conversionRate: Math.round(conversionRate * 10) / 10,
        avgOrderValue: Math.round(avgOrderValue),
        loading: false
      });

      setPendingApprovals(pendingApprovalsData);

      const recentOrders = orders.slice(0, 5).map((order) => ({
        action: 'Order completed',
        user: `Order #${String(order.id).slice(-4)}`,
        time: orderCreatedAt(order),
        status: 'completed'
      }));

      const recentUsersData = profiles.slice(0, 3).map((profile) => ({
        action: 'User registered',
        user: profile.email,
        time: profile.createdAt instanceof Date
          ? profile.createdAt
          : new Date(profile.createdAt),
        status: 'completed'
      }));

      setRecentActivity([...recentOrders, ...recentUsersData].sort((a, b) =>
        new Date(b.time).getTime() - new Date(a.time).getTime()
      ).slice(0, 5));

      const alerts = [];
      if (totalUsers > 1000) {
        alerts.push({
          alert: 'High user growth detected',
          severity: 'success',
          time: 'Just now'
        });
      }
      if (totalOrders > 100) {
        alerts.push({
          alert: 'High order volume',
          severity: 'info',
          time: '5 minutes ago'
        });
      }
      if (activeSellers < 10) {
        alerts.push({
          alert: 'Low seller count - consider marketing',
          severity: 'warning',
          time: '1 hour ago'
        });
      }
      setSystemAlerts(alerts);
      setNotificationCount(pendingApprovalsData.length + alerts.length);

      try {
        setDeliveryPartners(await fetchDeliveryPartners());
      } catch (partnerError) {
        console.error('Error fetching delivery partners:', partnerError);
      }

      calculatePeriodComparison(orders, profiles);
      await fetchChartData(orders, profiles, products);

    } catch (error) {
      console.error('Error fetching real-time data:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  // Fetch detailed chart data
  const fetchChartData = async (orders: any[], profiles: any[], products: any[]) => {
    try {
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
        const orderDate = orderCreatedAt(order);
        const key = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (Object.prototype.hasOwnProperty.call(revenueByDay, key)) {
          revenueByDay[key] += orderTotal(order);
        }
      });

      const revenueChartData = last7Days.map(day => ({
        name: day.name,
        revenue: revenueByDay[day.name] || 0
      }));
      setRevenueData(revenueChartData);

      // Sales by category
      const categorySales: { [key: string]: number } = {};

      orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const product = products.find(p => p.id === item.productId);
            if (product && product.category) {
              categorySales[product.category] = (categorySales[product.category] || 0) + (item.price || 0) * (item.quantity || 1);
            }
          });
        }
      });

      const categoryChartData = Object.entries(categorySales)
        .map(([name, value]) => ({ name, value: Math.round(value) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
      setCategoryData(categoryChartData);

      // User growth (last 30 days by week)
      const userGrowthByWeek: { [key: string]: number } = {};
      const last4Weeks = Array.from({ length: 4 }, (_, i) => {
        const key = `Week ${i + 1}`;
        userGrowthByWeek[key] = 0;
        return { name: key, users: 0 };
      });

      profiles.forEach(profile => {
        const createdAt = profile.createdAt instanceof Date
          ? profile.createdAt
          : new Date(profile.createdAt);
        if (!Number.isNaN(createdAt.getTime())) {
          const weekIndex = Math.floor((Date.now() - createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000));
          if (weekIndex >= 0 && weekIndex < 4) {
            const key = `Week ${4 - weekIndex}`;
            if (Object.prototype.hasOwnProperty.call(userGrowthByWeek, key)) {
              userGrowthByWeek[key]++;
            }
          }
        }
      });

      const userGrowthChartData = last4Weeks.map(week => ({
        name: week.name,
        users: userGrowthByWeek[week.name] || 0
      }));
      setUserGrowthData(userGrowthChartData);

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
        const orderDate = orderCreatedAt(order);
        const key = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (Object.prototype.hasOwnProperty.call(ordersByDay, key)) {
          ordersByDay[key]++;
        }
      });

      const orderChartData = orderDays.map(day => ({
        name: day.name,
        orders: ordersByDay[day.name] || 0
      }));
      setOrderData(orderChartData);

      // Product performance (top 5 products)
      const productSales: { [key: string]: { name: string; sales: number; revenue: number } } = {};

      orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
              if (!productSales[product.id]) {
                productSales[product.id] = {
                  name: product.name || 'Unknown',
                  sales: 0,
                  revenue: 0
                };
              }
              productSales[product.id].sales += item.quantity || 1;
              productSales[product.id].revenue += (item.price || 0) * (item.quantity || 1);
            }
          });
        }
      });

      const productPerformanceData = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map((p) => ({
          name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
          sales: p.sales,
          revenue: Math.round(p.revenue)
        }));
      setProductPerformance(productPerformanceData);

      // Monthly trends (last 6 months)
      const monthlyData: { [key: string]: { revenue: number; orders: number; users: number } } = {};
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyData[key] = { revenue: 0, orders: 0, users: 0 };
        return { name: key, revenue: 0, orders: 0, users: 0 };
      });

      orders.forEach(order => {
        const orderDate = orderCreatedAt(order);
        const key = orderDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (Object.prototype.hasOwnProperty.call(monthlyData, key)) {
          monthlyData[key].revenue += orderTotal(order);
          monthlyData[key].orders++;
        }
      });

      profiles.forEach(profile => {
        const createdAt = profile.createdAt instanceof Date
          ? profile.createdAt
          : new Date(profile.createdAt);
        if (!Number.isNaN(createdAt.getTime())) {
          const key = createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          if (Object.prototype.hasOwnProperty.call(monthlyData, key)) {
            monthlyData[key].users++;
          }
        }
      });

      const monthlyTrendsData = last6Months.map(month => ({
        name: month.name,
        revenue: Math.round(monthlyData[month.name]?.revenue || 0),
        orders: monthlyData[month.name]?.orders || 0,
        users: monthlyData[month.name]?.users || 0
      }));
      setMonthlyTrends(monthlyTrendsData);

      const transactions = orders.slice(0, 10).map(order => ({
        id: order.id,
        orderId: String(order.id).slice(-8).toUpperCase(),
        customer: order.userId || order.user_id || 'Unknown',
        amount: orderTotal(order),
        status: order.status || 'pending',
        date: orderCreatedAt(order),
        items: order.items?.length || 0
      }));
      setRecentTransactions(transactions);

      // Calculate additional KPIs
      const uniqueCustomers = new Set(orders.map((o: any) => o.userId || o.user_id)).size;
      const repeatCustomers = orders.length - uniqueCustomers;
      const repeatCustomerRate = orders.length > 0 ? (repeatCustomers / orders.length) * 100 : 0;

      // Top selling category
      const categoryCounts: { [key: string]: number } = {};
      orders.forEach((order: any) => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const product = products.find(p => p.id === item.productId);
            if (product && product.category) {
              categoryCounts[product.category] = (categoryCounts[product.category] || 0) + (item.quantity || 1);
            }
          });
        }
      });
      const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      // Peak hour (simplified - based on order times)
      const hourCounts: { [key: number]: number } = {};
      orders.forEach((order: any) => {
        const hour = orderCreatedAt(order).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      const peakHourFormatted = peakHour !== undefined ? `${peakHour}:00` : 'N/A';

      setKpis({
        repeatCustomerRate: Math.round(repeatCustomerRate * 10) / 10,
        averageSessionDuration: 0, // Would need session data
        cartAbandonmentRate: 0, // Would need cart data
        topSellingCategory: topCategory,
        peakHour: peakHourFormatted,
        loading: false
      });

    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  // Export to PDF functions
  const exportToPDF = (data: any[], filename: string, title: string) => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.setTextColor(239, 68, 68); // Red color
    doc.text(title, 14, 20);

    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    // Prepare table data
    const headers = Object.keys(data[0]).map(h => h.charAt(0).toUpperCase() + h.slice(1));
    const rows = data.map(row =>
      Object.keys(data[0]).map(key => {
        const value = row[key];
        if (value instanceof Date) {
          return value.toLocaleString();
        }
        return String(value || '');
      })
    );

    // Add table
    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 35,
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68], textColor: 255 },
      styles: { fontSize: 9 },
      margin: { top: 35 }
    });

    // Save PDF
    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportReport = () => {
    const doc = new jsPDF();
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const maxWidth = pageWidth - (margin * 2);

    // Header
    doc.setFillColor(239, 68, 68); // Red
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Admin Dashboard Report', margin, 25);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 35);

    yPos = 50;
    doc.setTextColor(0, 0, 0);

    // Executive Summary
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', margin, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const summaryStats = [
      ['Total Users', stats.totalUsers.toLocaleString()],
      ['Active Sellers', stats.activeSellers.toLocaleString()],
      ['Total Orders', stats.totalOrders.toLocaleString()],
      ['Total Revenue', `₹${stats.totalRevenue.toLocaleString()}`],
      ['User Growth', `${stats.userGrowth >= 0 ? '+' : ''}${stats.userGrowth}%`],
      ['Conversion Rate', `${stats.conversionRate}%`],
      ['Avg Order Value', `₹${stats.avgOrderValue.toLocaleString()}`]
    ];

    summaryStats.forEach(([label, value]) => {
      doc.text(`${label}:`, margin, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(value, margin + 80, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 7;
    });

    yPos += 5;

    // Performance Metrics
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance Metrics', margin, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const metrics = [
      ['Repeat Customer Rate', `${kpis.repeatCustomerRate}%`],
      ['Top Selling Category', kpis.topSellingCategory],
      ['Peak Hour', kpis.peakHour]
    ];

    metrics.forEach(([label, value]) => {
      doc.text(`${label}:`, margin, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(value, margin + 80, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 7;
    });

    yPos += 10;

    // Recent Transactions Table
    if (recentTransactions.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Recent Transactions', margin, yPos);
      yPos += 10;

      const transactionHeaders = [['Order ID', 'Customer', 'Amount', 'Items', 'Status', 'Date']];
      const transactionRows = recentTransactions.slice(0, 20).map(t => [
        t.orderId,
        t.customer.slice(0, 15) + '...',
        `₹${t.amount.toLocaleString()}`,
        t.items.toString(),
        t.status,
        t.date.toLocaleDateString()
      ]);

      (doc as any).autoTable({
        head: transactionHeaders,
        body: transactionRows,
        startY: yPos,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68], textColor: 255 },
        styles: { fontSize: 8 },
        margin: { top: yPos },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30 },
          3: { cellWidth: 20 },
          4: { cellWidth: 25 },
          5: { cellWidth: 35 }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Category Sales
    if (categoryData.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Sales by Category', margin, yPos);
      yPos += 10;

      const categoryHeaders = [['Category', 'Revenue (₹)']];
      const categoryRows = categoryData.map(c => [c.name, c.value.toLocaleString()]);

      (doc as any).autoTable({
        head: categoryHeaders,
        body: categoryRows,
        startY: yPos,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68], textColor: 255 },
        styles: { fontSize: 10 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Top Products
    if (productPerformance.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Top Products by Revenue', margin, yPos);
      yPos += 10;

      const productHeaders = [['Product', 'Sales', 'Revenue (₹)']];
      const productRows = productPerformance.map(p => [
        p.name,
        p.sales.toString(),
        p.revenue.toLocaleString()
      ]);

      (doc as any).autoTable({
        head: productHeaders,
        body: productRows,
        startY: yPos,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68], textColor: 255 },
        styles: { fontSize: 10 }
      });
    }

    // Footer on last page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Page ${i} of ${pageCount} | ShowMyFit Admin Dashboard`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    doc.save(`admin_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Calculate period comparison (this week vs last week)
  const calculatePeriodComparison = (orders: any[], profiles: any[]) => {
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const thisWeekOrders = orders.filter((o: any) => {
      return orderCreatedAt(o) >= thisWeekStart;
    });

    const lastWeekOrders = orders.filter((o: any) => {
      const orderDate = orderCreatedAt(o);
      return orderDate >= lastWeekStart && orderDate < thisWeekStart;
    });

    const thisWeekRevenue = thisWeekOrders.reduce((sum: number, o: any) => sum + orderTotal(o), 0);
    const lastWeekRevenue = lastWeekOrders.reduce((sum: number, o: any) => sum + orderTotal(o), 0);
    const revenueChange = lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0;

    const thisWeekUsers = profiles.filter(profile => {
      const createdAt = profile.createdAt instanceof Date
        ? profile.createdAt
        : new Date(profile.createdAt);
      return createdAt >= thisWeekStart;
    }).length;

    const lastWeekUsers = profiles.filter(profile => {
      const createdAt = profile.createdAt instanceof Date
        ? profile.createdAt
        : new Date(profile.createdAt);
      return createdAt >= lastWeekStart && createdAt < thisWeekStart;
    }).length;

    const userChange = lastWeekUsers > 0 ? ((thisWeekUsers - lastWeekUsers) / lastWeekUsers) * 100 : 0;

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
      },
      users: {
        thisWeek: thisWeekUsers,
        lastWeek: lastWeekUsers,
        change: userChange
      }
    });
  };

  // Bulk approve/reject functions
  const handleBulkApprove = async () => {
    if (selectedApprovals.length === 0) {
      alert('Please select approvals to approve');
      return;
    }
    // Implementation would update Firestore
    alert(`Approved ${selectedApprovals.length} items`);
    setSelectedApprovals([]);
    fetchRealTimeData();
  };

  const handleBulkReject = async () => {
    if (selectedApprovals.length === 0) {
      alert('Please select approvals to reject');
      return;
    }
    // Implementation would update Firestore
    alert(`Rejected ${selectedApprovals.length} items`);
    setSelectedApprovals([]);
    fetchRealTimeData();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('input[type="text"]')?.focus();
      }
      // Ctrl/Cmd + E for export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportReport();
      }
      // Ctrl/Cmd + R for refresh
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        fetchRealTimeData();
      }
      // ? for shortcuts help
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        setShowShortcuts(true);
      }
      // Escape to close modals
      if (e.key === 'Escape') {
        setShowQuickActions(false);
        setShowShortcuts(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchRealTimeData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchRealTimeData, 30000);
    return () => clearInterval(interval);
  }, []);

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
      address: userData?.address || ''
    });
  };

  const handleSave = async () => {
    try {
      if (currentUser?.uid) {
        await updateUserData(currentUser.uid, {
          displayName: editData.displayName,
          phone: editData.phone,
          address: editData.address,
        });

        if (userData) {
          userData.displayName = editData.displayName;
          userData.phone = editData.phone;
          userData.address = editData.address;
        }

        setIsEditing(false);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      displayName: userData?.displayName || currentUser?.displayName || '',
      phone: userData?.phone || '',
      address: userData?.address || ''
    });
  };

  // Handle authentication redirect
  useEffect(() => {
    if (!currentUser) {
      router.push('/auth');
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    // Show loading while redirecting
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 admin-content">
      <div className="main-content pt-4">
        <div className="min-h-screen px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Admin Header */}
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-2xl shadow-xl p-8 mb-8 overflow-visible">
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                {/* Admin Badge */}
                <div className="relative">
                  <div className="w-24 h-24 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-white/30">
                    {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : currentUser.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Crown className="w-5 h-5 text-red-600" />
                  </div>
                </div>

                {/* Admin Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start mb-2">
                    <Shield className="w-6 h-6 mr-2" />
                    <h1 className="text-3xl font-bold">
                      {currentUser.displayName || 'Admin'}
                    </h1>
                  </div>
                  <p className="text-red-100 text-lg mb-2">{currentUser.email}</p>
                  <div className="flex items-center justify-center md:justify-start space-x-4 text-sm text-red-100">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>
                        Admin since{' '}
                        {new Date(
                          userData?.createdAt ||
                            currentUser?.created_at ||
                            currentUser?.metadata?.creationTime ||
                            Date.now()
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Award className="w-4 h-4 mr-1" />
                      <span>Super Admin</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {/* Notification Bell */}
                  <div className="relative">
                    <button
                      className="px-4 py-2 bg-white/20 backdrop-blur-lg text-white rounded-lg hover:bg-white/30 transition-colors flex items-center relative"
                      title="Notifications"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Notifications
                      {notificationCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {notificationCount > 9 ? '9+' : notificationCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Quick Actions Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowQuickActions(!showQuickActions)}
                      className="px-4 py-2 bg-white/20 backdrop-blur-lg text-white rounded-lg hover:bg-white/30 transition-colors flex items-center"
                      title="Quick Actions"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Quick Actions
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </button>
                    {showQuickActions && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-50 border border-gray-200 text-gray-900">
                        <div className="py-2">
                          <button
                            onClick={() => { router.push('/admin/users'); setShowQuickActions(false); }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-gray-800 text-sm font-medium"
                          >
                            <Users className="w-4 h-4 mr-2 text-blue-600 shrink-0" />
                            Manage Users
                          </button>
                          <button
                            onClick={() => { router.push('/admin/sellers'); setShowQuickActions(false); }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-gray-800 text-sm font-medium"
                          >
                            <Store className="w-4 h-4 mr-2 text-green-600 shrink-0" />
                            Manage Sellers
                          </button>
                          <button
                            onClick={() => { router.push('/admin/products'); setShowQuickActions(false); }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-gray-800 text-sm font-medium"
                          >
                            <Package className="w-4 h-4 mr-2 text-purple-600 shrink-0" />
                            Manage Products
                          </button>
                          <button
                            onClick={() => { router.push('/delivery'); setShowQuickActions(false); }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-gray-800 text-sm font-medium"
                          >
                            <Bike className="w-4 h-4 mr-2 text-orange-600 shrink-0" />
                            Delivery jobs
                          </button>
                          <div className="border-t my-1"></div>
                          <button
                            onClick={() => { exportReport(); setShowQuickActions(false); }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-gray-800 text-sm font-medium"
                          >
                            <Download className="w-4 h-4 mr-2 text-orange-600 shrink-0" />
                            Export Report
                          </button>
                          <button
                            onClick={() => { setShowShortcuts(true); setShowQuickActions(false); }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-gray-800 text-sm font-medium"
                          >
                            <Command className="w-4 h-4 mr-2 text-gray-600 shrink-0" />
                            Keyboard Shortcuts
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={exportReport}
                    className="px-4 py-2 bg-white/20 backdrop-blur-lg text-white rounded-lg hover:bg-white/30 transition-colors flex items-center"
                    title="Export Report (Ctrl+E)"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </button>
                  <button
                    onClick={fetchRealTimeData}
                    className="px-4 py-2 bg-white/20 backdrop-blur-lg text-white rounded-lg hover:bg-white/30 transition-colors flex items-center"
                    title="Refresh Data (Ctrl+R)"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </button>
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-white/20 backdrop-blur-lg text-white rounded-lg hover:bg-white/30 transition-colors flex items-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 bg-white/20 backdrop-blur-lg text-white rounded-lg hover:bg-white/30 transition-colors flex items-center"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Search Bar */}
            <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search users, orders, products..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-3 space-y-6">
                {/* Admin Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow">
                    <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    {stats.loading ? (
                      <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                      </div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Total Users</div>
                        <div className={`text-xs mt-1 ${stats.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stats.userGrowth >= 0 ? '+' : ''}{stats.userGrowth}% this month
                        </div>
                      </>
                    )}
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow">
                    <Store className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    {stats.loading ? (
                      <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                      </div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-gray-900">{stats.activeSellers}</div>
                        <div className="text-sm text-gray-600">Active Sellers</div>
                        <div className="text-xs text-green-600 mt-1">Live count</div>
                      </>
                    )}
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow">
                    <ShoppingBag className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    {stats.loading ? (
                      <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                      </div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-gray-900">{stats.totalOrders.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Total Orders</div>
                        <div className="text-xs text-green-600 mt-1">All time</div>
                      </>
                    )}
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow">
                    <DollarSign className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    {stats.loading ? (
                      <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                      </div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-gray-900">
                          ₹{stats.totalRevenue >= 1000000
                            ? `${(stats.totalRevenue / 1000000).toFixed(1)}M`
                            : stats.totalRevenue >= 1000
                              ? `${(stats.totalRevenue / 1000).toFixed(1)}K`
                              : stats.totalRevenue.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Revenue</div>
                        <div className="text-xs text-green-600 mt-1">All time</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Advanced Analytics */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <BarChart3 className="w-6 h-6 mr-2 text-red-600" />
                    Advanced Analytics
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-blue-900">User Growth</h3>
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                      </div>
                      {stats.loading ? (
                        <div className="animate-pulse">
                          <div className="h-8 bg-gray-200 rounded mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                        </div>
                      ) : (
                        <>
                          <div className={`text-2xl font-bold ${stats.userGrowth >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                            {stats.userGrowth >= 0 ? '+' : ''}{stats.userGrowth}%
                          </div>
                          <div className="text-sm text-blue-700">vs last month</div>
                        </>
                      )}
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-green-900">Conversion Rate</h3>
                        <Eye className="w-5 h-5 text-green-600" />
                      </div>
                      {stats.loading ? (
                        <div className="animate-pulse">
                          <div className="h-8 bg-gray-200 rounded mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                        </div>
                      ) : (
                        <>
                          <div className="text-2xl font-bold text-green-900">{stats.conversionRate}%</div>
                          <div className="text-sm text-green-700">visitor to customer</div>
                        </>
                      )}
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-purple-900">Avg Order Value</h3>
                        <Package className="w-5 h-5 text-purple-600" />
                      </div>
                      {stats.loading ? (
                        <div className="animate-pulse">
                          <div className="h-8 bg-gray-200 rounded mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                        </div>
                      ) : (
                        <>
                          <div className="text-2xl font-bold text-purple-900">₹{stats.avgOrderValue.toLocaleString()}</div>
                          <div className="text-sm text-purple-700">per transaction</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Period Comparison */}
                {periodComparison && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <TrendingUp className="w-6 h-6 mr-2 text-green-600" />
                      This Week vs Last Week
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-purple-700">New Users</div>
                          {periodComparison.users.change >= 0 ? (
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div className="text-2xl font-bold text-purple-900">
                          {periodComparison.users.thisWeek}
                        </div>
                        <div className={`text-sm mt-1 ${periodComparison.users.change >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
                          {periodComparison.users.change >= 0 ? '+' : ''}{periodComparison.users.change.toFixed(1)}% vs last week
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* System Health */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Database className="w-6 h-6 mr-2 text-blue-600" />
                    System Health
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(systemHealth).map(([service, status]) => (
                      <div key={service} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${status === 'healthy' ? 'bg-green-500' :
                            status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                          <span className="font-medium text-gray-900 capitalize">{service}</span>
                        </div>
                        <span className={`text-sm font-medium ${status === 'healthy' ? 'text-green-600' :
                          status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                          {status === 'healthy' ? 'Operational' : status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional KPIs */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Activity className="w-6 h-6 mr-2 text-indigo-600" />
                    Performance Metrics
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4">
                      <div className="text-sm text-indigo-700 mb-1">Repeat Customer Rate</div>
                      <div className="text-2xl font-bold text-indigo-900">
                        {kpis.loading ? '...' : `${kpis.repeatCustomerRate}%`}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4">
                      <div className="text-sm text-cyan-700 mb-1">Top Category</div>
                      <div className="text-lg font-bold text-cyan-900 truncate">
                        {kpis.loading ? '...' : kpis.topSellingCategory}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-4">
                      <div className="text-sm text-rose-700 mb-1">Peak Hour</div>
                      <div className="text-2xl font-bold text-rose-900">
                        {kpis.loading ? '...' : kpis.peakHour}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4">
                      <div className="text-sm text-emerald-700 mb-1">Avg Order Value</div>
                      <div className="text-2xl font-bold text-emerald-900">
                        ₹{stats.avgOrderValue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Charts & Analytics */}
                <div className="space-y-6">
                  {/* Time Range Filter */}
                  <div className="bg-white rounded-2xl shadow-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Filter className="w-5 h-5 mr-2 text-red-600" />
                        Chart Time Range
                      </h3>
                      <div className="flex gap-2">
                        {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                          <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === range
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                          >
                            {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Revenue Trends Chart */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                        <TrendingUp className="w-6 h-6 mr-2 text-red-600" />
                        Revenue Trends ({timeRange === '7d' ? 'Last 7 Days' : timeRange === '30d' ? 'Last 30 Days' : timeRange === '90d' ? 'Last 90 Days' : 'All Time'})
                      </h2>
                      <button
                        onClick={() => exportToPDF(revenueData, 'revenue_trends', 'Revenue Trends Report')}
                        className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Export PDF
                      </button>
                    </div>
                    {stats.loading || revenueData.length === 0 ? (
                      <div className="h-64 flex items-center justify-center">
                        <div className="animate-pulse text-gray-400">Loading chart data...</div>
                      </div>
                    ) : (
                      <div className="h-64">
                        <Line
                          data={{
                            labels: revenueData.map(d => d.name),
                            datasets: [{
                              label: 'Revenue (₹)',
                              data: revenueData.map(d => d.revenue),
                              borderColor: 'rgb(239, 68, 68)',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              fill: true,
                              tension: 0.4,
                              pointRadius: 5,
                              pointHoverRadius: 7
                            }]
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
                                    return `₹${context.parsed.y.toLocaleString()}`;
                                  }
                                }
                              }
                            },
                            scales: {
                              y: {
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

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sales by Category */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <Package className="w-6 h-6 mr-2 text-green-600" />
                        Sales by Category
                      </h2>
                      {stats.loading || categoryData.length === 0 ? (
                        <div className="h-64 flex items-center justify-center">
                          <div className="animate-pulse text-gray-400">Loading chart data...</div>
                        </div>
                      ) : (
                        <div className="h-64">
                          <Pie
                            data={{
                              labels: categoryData.map(d => d.name),
                              datasets: [{
                                data: categoryData.map(d => d.value),
                                backgroundColor: [
                                  'rgba(239, 68, 68, 0.8)',
                                  'rgba(59, 130, 246, 0.8)',
                                  'rgba(16, 185, 129, 0.8)',
                                  'rgba(251, 191, 36, 0.8)',
                                  'rgba(139, 92, 246, 0.8)',
                                  'rgba(236, 72, 153, 0.8)'
                                ],
                                borderColor: [
                                  'rgb(239, 68, 68)',
                                  'rgb(59, 130, 246)',
                                  'rgb(16, 185, 129)',
                                  'rgb(251, 191, 36)',
                                  'rgb(139, 92, 246)',
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

                    {/* User Growth Chart */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <Users className="w-6 h-6 mr-2 text-blue-600" />
                        User Growth (Last 4 Weeks)
                      </h2>
                    </div>

                    {/* Order Statistics */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <ShoppingBag className="w-6 h-6 mr-2 text-purple-600" />
                        Daily Orders (Last 7 Days)
                      </h2>
                      {stats.loading || orderData.length === 0 ? (
                        <div className="h-64 flex items-center justify-center">
                          <div className="animate-pulse text-gray-400">Loading chart data...</div>
                        </div>
                      ) : (
                        <div className="h-64">
                          <Bar
                            data={{
                              labels: orderData.map(d => d.name),
                              datasets: [{
                                label: 'Orders',
                                data: orderData.map(d => d.orders),
                                backgroundColor: 'rgba(139, 92, 246, 0.8)',
                                borderColor: 'rgb(139, 92, 246)',
                                borderWidth: 1,
                                borderRadius: 8
                              }]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  display: true,
                                  position: 'top' as const,
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
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <Star className="w-6 h-6 mr-2 text-yellow-600" />
                        Top Products by Revenue
                      </h2>
                      {stats.loading || productPerformance.length === 0 ? (
                        <div className="h-64 flex items-center justify-center">
                          <div className="animate-pulse text-gray-400">Loading chart data...</div>
                        </div>
                      ) : (
                        <div className="h-64">
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
                                  display: true,
                                  position: 'top' as const,
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function (context) {
                                      return `₹${context.parsed.x.toLocaleString()}`;
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
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <BarChart3 className="w-6 h-6 mr-2 text-orange-600" />
                      Monthly Trends (Last 6 Months)
                    </h2>
                    {stats.loading || monthlyTrends.length === 0 ? (
                      <div className="h-64 flex items-center justify-center">
                        <div className="animate-pulse text-gray-400">Loading chart data...</div>
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
                                backgroundColor: 'rgba(249, 115, 22, 0.8)',
                                borderColor: 'rgb(249, 115, 22)',
                                borderWidth: 1,
                                borderRadius: 8,
                                yAxisID: 'y'
                              },
                              {
                                label: 'Orders',
                                data: monthlyTrends.map(d => d.orders),
                                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                                borderColor: 'rgb(59, 130, 246)',
                                borderWidth: 1,
                                borderRadius: 8,
                                yAxisID: 'y1'
                              },
                              {
                                label: 'New Users',
                                data: monthlyTrends.map(d => d.users),
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
                                    const value = context.parsed.y;
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
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Activity className="w-6 h-6 mr-2 text-red-600" />
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/admin/users" className="group">
                      <div className="bg-blue-50 rounded-xl p-4 text-center group-hover:bg-blue-100 transition-colors">
                        <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <div className="font-semibold text-gray-900">User Management</div>
                        <div className="text-sm text-gray-600">Manage Users</div>
                      </div>
                    </Link>
                    <Link href="/admin/sellers" className="group">
                      <div className="bg-green-50 rounded-xl p-4 text-center group-hover:bg-green-100 transition-colors">
                        <Store className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <div className="font-semibold text-gray-900">Seller Management</div>
                        <div className="text-sm text-gray-600">Manage Sellers</div>
                      </div>
                    </Link>
                    <Link href="/admin/orders" className="group">
                      <div className="bg-purple-50 rounded-xl p-4 text-center group-hover:bg-purple-100 transition-colors">
                        <ShoppingBag className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <div className="font-semibold text-gray-900">Order Management</div>
                        <div className="text-sm text-gray-600">Track Orders</div>
                      </div>
                    </Link>
                    <Link href="/admin/products" className="group">
                      <div className="bg-orange-50 rounded-xl p-4 text-center group-hover:bg-orange-100 transition-colors">
                        <Package className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                        <div className="font-semibold text-gray-900">Product Management</div>
                        <div className="text-sm text-gray-600">Manage Products</div>
                      </div>
                    </Link>
                    <Link href="/delivery" className="group">
                      <div className="bg-orange-50 rounded-xl p-4 text-center group-hover:bg-orange-100 transition-colors">
                        <Bike className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                        <div className="font-semibold text-gray-900">Delivery Jobs</div>
                        <div className="text-sm text-gray-600">Riders & pickups</div>
                      </div>
                    </Link>
                    <Link href="/admin/settings" className="group">
                      <div className="bg-gray-50 rounded-xl p-4 text-center group-hover:bg-gray-100 transition-colors">
                        <Settings className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <div className="font-semibold text-gray-900">Settings</div>
                        <div className="text-sm text-gray-600">Platform Settings</div>
                      </div>
                    </Link>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <Bike className="w-6 h-6 mr-2 text-orange-600" />
                      Delivery partners
                    </h2>
                    <span className="text-sm font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full">
                      {deliveryPartners.filter((partner) => partner.isOnline).length} online
                    </span>
                  </div>
                  {deliveryPartners.length === 0 ? (
                    <p className="text-sm text-gray-500">No delivery partners yet. Enable riders from the delivery page.</p>
                  ) : (
                    <div className="space-y-3">
                      {deliveryPartners.map((partner) => (
                        <div
                          key={partner.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{partner.name}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {partner.phone || 'No phone'}
                              {partner.lastOnlineAt
                                ? ` · last seen ${partner.lastOnlineAt.toLocaleString()}`
                                : ''}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${
                              partner.isOnline
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {partner.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pending Approvals */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <CheckCircle className="w-6 h-6 mr-2 text-yellow-600" />
                      Pending Approvals ({pendingApprovals.length})
                    </h2>
                    {pendingApprovals.length > 0 && selectedApprovals.length > 0 && (
                      <div className="flex gap-2">
                        <button
                          onClick={handleBulkApprove}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve Selected ({selectedApprovals.length})
                        </button>
                        <button
                          onClick={handleBulkReject}
                          className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject Selected ({selectedApprovals.length})
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    {pendingApprovals.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <p>No pending approvals</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-4">
                          <input
                            type="checkbox"
                            id="select-all-approvals"
                            checked={selectedApprovals.length === pendingApprovals.length && pendingApprovals.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedApprovals(pendingApprovals.map((_, i) => i.toString()));
                              } else {
                                setSelectedApprovals([]);
                              }
                            }}
                            className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                            aria-label="Select all pending approvals"
                          />
                          <label htmlFor="select-all-approvals" className="text-sm text-gray-600 cursor-pointer">Select All</label>
                        </div>
                        {pendingApprovals.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <label htmlFor={`approval-${index}`} className="cursor-pointer">
                                <input
                                  type="checkbox"
                                  id={`approval-${index}`}
                                  checked={selectedApprovals.includes(index.toString())}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedApprovals([...selectedApprovals, index.toString()]);
                                    } else {
                                      setSelectedApprovals(selectedApprovals.filter(id => id !== index.toString()));
                                    }
                                  }}
                                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                                  aria-label={`Select approval for ${item.name}`}
                                />
                              </label>
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              <div>
                                <div className="font-medium text-gray-900">{item.type}</div>
                                <div className="text-sm text-gray-600">{item.name} - {item.email}</div>
                                <div className="text-xs text-gray-500">
                                  Submitted {item.submitted ? new Date(item.submitted).toLocaleDateString() : 'Unknown date'}
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                                Approve
                              </button>
                              <button className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors">
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* System Alerts */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <XCircle className="w-6 h-6 mr-2 text-red-600" />
                    System Alerts ({systemAlerts.length})
                  </h2>
                  <div className="space-y-4">
                    {systemAlerts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <p>No system alerts</p>
                      </div>
                    ) : (
                      systemAlerts.map((alert, index) => (
                        <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${alert.severity === 'error' ? 'bg-red-50 border border-red-200' :
                          alert.severity === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                            alert.severity === 'success' ? 'bg-green-50 border border-green-200' :
                              'bg-blue-50 border border-blue-200'
                          }`}>
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${alert.severity === 'error' ? 'bg-red-500' :
                              alert.severity === 'warning' ? 'bg-yellow-500' :
                                alert.severity === 'success' ? 'bg-green-500' :
                                  'bg-blue-500'
                              }`}></div>
                            <div>
                              <div className="font-medium text-gray-900">{alert.alert}</div>
                              <div className="text-sm text-gray-600">{alert.time}</div>
                            </div>
                          </div>
                          <button className="text-gray-400 hover:text-gray-600" aria-label="Dismiss alert">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Transactions Table */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <FileText className="w-6 h-6 mr-2 text-purple-600" />
                      Recent Transactions
                    </h2>
                    <button
                      onClick={() => exportToPDF(recentTransactions, 'transactions', 'Transactions Report')}
                      className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Order ID</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Customer</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Items</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-gray-500">
                              No transactions found
                            </td>
                          </tr>
                        ) : (
                          recentTransactions.map((transaction) => (
                            <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm font-mono text-gray-900">{transaction.orderId}</td>
                              <td className="py-3 px-4 text-sm text-gray-700">{transaction.customer.slice(0, 20)}...</td>
                              <td className="py-3 px-4 text-sm font-semibold text-gray-900">₹{transaction.amount.toLocaleString()}</td>
                              <td className="py-3 px-4 text-sm text-gray-700">{transaction.items}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                  {transaction.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {transaction.date.toLocaleDateString()} {transaction.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity ({recentActivity.length})</h2>
                  <div className="space-y-4">
                    {recentActivity.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p>No recent activity</p>
                      </div>
                    ) : (
                      recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${activity.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                              }`}></div>
                            <div>
                              <div className="font-medium text-gray-900">{activity.action}</div>
                              <div className="text-sm text-gray-600">{activity.user}</div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {activity.time ? new Date(activity.time).toLocaleString() : 'Unknown time'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                          id="displayName"
                          type="text"
                          value={editData.displayName}
                          onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          id="phone"
                          type="tel"
                          value={editData.phone}
                          onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                        <textarea
                          id="address"
                          value={editData.address}
                          onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={handleSave} variant="primary" size="sm">
                          Save
                        </Button>
                        <Button onClick={handleCancel} variant="outline" size="sm">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Full Name</p>
                          <p className="font-medium text-gray-900">{currentUser.displayName || 'Not set'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium text-gray-900">{currentUser.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium text-gray-900">{userData?.phone || 'Not set'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="font-medium text-gray-900">{userData?.address || 'Not set'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Admin Tools */}
                <div className="bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl p-6 text-white">
                  <h3 className="text-lg font-semibold mb-4">Admin Tools</h3>
                  <div className="space-y-3">
                    <Link href="/admin" className="block">
                      <button className="w-full text-left p-3 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                        <BarChart3 className="w-5 h-5 mr-3 inline" />
                        Admin Dashboard
                      </button>
                    </Link>
                    <Link href="/admin/users" className="block">
                      <button className="w-full text-left p-3 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                        <Users className="w-5 h-5 mr-3 inline" />
                        User Management
                      </button>
                    </Link>
                    <Link href="/admin/sellers" className="block">
                      <button className="w-full text-left p-3 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                        <Store className="w-5 h-5 mr-3 inline" />
                        Seller Management
                      </button>
                    </Link>
                    <Link href="/admin/products" className="block">
                      <button className="w-full text-left p-3 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                        <Package className="w-5 h-5 mr-3 inline" />
                        Product Management
                      </button>
                    </Link>
                    <Link href="/admin/settings" className="block">
                      <button className="w-full text-left p-3 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                        <Settings className="w-5 h-5 mr-3 inline" />
                        System Settings
                      </button>
                    </Link>
                  </div>
                </div>

                {/* Help & Support */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <HelpCircle className="w-5 h-5 mr-2 text-blue-600" />
                    Help & Support
                  </h3>
                  <div className="space-y-3">
                    <a
                      href="#"
                      className="block p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">Documentation</div>
                      <div className="text-sm text-gray-600">View admin guides</div>
                    </a>
                    <a
                      href="#"
                      className="block p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">API Reference</div>
                      <div className="text-sm text-gray-600">Developer documentation</div>
                    </a>
                    <a
                      href="#"
                      className="block p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">Contact Support</div>
                      <div className="text-sm text-gray-600">Get help from our team</div>
                    </a>
                    <a
                      href="#"
                      className="block p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">Feature Requests</div>
                      <div className="text-sm text-gray-600">Suggest new features</div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <Command className="w-6 h-6 mr-2 text-red-600" />
                Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close keyboard shortcuts"
                title="Close"
              >
                <span className="sr-only">Close</span>
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Search</div>
                    <div className="text-sm text-gray-600">Focus search bar</div>
                  </div>
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">Ctrl+K</kbd>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Export Report</div>
                    <div className="text-sm text-gray-600">Download PDF report</div>
                  </div>
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">Ctrl+E</kbd>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Refresh Data</div>
                    <div className="text-sm text-gray-600">Reload dashboard</div>
                  </div>
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">Ctrl+R</kbd>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Show Shortcuts</div>
                    <div className="text-sm text-gray-600">Open this menu</div>
                  </div>
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">?</kbd>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Close Modal</div>
                    <div className="text-sm text-gray-600">Close any open modal</div>
                  </div>
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">Esc</kbd>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Quick Actions</div>
                    <div className="text-sm text-gray-600">Open quick actions menu</div>
                  </div>
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">Click</kbd>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                Press <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Esc</kbd> to close
              </p>
            </div>
          </div>
        </div>
      )}
      {/* WhatsApp Floating Button - Appears on admin profile page */}
      <WhatsAppButton
        phoneNumber="918281474541"
        message="Hello, I need help with ShowMyFit"
      />
    </div>
  );
};

export default AdminProfilePage;
