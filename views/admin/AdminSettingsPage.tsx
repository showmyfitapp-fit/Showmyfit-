'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getAdminSettings, saveAdminSettings } from '@/lib/supabase/admin';
import {
  Settings,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Bell,
  Shield,
  Database,
  Mail,
  Globe,
  Users,
  ShoppingBag,
  TrendingUp
} from 'lucide-react';
import Button from '@/components/ui/Button';

interface AdminSettings {
  id?: string;
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  currency: string;
  timezone: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  sellerRegistrationEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  autoApproveSellers: boolean;
  maxProductsPerSeller: number;
  commissionRate: number;
  shippingCost: number;
  freeShippingThreshold: number;
  taxRate: number;
  updatedAt: Date;
}

const AdminSettingsPage: React.FC = () => {
  const router = useRouter();
  const { currentUser, userData, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<AdminSettings>({
    siteName: 'Showmyfit',
    siteDescription: 'Your trusted e-commerce platform',
    contactEmail: 'admin@showmyfit.com',
    contactPhone: '+91 9876543210',
    address: '123 Business Street, City, State 12345',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    maintenanceMode: false,
    registrationEnabled: true,
    sellerRegistrationEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    autoApproveSellers: false,
    maxProductsPerSeller: 1000,
    commissionRate: 5,
    shippingCost: 50,
    freeShippingThreshold: 500,
    taxRate: 18,
    updatedAt: new Date()
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const isAdmin = Boolean(currentUser && userData?.role === 'admin');

  const loadSettings = async () => {
    setLoading(true);
    try {
      const existing = await getAdminSettings();
      if (existing) {
        setSettings((prev) => ({
          ...prev,
          ...existing,
          id: 'adminSettings',
          updatedAt: existing.updatedAt
            ? new Date(existing.updatedAt)
            : new Date(),
        }));
      } else {
        const defaults: AdminSettings = {
          siteName: 'Showmyfit',
          siteDescription: 'Your trusted e-commerce platform',
          contactEmail: 'admin@showmyfit.com',
          contactPhone: '+91 9876543210',
          address: '123 Business Street, City, State 12345',
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          maintenanceMode: false,
          registrationEnabled: true,
          sellerRegistrationEnabled: true,
          emailNotifications: true,
          smsNotifications: false,
          autoApproveSellers: false,
          maxProductsPerSeller: 1000,
          commissionRate: 5,
          shippingCost: 50,
          freeShippingThreshold: 500,
          taxRate: 18,
          updatedAt: new Date(),
          id: 'adminSettings',
        };
        await saveAdminSettings(defaults);
        setSettings(defaults);
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      setMessage(`Error loading settings: ${error.message}`);
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !isAdmin) {
      return;
    }
    loadSettings();
  }, [authLoading, isAdmin]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 admin-content">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 admin-content">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">You need admin access to manage settings.</p>
            <Button onClick={() => router.push('/profile')} variant="primary" size="lg">
              Go to Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Save settings
  const saveSettings = async () => {
    setSaving(true);
    try {
      // Check if user is authenticated
      if (!currentUser) {
        setMessage('You must be logged in to save settings');
        setIsSuccess(false);
        return;
      }

      const settingsData = {
        ...settings,
        id: 'adminSettings',
        updatedAt: new Date(),
      };
      await saveAdminSettings(settingsData);
      setSettings(settingsData);
      setMessage('Settings saved successfully!');
      setIsSuccess(true);
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        settings: settings
      });
      setMessage(`Error saving settings: ${error.message}`);
      setIsSuccess(false);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof AdminSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 admin-content">

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Settings className="w-8 h-8 mr-3 text-red-600" />
                Admin Settings
              </h1>
              <p className="text-gray-600 mt-2">Configure platform settings and preferences</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={loadSettings}
                variant="outline"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={saveSettings}
                variant="primary"
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
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

        {loading ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading settings...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* General Settings */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-red-600" />
                General Settings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-2">
                    Site Name
                  </label>
                  <input
                    id="siteName"
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => handleInputChange('siteName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    id="currency"
                    value={settings.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Site Description
                  </label>
                  <textarea
                    id="siteDescription"
                    value={settings.siteDescription}
                    onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Contact Settings */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-red-600" />
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    id="contactEmail"
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    id="contactPhone"
                    type="tel"
                    value={settings.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    id="address"
                    value={settings.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Platform Settings */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-red-600" />
                Platform Settings
              </h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="maintenanceMode" className="text-sm font-medium text-gray-700">Maintenance Mode</label>
                    <p className="text-sm text-gray-500">Temporarily disable the platform for maintenance</p>
                  </div>
                  <input
                    id="maintenanceMode"
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleInputChange('maintenanceMode', e.target.checked)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="registrationEnabled" className="text-sm font-medium text-gray-700">User Registration</label>
                    <p className="text-sm text-gray-500">Allow new users to register</p>
                  </div>
                  <input
                    id="registrationEnabled"
                    type="checkbox"
                    checked={settings.registrationEnabled}
                    onChange={(e) => handleInputChange('registrationEnabled', e.target.checked)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="sellerRegistrationEnabled" className="text-sm font-medium text-gray-700">Seller Registration</label>
                    <p className="text-sm text-gray-500">Allow new sellers to register</p>
                  </div>
                  <input
                    id="sellerRegistrationEnabled"
                    type="checkbox"
                    checked={settings.sellerRegistrationEnabled}
                    onChange={(e) => handleInputChange('sellerRegistrationEnabled', e.target.checked)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="autoApproveSellers" className="text-sm font-medium text-gray-700">Auto-approve Sellers</label>
                    <p className="text-sm text-gray-500">Automatically approve new seller registrations</p>
                  </div>
                  <input
                    id="autoApproveSellers"
                    type="checkbox"
                    checked={settings.autoApproveSellers}
                    onChange={(e) => handleInputChange('autoApproveSellers', e.target.checked)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-red-600" />
                Notification Settings
              </h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">Email Notifications</label>
                    <p className="text-sm text-gray-500">Send email notifications to users</p>
                  </div>
                  <input
                    id="emailNotifications"
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="smsNotifications" className="text-sm font-medium text-gray-700">SMS Notifications</label>
                    <p className="text-sm text-gray-500">Send SMS notifications to users</p>
                  </div>
                  <input
                    id="smsNotifications"
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) => handleInputChange('smsNotifications', e.target.checked)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Business Settings */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-red-600" />
                Business Settings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="maxProductsPerSeller" className="block text-sm font-medium text-gray-700 mb-2">
                    Max Products per Seller
                  </label>
                  <input
                    id="maxProductsPerSeller"
                    type="number"
                    value={settings.maxProductsPerSeller}
                    onChange={(e) => handleInputChange('maxProductsPerSeller', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700 mb-2">
                    Commission Rate (%)
                  </label>
                  <input
                    id="commissionRate"
                    type="number"
                    step="0.1"
                    value={settings.commissionRate}
                    onChange={(e) => handleInputChange('commissionRate', parseFloat(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="shippingCost" className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Cost (₹)
                  </label>
                  <input
                    id="shippingCost"
                    type="number"
                    value={settings.shippingCost}
                    onChange={(e) => handleInputChange('shippingCost', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="freeShippingThreshold" className="block text-sm font-medium text-gray-700 mb-2">
                    Free Shipping Threshold (₹)
                  </label>
                  <input
                    id="freeShippingThreshold"
                    type="number"
                    value={settings.freeShippingThreshold}
                    onChange={(e) => handleInputChange('freeShippingThreshold', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    id="taxRate"
                    type="number"
                    step="0.1"
                    value={settings.taxRate}
                    onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    value={settings.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsPage;
