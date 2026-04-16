import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Package, Users, 
  Eye, ShoppingCart, Star, BarChart3, PieChart, 
  Calendar, Filter, Download, RefreshCw, ArrowUpRight,
  ArrowDownRight, Activity, Target, Award, Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  status: 'active' | 'inactive' | 'draft';
  stock: number;
  rating: number;
  reviews: number;
  views: number;
  sales: number;
  createdAt: any;
  updatedAt: any;
}

interface Order {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: any;
  customerName: string;
  customerEmail: string;
  sellerId: string;
}

interface ReservedProduct {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  total: number;
  status: 'reserved' | 'confirmed' | 'cancelled';
  createdAt: any;
  customerName: string;
  customerEmail: string;
  sellerId: string;
}

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  activeProducts: number;
  averageOrderValue: number;
  conversionRate: number;
  totalViews: number;
  averageRating: number;
  revenueGrowth: number;
  orderGrowth: number;
  productGrowth: number;
  viewGrowth: number;
}

const SellerDashboard: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservedProducts, setReservedProducts] = useState<ReservedProduct[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    activeProducts: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    totalViews: 0,
    averageRating: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
    productGrowth: 0,
    viewGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load seller data
  useEffect(() => {
    const loadSellerData = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        console.log('🔄 Loading seller data for:', currentUser.uid);
        
        // Load products
        const productsQuery = query(
          collection(db, 'products'),
          where('sellerId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];

        console.log('📦 Loaded products:', productsData.length);

        // Load orders from orders collection
        const ordersQuery = query(
          collection(db, 'orders'),
          where('sellerId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];

        console.log('🛒 Loaded orders:', ordersData.length);

        // Load reserved products
        const reservedQuery = query(
          collection(db, 'reservedProducts'),
          where('sellerId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const reservedSnapshot = await getDocs(reservedQuery);
        const reservedData = reservedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ReservedProduct[];

        console.log('📋 Loaded reserved products:', reservedData.length);

        setProducts(productsData);
        setOrders(ordersData);
        setReservedProducts(reservedData);

        // Calculate time range for growth comparison
        const now = new Date();
        const timeRangeDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const previousPeriodStart = new Date(now.getTime() - (timeRangeDays * 2 * 24 * 60 * 60 * 1000));
        const currentPeriodStart = new Date(now.getTime() - (timeRangeDays * 24 * 60 * 60 * 1000));

        // Filter data by time range
        const currentOrders = ordersData.filter(order => {
          const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
          return orderDate >= currentPeriodStart;
        });

        const previousOrders = ordersData.filter(order => {
          const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
          return orderDate >= previousPeriodStart && orderDate < currentPeriodStart;
        });

        // Calculate current period stats
        const totalRevenue = currentOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const totalOrders = currentOrders.length;
        const totalProducts = productsData.length;
        const activeProducts = productsData.filter(p => p.status === 'active').length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const totalViews = productsData.reduce((sum, product) => sum + (product.views || 0), 0);
        const averageRating = productsData.length > 0 
          ? productsData.reduce((sum, product) => sum + (product.rating || 0), 0) / productsData.length 
          : 0;
        
        // Calculate conversion rate from reserved products
        const totalReserved = reservedData.filter(r => r.status === 'reserved' || r.status === 'confirmed').length;
        const conversionRate = totalViews > 0 ? (totalReserved / totalViews) * 100 : 0;

        // Calculate growth percentages
        const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
        
        const previousOrderCount = previousOrders.length;
        const orderGrowth = previousOrderCount > 0 ? ((totalOrders - previousOrderCount) / previousOrderCount) * 100 : 0;

        // Mock product and view growth for now (you can implement these with historical data)
        const productGrowth = 0; // Could be calculated with historical product data
        const viewGrowth = 0; // Could be calculated with historical view data

        console.log('📊 Calculated stats:', {
          totalRevenue,
          totalOrders,
          totalProducts,
          activeProducts,
          averageOrderValue,
          conversionRate,
          totalViews,
          averageRating,
          revenueGrowth,
          orderGrowth
        });

        setStats({
          totalRevenue,
          totalOrders,
          totalProducts,
          activeProducts,
          averageOrderValue,
          conversionRate,
          totalViews,
          averageRating,
          revenueGrowth,
          orderGrowth,
          productGrowth,
          viewGrowth
        });

        setLastRefresh(new Date());

      } catch (error) {
        console.error('❌ Error loading seller data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSellerData();
  }, [currentUser, timeRange]);

  // Refresh data function
  const refreshData = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Reload all data
      const productsQuery = query(
        collection(db, 'products'),
        where('sellerId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      const ordersQuery = query(
        collection(db, 'orders'),
        where('sellerId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];

      const reservedQuery = query(
        collection(db, 'reservedProducts'),
        where('sellerId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const reservedSnapshot = await getDocs(reservedQuery);
      const reservedData = reservedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ReservedProduct[];

      setProducts(productsData);
      setOrders(ordersData);
      setReservedProducts(reservedData);
      setLastRefresh(new Date());

      console.log('✅ Data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    growth, 
    trend 
  }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    growth?: number;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {growth !== undefined && (
            <div className="flex items-center mt-2">
              {trend === 'up' ? (
                <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
              ) : trend === 'down' ? (
                <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
              ) : null}
              <span className={`text-sm font-medium ${
                trend === 'up' ? 'text-green-600' : 
                trend === 'down' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {growth > 0 ? '+' : ''}{growth}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const CategoryChart = () => {
    const categoryData = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500', 'bg-indigo-500'];
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Products by Category</h3>
        <div className="space-y-3">
          {Object.entries(categoryData).map(([category, count], index) => (
            <div key={category} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]} mr-3`}></div>
                <span className="text-sm font-medium text-gray-700 capitalize">{category}</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const RecentOrders = () => {
    // Combine orders and reserved products for recent activity
    const recentActivity = [
      ...orders.map(order => ({
        id: order.id,
        type: 'order',
        productName: order.productName,
        customerName: order.customerName,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt
      })),
      ...reservedProducts.map(reserved => ({
        id: reserved.id,
        type: 'reserved',
        productName: reserved.productName,
        customerName: reserved.customerName,
        total: reserved.total,
        status: reserved.status,
        createdAt: reserved.createdAt
      }))
    ].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    }).slice(0, 5);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <span className="text-sm text-gray-500">
            {recentActivity.length} items
          </span>
        </div>
        <div className="space-y-4">
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No recent activity</p>
            </div>
          ) : (
            recentActivity.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.type === 'order' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {item.type === 'order' ? 'Order' : 'Reserved'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{item.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₹{item.total.toLocaleString()}</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    item.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    item.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                    item.status === 'reserved' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const TopProducts = () => {
    // Calculate sales for each product based on orders and reserved products
    const productSales = products.map(product => {
      const productOrders = orders.filter(order => order.productId === product.id);
      const productReserved = reservedProducts.filter(reserved => reserved.productId === product.id);
      
      const totalSales = productOrders.reduce((sum, order) => sum + order.quantity, 0) + 
                       productReserved.reduce((sum, reserved) => sum + reserved.quantity, 0);
      
      const totalRevenue = productOrders.reduce((sum, order) => sum + order.total, 0) + 
                          productReserved.reduce((sum, reserved) => sum + reserved.total, 0);

      return {
        ...product,
        totalSales,
        totalRevenue
      };
    });

    const topProducts = productSales
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Products</h3>
        <div className="space-y-4">
          {topProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No products yet</p>
            </div>
          ) : (
            topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-sm text-gray-600 capitalize">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{product.totalSales} sold</p>
                  <p className="text-sm text-gray-600">₹{product.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const RevenueChart = () => {
    // Generate revenue data for the selected time range
    const generateRevenueData = () => {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const data = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const dayOrders = orders.filter(order => {
          const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
          return orderDate.toDateString() === date.toDateString();
        });
        
        const dayReserved = reservedProducts.filter(reserved => {
          const reservedDate = reserved.createdAt?.toDate ? reserved.createdAt.toDate() : new Date(reserved.createdAt);
          return reservedDate.toDateString() === date.toDateString();
        });
        
        const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0) +
                          dayReserved.reduce((sum, reserved) => sum + (reserved.total || 0), 0);
        
        data.push({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: dayRevenue
        });
      }
      
      return data;
    };

    const revenueData = generateRevenueData();
    const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trend - {timeRange.toUpperCase()}</h3>
          <div className="flex space-x-2">
            <button 
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1 text-xs rounded-full ${timeRange === '7d' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              7D
            </button>
            <button 
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1 text-xs rounded-full ${timeRange === '30d' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              30D
            </button>
            <button 
              onClick={() => setTimeRange('90d')}
              className={`px-3 py-1 text-xs rounded-full ${timeRange === '90d' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              90D
            </button>
          </div>
        </div>
        <div className="flex items-end justify-between h-48 space-x-1">
          {revenueData.length === 0 ? (
            <div className="flex items-center justify-center w-full h-full">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No revenue data for this period</p>
              </div>
            </div>
          ) : (
            revenueData.map((data, index) => (
              <div key={data.day} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg mb-2 transition-all duration-300 hover:from-blue-600 hover:to-blue-500 cursor-pointer"
                  style={{ height: `${Math.max((data.revenue / maxRevenue) * 150, 4)}px` }}
                  role="img"
                  aria-label={`Revenue bar for ${data.day}: ₹${data.revenue.toLocaleString()}`}
                ></div>
                <span className="text-xs text-gray-600">{data.day}</span>
                <span className="text-xs font-medium text-gray-900">
                  ₹{data.revenue > 1000 ? `${((data.revenue || 0) / 1000).toFixed(1)}k` : (data.revenue || 0)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
            <p className="text-gray-600">Welcome back, {userData?.displayName || 'Seller'}!</p>
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Select time range"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button 
              onClick={refreshData}
              disabled={loading}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              title="Download report"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            color="bg-green-500"
            growth={stats.revenueGrowth}
            trend="up"
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={ShoppingCart}
            color="bg-blue-500"
            growth={stats.orderGrowth}
            trend="up"
          />
          <StatCard
            title="Active Products"
            value={`${stats.activeProducts}/${stats.totalProducts}`}
            icon={Package}
            color="bg-purple-500"
            growth={stats.productGrowth}
            trend="up"
          />
          <StatCard
            title="Conversion Rate"
            value={`${(stats.conversionRate || 0).toFixed(1)}%`}
            icon={Target}
            color="bg-orange-500"
            growth={stats.viewGrowth}
            trend="down"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Average Order Value"
            value={`₹${stats.averageOrderValue.toLocaleString()}`}
            icon={TrendingUp}
            color="bg-indigo-500"
          />
          <StatCard
            title="Total Views"
            value={stats.totalViews.toLocaleString()}
            icon={Eye}
            color="bg-pink-500"
          />
          <StatCard
            title="Average Rating"
            value={stats.averageRating.toFixed(1)}
            icon={Star}
            color="bg-yellow-500"
          />
          <StatCard
            title="Active Users"
            value="1,234"
            icon={Users}
            color="bg-teal-500"
          />
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RevenueChart />
          <CategoryChart />
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentOrders />
          <TopProducts />
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
