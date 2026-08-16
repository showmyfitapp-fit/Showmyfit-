'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User, Edit, LogOut,
  ShoppingBag, Heart, Settings,
  Calendar, Award, Package, XCircle, CheckCircle,
  Bell, RefreshCw, Search, Info
} from 'lucide-react';
import ImageUpload from '@/components/common/ImageUpload';
import WhatsAppButton from '@/components/common/WhatsAppButton';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile, getSellerApplicationStatus } from '@/lib/auth';
import AdminProfilePage from './AdminProfilePage';
import SellerProfilePage from './SellerProfilePage';

const ProfilePage: React.FC = () => {
  const { currentUser, userData, signOut, refreshUserData, loading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showProfilePicUpload, setShowProfilePicUpload] = useState(false);

  // We are not using applicationStatus currently but keeping the fetch logic if we want to restore badges later
  // For now, simplifying to remove unused variables warning

  const [editData, setEditData] = useState({
    displayName: userData?.displayName || currentUser?.displayName || '',
    phone: userData?.phone || '',
    address: userData?.address || '',
    profilePicture: userData?.profileImage || ''
  });

  const [applicationStatus, setApplicationStatus] = useState<'not_applied' | 'pending' | 'approved' | 'rejected'>('not_applied');

  useEffect(() => {
    const checkStatus = async () => {
      if (currentUser) {
        try {
          const status = await getSellerApplicationStatus(currentUser.uid);
          setApplicationStatus(status);
          console.log('Application status:', status);
        } catch (error) {
          console.error('Error checking application status:', error);
        }
      }
    };
    checkStatus();
  }, [currentUser]);

  useEffect(() => {
    console.log('Current application status:', applicationStatus);
  }, [applicationStatus]);

  useEffect(() => {
    if (!loading && !currentUser) router.push('/auth');
  }, [loading, currentUser, router]);

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
      profilePicture: userData?.profileImage || ''
    });
  };

  const handleSave = async () => {
    if (!currentUser) return;
    try {
      await updateUserProfile(currentUser.uid, editData);
      setIsEditing(false);
      // The userData will be updated automatically through the AuthContext
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      displayName: userData?.displayName || currentUser?.displayName || '',
      phone: userData?.phone || '',
      address: userData?.address || '',
      profilePicture: userData?.profileImage || ''
    });
  };

  const handleProfilePicUpload = async (url: string) => {
    setEditData({ ...editData, profilePicture: url });
    if (currentUser) {
      try {
        console.log('💾 Saving profile picture to database:', url);
        await updateUserProfile(currentUser.uid, { profileImage: url });
        // Refresh user data to reflect the change
        if (refreshUserData) {
          await refreshUserData();
        }
        alert('Profile picture updated successfully!');
      } catch (error) {
        console.error('Error saving profile picture:', error);
        alert('Failed to save profile picture. Please try again.');
      }
    }
    setShowProfilePicUpload(false);
  };

  const handleProfilePicRemove = async () => {
    setEditData({ ...editData, profilePicture: '' });
    if (currentUser) {
      try {
        console.log('💾 Removing profile picture from database');
        await updateUserProfile(currentUser.uid, { profileImage: '' });
        // Refresh user data to reflect the change
        if (refreshUserData) {
          await refreshUserData();
        }
        alert('Profile picture removed successfully!');
      } catch (error) {
        console.error('Error removing profile picture:', error);
        alert('Failed to remove profile picture. Please try again.');
      }
    }
    setShowProfilePicUpload(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  // ... imports and state logic remain dynamic, but the UI is completely overhauled

  if (!currentUser) return null;
  if (userData?.role === 'admin') return <AdminProfilePage currentUser={currentUser} userData={userData} />;
  if (userData?.role === 'shop') return <SellerProfilePage currentUser={currentUser} userData={userData} />;

  // Determine Initials
  const userInitials = editData.displayName
    ? editData.displayName.substring(0, 2).toUpperCase()
    : currentUser.displayName
      ? currentUser.displayName.substring(0, 2).toUpperCase()
      : 'U';

  // Quick Stats Mockup (You can wire these up to real data later)
  const stats = [
    { label: 'Orders', value: '0', icon: ShoppingBag, href: '/orders' },
    { label: 'Wishlist', value: '0', icon: Heart, href: '/wishlist' },
    { label: 'Cart', value: '0', icon: ShoppingBag, href: '/cart' },
  ];

  type MenuItem = {
    label: string;
    icon: any;
    href?: string;
    onClick?: () => void;
  };

  const menuItems: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Shopping',
      items: [
        { label: 'My Orders', icon: Package, href: '/orders' },
        { label: 'Favorites', icon: Heart, href: '/wishlist' },
        { label: 'Cart', icon: ShoppingBag, href: '/cart' },
      ]
    },
    {
      title: 'Account Settings',
      items: [
        { label: 'Profile Details', icon: User, onClick: handleEdit },
        { label: 'Addresses', icon: Settings, href: '/profile/addresses' }, // Placeholder href
        { label: 'Notifications', icon: Bell, href: '/notifications' },
      ]
    },
    {
      title: 'Support',
      items: [
        { label: 'Help Center', icon: Search, href: '/help' },
        { label: 'About Us', icon: Info, href: '/about' },
      ]
    }
  ];

  // Lucide icons needed for the menu logic above that might not be imported yet
  // I will add imports for Info, Package, ChevronRight to the top of the file in the next step or assume they are available/mapped.
  // Actually, let's use the ones we have. 
  // Map icons:
  // User, Edit, LogOut, ShoppingBag, Heart, Settings, Calendar, Award, Package, XCircle, CheckCircle, Bell, RefreshCw, Search
  // Missing: ChevronRight, Info. I'll use ArrowRight or similar if needed, or just add them to import.

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Hero / Header Section */}
      <div className="bg-white pt-10 pb-8 rounded-b-[40px] shadow-sm relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-gray-100 to-gray-50 opacity-50"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-100 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute top-20 -left-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-30"></div>

        <div className="relative z-10 flex flex-col items-center text-center px-6">
          {/* Avatar */}
          <div className="relative mb-4 group cursor-pointer" onClick={() => setShowProfilePicUpload(true)}>
            <div className="w-28 h-28 rounded-full p-1 bg-white shadow-xl ring-4 ring-gray-50">
              <div className="w-full h-full rounded-full bg-gray-900 text-white flex items-center justify-center overflow-hidden text-3xl font-black">
                {editData.profilePicture ? (
                  <img src={editData.profilePicture} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <span>{userInitials}</span>
                )}
              </div>
            </div>
            <div className="absolute bottom-1 right-1 bg-black text-white p-2 rounded-full shadow-lg border-2 border-white hover:bg-black transition-colors">
              <Edit className="w-4 h-4" />
            </div>
          </div>

          {/* Name & Info */}
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            {currentUser.displayName || 'Welcome, Guest'}
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            {currentUser.email}
          </p>
          {userData?.phone && (
            <p className="text-gray-400 text-sm mt-1">{userData.phone}</p>
          )}

          {/* Edit Profile Button (Visible only when not editing) */}
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="mt-6 px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-full hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              Edit Profile
            </button>
          )}

          {/* Editing Form */}
          {isEditing && (
            <div className="w-full max-w-sm mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-fade-in">
              <div className="space-y-3">
                <input
                  value={editData.displayName}
                  onChange={e => setEditData({ ...editData, displayName: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all placeholder:text-gray-300"
                  placeholder="Display Name"
                />
                <input
                  value={editData.phone}
                  onChange={e => setEditData({ ...editData, phone: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all placeholder:text-gray-300"
                  placeholder="Phone Number"
                />
                <div className="flex gap-2 pt-2">
                  <button onClick={handleSave} className="flex-1 bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors">
                    Save Changes
                  </button>
                  <button onClick={handleCancel} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex justify-center gap-4 mt-8 px-4 max-w-md mx-auto">
          {stats.map((stat, idx) => (
            <Link
              key={idx}
              href={stat.href}
              className="flex-1 bg-gray-50 hover:bg-gray-100 p-3 rounded-2xl flex flex-col items-center transition-colors group cursor-pointer"
            >
              <span className="text-xl font-black text-gray-900 group-hover:scale-110 transition-transform duration-300">
                {stat.value}
              </span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-1">
                {stat.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-xl mx-auto px-4 mt-6 space-y-8">

        {/* Incomplete Profile Warning */}
        {(!currentUser.displayName || !userData?.phone) && (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-4">
            <div className="bg-orange-100 p-2 rounded-full text-orange-600">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-sm">Complete your profile</h3>
              <p className="text-xs text-gray-500">Add your name and phone number to place orders.</p>
            </div>
            <button onClick={handleEdit} className="text-xs font-bold bg-orange-100 text-orange-700 px-3 py-2 rounded-lg hover:bg-orange-200 transition-colors">
              Complete Now
            </button>
          </div>
        )}

        {/* Menu Sections */}
        {menuItems.map((section, idx) => (
          <div key={idx}>
            <h3 className="px-4 text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3">
              {section.title}
            </h3>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {section.items.map((item, itemIdx) => {
                const content = (
                  <>
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 group-hover:bg-black group-hover:text-white transition-colors duration-300">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="flex-1 font-bold text-gray-700 group-hover:text-gray-900 transition-colors">
                      {item.label}
                    </span>
                    {/* <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-black transition-colors" /> */}
                  </>
                );

                if (item.href && typeof item.href === 'string') {
                  return (
                    <Link
                      key={itemIdx}
                      href={item.href}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group cursor-pointer"
                    >
                      {content}
                    </Link>
                  );
                }
                return (
                  <button
                    key={itemIdx}
                    onClick={item.onClick}
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group cursor-pointer text-left"
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Seller Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-black text-white p-6 shadow-xl">
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-1">Become a Seller</h3>
            <p className="text-gray-400 text-sm font-medium mb-4 max-w-[200px]">Start selling your products on ShowMyFit today.</p>
            <Link
              href="/become-seller"
              className="inline-block bg-white text-black px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gray-100 transition-colors"
            >
              Apply Now
            </Link>
          </div>
          {/* Decorative generic shape */}
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-gray-800 rounded-full blur-2xl -mr-10 -mb-10"></div>
          <Award className="absolute right-6 top-1/2 -translate-y-1/2 w-24 h-24 text-gray-800/50" />
        </div>

        {/* Logout Button */}
        <button
          onClick={handleSignOut}
          className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>

        <p className="text-center text-xs font-medium text-gray-300 pb-4">
          Version 1.0.0 • ShowMyFit Inc.
        </p>

      </div>

      {/* Upload Modal */}
      {showProfilePicUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl transform transition-all scale-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-xl text-gray-900">Update Photo</h3>
              <button
                onClick={() => setShowProfilePicUpload(false)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <ImageUpload
              onImageUpload={handleProfilePicUpload}
              onImageRemove={handleProfilePicRemove}
              currentImage={editData.profilePicture}
              maxSize={5}
              className="w-full aspect-square bg-gray-50 rounded-2xl mb-6 border-2 border-dashed border-gray-200 hover:border-black transition-colors"
            />

            <p className="text-center text-xs text-gray-400 font-medium">
              Supported formats: JPG, PNG • Max size: 5MB
            </p>
          </div>
        </div>
      )}

      <WhatsAppButton phoneNumber="918281474541" message="Hello ShowMyFit!" />
    </div>
  );
};

export default ProfilePage;
