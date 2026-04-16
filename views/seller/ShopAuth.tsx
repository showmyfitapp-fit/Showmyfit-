'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Store, Shield, User } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import { getUserLocation } from '@/utils/distance';

const ShopAuth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<'shop' | 'admin'>('shop');
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    address: '',
    email: '',
    password: ''
  });
  const { addShop, setCurrentShop, state } = useApp();
  const router = useRouter();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {

        // Regular shop login logic
        if (userType === 'shop') {
          const shop = state.shops.find(s => s.name.toLowerCase() === formData.name.toLowerCase());
          if (shop) {
            setCurrentShop(shop);
            router.push('/shop/dashboard');
          } else {
            alert('Shop not found');
          }
        } else {
          alert('Invalid admin credentials');
        }
      } else {
        // Registration logic (only for shops)
        if (userType === 'shop') {
          const location = await getUserLocation();

          addShop({
            name: formData.name,
            contact: formData.contact,
            address: formData.address,
            latitude: location?.latitude || 37.7749,
            longitude: location?.longitude || -122.4194,
            approved: false
          });

          alert('Registration submitted! Waiting for admin approval.');
          setIsLogin(true);
          setFormData({ name: '', contact: '', address: '', email: '', password: '' });
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-cream/95 backdrop-blur-lg shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="inline-flex items-center text-warm-600 hover:text-warm-900 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-xl p-8 hover-lift">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-warm-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {userType === 'admin' ? <Shield className="w-8 h-8 text-warm-600" /> : <Store className="w-8 h-8 text-warm-600" />}
            </div>
            <h2 className="text-2xl font-serif font-bold text-warm-900">
              {isLogin ? (userType === 'admin' ? 'Admin Login' : 'Shop Login') : 'Register Your Shop'}
            </h2>
            <p className="text-warm-600 mt-2">
              {isLogin ? (userType === 'admin' ? 'Access admin dashboard' : 'Access your shop dashboard') : 'Join our marketplace platform'}
            </p>
          </div>

          {/* User Type Selection */}
          {isLogin && (
            <div className="mb-6">
              <div className="flex bg-warm-100 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setUserType('shop')}
                  className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg transition-all duration-300 ${userType === 'shop'
                    ? 'bg-white text-warm-800 shadow-sm'
                    : 'text-warm-600 hover:text-warm-800'
                    }`}
                >
                  <Store className="w-4 h-4 mr-2" />
                  Shop
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('admin')}
                  className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg transition-all duration-300 ${userType === 'admin'
                    ? 'bg-white text-warm-800 shadow-sm'
                    : 'text-warm-600 hover:text-warm-800'
                    }`}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </button>
              </div>
            </div>
          )}

          {/* Test Credentials Info */}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isLogin ? (
              <>
                <FormInput
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={updateFormData('email')}
                  placeholder="Enter your email"
                  required
                />
                <FormInput
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={updateFormData('password')}
                  placeholder="Enter password"
                  required
                />
              </>
            ) : (
              <>
                <FormInput
                  label="Shop Name"
                  value={formData.name}
                  onChange={updateFormData('name')}
                  placeholder="Enter your shop name"
                  required
                />
                <FormInput
                  label="Contact Number"
                  type="tel"
                  value={formData.contact}
                  onChange={updateFormData('contact')}
                  placeholder="+1234567890"
                  required
                />
                <FormInput
                  label="Address"
                  type="textarea"
                  value={formData.address}
                  onChange={updateFormData('address')}
                  placeholder="Your shop address"
                  rows={3}
                  required
                />
                <FormInput
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={updateFormData('password')}
                  placeholder="Enter password"
                  required
                />
              </>
            )}

            <Button
              type="submit"
              variant="secondary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              {isLogin ? (userType === 'admin' ? 'Admin Login' : 'Shop Login') : 'Register Shop'}
            </Button>
          </form>

          {userType === 'shop' && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-warm-600 hover:text-warm-700 font-medium transition-colors"
              >
                {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopAuth;