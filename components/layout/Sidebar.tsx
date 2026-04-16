'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  X,
  Search,
  ShoppingBag,
  Heart,
  User,
  Store,
  Bell,
  Gift,
  TrendingUp,
  Shield,
  Sparkles,
  Package,
  Users,
  BarChart,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  LogOut,
  MapPin,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'user' | 'shop' | 'admin';
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, userRole }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, userData, signOut } = useAuth();
  const { getWishlistCount } = useWishlist();
  const [ordersCount, setOrdersCount] = useState(0);

  // Fetch orders count
  useEffect(() => {
    const fetchOrdersCount = async () => {
      if (!currentUser) return;
      try {
        const ordersQuery = query(collection(db, 'orders'), where('userId', '==', currentUser.uid));
        const snapshot = await getDocs(ordersQuery);
        setOrdersCount(snapshot.docs.length);
      } catch (e) { console.error(e); }
    };
    if (isOpen && currentUser) fetchOrdersCount();
  }, [isOpen, currentUser]);

  const getMenuItems = () => {
    const common = [
      { icon: Search, label: 'Explore', path: '/browse' },
      { icon: ShoppingBag, label: 'Cart', path: '/cart' },
      { icon: Heart, label: 'Wishlist', path: '/wishlist' },
    ];

    if (userRole === 'shop') {
      return [
        { icon: TrendingUp, label: 'Shop Dashboard', path: '/shop/dashboard' },
        { icon: Package, label: 'Inventory', path: '/shop/products' },
        ...common
      ];
    }

    if (userRole === 'admin') {
      return [
        { icon: Shield, label: 'Admin Command', path: '/admin' },
        { icon: Users, label: 'Member List', path: '/admin/users' },
        ...common
      ];
    }

    return [
      ...common,
      { icon: Store, label: 'Categories', path: '/categories' },
      { icon: User, label: 'Account', path: '/profile' },
    ];
  };

  const menuItems = getMenuItems();

  const handleLogout = async () => {
    await signOut();
    onClose();
    router.push('/');
  };

  return (
    <>
      {/* Dynamic Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-700 z-[60] shrink-0 ${isOpen ? 'opacity-40 backdrop-blur-md pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Handcrafted Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-[320px] bg-[#FDFCFB] shadow-[20px_0_60px_-15px_rgba(0,0,0,0.1)] z-[70] transform transition-all duration-700 cubic-bezier(0.19, 1, 0.22, 1) flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Elite Header */}
        <div className="relative p-8 pt-12 overflow-hidden border-b border-neutral-100">
          {/* Abstract Design Elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-black/5 rounded-full blur-3xl"></div>
          <div className="absolute top-20 -left-10 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center shadow-2xl rotate-3 group overflow-hidden">
                  <Sparkles className="w-5 h-5 text-white animate-pulse" />
                </div>
                <span className="text-xl font-black italic tracking-tighter uppercase">Showmyfit</span>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white border border-neutral-100 flex items-center justify-center hover:bg-black hover:text-white transition-all active:scale-95 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Identification Card */}
            <Link
              href={currentUser ? "/profile" : "/login"}
              onClick={onClose}
              className="group flex flex-col p-5 bg-white border border-neutral-100 rounded-[28px] shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 block"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center overflow-hidden border border-neutral-200 group-hover:rotate-3 transition-transform duration-500">
                  {currentUser?.photoURL ? (
                    <Image
                      src={currentUser.photoURL}
                      alt="Identity"
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <User className="w-6 h-6 text-neutral-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-lg text-black truncate uppercase tracking-tight">
                    {currentUser ? (currentUser.displayName || 'Vanguard Member') : 'Identity Found?'}
                  </h3>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5 pt-1">
                    <MapPin className="w-3 h-3" /> Bangalore, IN
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-neutral-50 px-1">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Account</span>
                  <span className="text-[11px] font-black text-black uppercase tracking-widest mt-0.5">
                    {userData?.role || 'Guest Member'}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto pt-8 pb-10 scrollbar-hide px-6">
          <div className="space-y-1">
            <p className="px-4 text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em] mb-4">Navigation</p>
            {menuItems.map((item, id) => (
              <Link
                key={id}
                href={item.path}
                onClick={onClose}
                className={`flex items-center gap-5 px-5 py-4 rounded-2xl transition-all duration-500 group ${pathname === item.path ? 'bg-black text-white shadow-xl translate-x-1' : 'text-neutral-500 hover:text-black hover:bg-neutral-50'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${pathname === item.path ? 'bg-white/10' : 'bg-neutral-100'}`}>
                  <item.icon className={`w-5 h-5 ${pathname === item.path ? 'text-white' : 'text-neutral-500 group-hover:text-black'}`} />
                </div>
                <span className="text-[12px] font-black uppercase tracking-widest">{item.label}</span>
                {pathname !== item.path && <ArrowRight className="ml-auto w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" />}
              </Link>
            ))}
          </div>

          {/* Quick Identity Stats */}
          <div className="mt-12 p-6 bg-neutral-900 rounded-[32px] text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 transition-transform group-hover:scale-110 duration-700"></div>
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-6">Your Stats</p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-3xl font-black italic tracking-tighter mb-1">{ordersCount}</div>
                <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Shipments</div>
              </div>
              <div>
                <div className="text-3xl font-black italic tracking-tighter mb-1">{getWishlistCount()}</div>
                <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Wishlist</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modular Footer */}
        <div className="p-8 border-t border-neutral-100 bg-white">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/settings')}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center group-hover:bg-neutral-100 transition-colors">
                <Settings className="w-4 h-4 text-neutral-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Settings</span>
            </button>
            {currentUser && (
              <button
                onClick={handleLogout}
                className="px-6 py-2.5 bg-neutral-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all transform active:scale-95"
              >
                Log Out
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
