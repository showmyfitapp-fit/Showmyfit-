'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Store, CheckCircle, Star, Users, TrendingUp, Shield,
  CreditCard, Headphones, Zap, Globe, Award, Phone, Mail, MapPin,
  Upload, Building, FileText, DollarSign, LogIn, Clock, XCircle, AlertCircle
} from 'lucide-react';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import GoogleMapLocation from '@/components/common/GoogleMapLocation';
import { useAuth } from '@/contexts/AuthContext';
import { submitSellerApplication, getSellerApplicationStatus } from '@/firebase/auth';
import SelectDropdown from '@/components/ui/SelectDropdown';

const BecomeSellerPage: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const router = useRouter();
  const navigate = (path: any) => router.push(path);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [showErrorDropdown, setShowErrorDropdown] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<'not_applied' | 'pending' | 'approved' | 'rejected'>('not_applied');
  const [checkingStatus, setCheckingStatus] = useState(true);

  const [formData, setFormData] = useState({
    // Business Information
    businessName: '',
    businessType: '',
    businessDescription: '',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',

    // Business Details
    yearsInBusiness: '',
    website: '',

    // Location
    location: null as { lat: number; lng: number; address?: string } | null,

    // Documents
    panNumber: '',
    gstNumber: '',

    // Categories
    categories: [] as string[],

    // Terms
    agreeToTerms: false,
    agreeToMarketing: false
  });

  // Check application status on component mount
  useEffect(() => {
    const checkStatus = async () => {
      if (currentUser) {
        try {
          const status = await getSellerApplicationStatus(currentUser.uid);
          setApplicationStatus(status);
          console.log('📋 Current application status:', status);
        } catch (error) {
          console.error('Error checking application status:', error);
        }
      }
      setCheckingStatus(false);
    };

    checkStatus();
  }, [currentUser]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !currentUser) {
      // Don't redirect immediately, show login prompt instead
    }
  }, [currentUser, loading]);

  const businessTypes = [
    'Fashion & Apparel 👕',
    'Footwear 👟',
    'Jewelry & Accessories 💍',
    'Bags & Luggage 🎒',
    'Kids & Baby Products 🧸',
    'Electronics & Gadgets',
    'Mobile & Accessories 📱',
    'Computers & Laptops 💻',
    'Home Appliances ⚡',
    'Optical & Eyewear 👓',
    'Fitness Centers / Gyms 🏋',
    'Books & Stationery',
    'Toys & Educational Stores 🧩',
    'Music & Art Supplies 🎶',
    'Furniture and decor',
    'Pet Supplies',
    'Arts and handicraft',
    'Beauty and personal care',
    'Automotive',
    'Sports'
  ];

  const categories = [
    'Men\'s Clothing', 'Women\'s Clothing', 'Kids\' Clothing', 'Shoes & Footwear',
    'Accessories', 'Jewelry', 'Watches', 'Bags & Luggage', 'Home Decor',
    'Kitchen Appliances', 'Electronics', 'Mobile & Accessories', 'Beauty Products',
    'Health & Wellness', 'Sports & Fitness', 'Books & Media', 'Toys & Games'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      // Ensure value is never undefined or null
      const safeValue = value ?? '';
      setFormData(prev => ({ ...prev, [name]: safeValue }));
    }
  };

  const handleCategoryChange = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setErrors([]);
    setShowErrorDropdown(false);

    try {
      console.log('🚀 Starting seller application process...');

      // Collect all validation errors
      const validationErrors: string[] = [];

      // Check if user is authenticated
      if (!currentUser) {
        validationErrors.push('Please login to continue with seller application');
      }

      // Validate required fields
      if (!formData.businessName?.trim()) {
        validationErrors.push('Business Name is required');
      }

      if (!formData.businessType) {
        validationErrors.push('Business Type is required');
      }

      if (!formData.businessAddress?.trim()) {
        validationErrors.push('Business Address is required');
      }

      if (!formData.panNumber?.trim()) {
        validationErrors.push('PAN Card Number is required');
      }

      // Validate location
      if (!formData.location) {
        validationErrors.push('Please set your business location on the map');
      }

      // Validate terms agreement
      if (!formData.agreeToTerms) {
        validationErrors.push('Please agree to the terms and conditions');
      }

      // If there are validation errors, show them
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setShowErrorDropdown(true);
        setLoading(false);
        // Scroll to top to show errors
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      console.log('✅ Form validation passed');

      // Prepare seller application data
      console.log('📝 Preparing seller application data...');

      const sellerApplication = {
        // Personal Information (from current user)
        name: currentUser.displayName || userData?.name || '',
        email: currentUser.email || '',
        phone: userData?.phone || '',

        // Business Information
        businessName: formData.businessName,
        businessType: formData.businessType,
        businessDescription: formData.businessDescription,
        businessAddress: formData.businessAddress,
        businessPhone: formData.businessPhone,
        businessEmail: formData.businessEmail,

        // Business Details
        yearsInBusiness: formData.yearsInBusiness,
        website: formData.website,

        // Location
        location: formData.location,

        // Documents
        documents: {
          pan: formData.panNumber,
          gst: formData.gstNumber || ''
        },

        // Categories
        categories: formData.categories,

        // Stats (initialized to 0)
        stats: {
          totalProducts: 0,
          totalSales: 0,
          totalOrders: 0,
          rating: 0
        }
      };

      console.log('📊 Seller application data:', sellerApplication);
      console.log('🔥 Attempting to save application...');

      try {
        const applicationId = await submitSellerApplication(currentUser.uid, sellerApplication);
        console.log('✅ Seller application saved successfully with ID:', applicationId);
        setApplicationStatus('pending');
      } catch (firestoreError: any) {
        console.error('❌ Firestore error details:', {
          code: firestoreError.code,
          message: firestoreError.message,
          stack: firestoreError.stack
        });
        throw new Error(`Database error: ${firestoreError.message} (Code: ${firestoreError.code})`);
      }

      console.log('🎉 Seller application process completed successfully!');
      alert('Seller application submitted successfully! We\'ll review your application and get back to you within 24-48 hours.');
      router.push('/');
    } catch (error: any) {
      console.error('💥 Registration error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      const errorMessage = error.message || 'Failed to submit application. Please try again.';
      setError(errorMessage);
      setErrors([errorMessage]);
      setShowErrorDropdown(true);
      setLoading(false);
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking status
  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking application status...</p>
        </div>
      </div>
    );
  }

  // Show application status UI based on current status
  const renderApplicationStatus = () => {
    switch (applicationStatus) {
      case 'pending':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="main-content pt-0">
              <section className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                  <Clock className="w-16 h-16 mx-auto mb-6 text-yellow-300" />
                  <h1 className="text-4xl font-bold mb-6">Application Under Review</h1>
                  <p className="text-xl text-yellow-100 mb-8 leading-relaxed">
                    Your seller application has been submitted and is currently under review.
                    We'll get back to you within 24-48 hours.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/">
                      <Button variant="secondary" size="lg" className="bg-white text-black hover:bg-yellow-50">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Home
                      </Button>
                    </Link>
                  </div>
                </div>
              </section>
            </div>
            <Footer />
          </div>
        );

      case 'approved':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="main-content pt-0">
              <section className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                  <CheckCircle className="w-16 h-16 mx-auto mb-6 text-green-300" />
                  <h1 className="text-4xl font-bold mb-6">Application Approved! 🎉</h1>
                  <p className="text-xl text-green-100 mb-8 leading-relaxed">
                    Congratulations! Your seller application has been approved.
                    You can now access your seller dashboard and start listing products.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/profile">
                      <Button variant="secondary" size="lg" className="bg-white text-green-600 hover:bg-green-50">
                        <Store className="w-5 h-5 mr-2" />
                        Go to Seller Dashboard
                      </Button>
                    </Link>
                    <Link href="/">
                      <Button variant="outline" size="lg" className="border-white text-black hover:bg-white hover:text-green-600">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Home
                      </Button>
                    </Link>
                  </div>
                </div>
              </section>
            </div>
            <Footer />
          </div>
        );

      case 'rejected':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="main-content pt-0">
              <section className="bg-gradient-to-r from-red-500 to-pink-500 text-white py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                  <XCircle className="w-16 h-16 mx-auto mb-6 text-red-300" />
                  <h1 className="text-4xl font-bold mb-6">Application Not Approved</h1>
                  <p className="text-xl text-red-100 mb-8 leading-relaxed">
                    Unfortunately, your seller application was not approved at this time.
                    You can review our requirements and apply again.
                  </p>
                  {userData?.sellerApplication?.rejectionReason && (
                    <div className="bg-white/20 backdrop-blur-lg rounded-lg p-6 mb-8 text-left">
                      <h3 className="text-lg font-semibold mb-2">Reason for Rejection:</h3>
                      <p className="text-red-100">{userData.sellerApplication.rejectionReason}</p>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => setApplicationStatus('not_applied')}
                      variant="secondary"
                      size="lg"
                      className="bg-white text-red-600 hover:bg-red-50"
                    >
                      <Store className="w-5 h-5 mr-2" />
                      Apply Again
                    </Button>
                    <Link href="/">
                      <Button variant="outline" size="lg" className="border-white text-black hover:bg-white hover:text-red-600">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Home
                      </Button>
                    </Link>
                  </div>
                </div>
              </section>
            </div>
            <Footer />
          </div>
        );

      default:
        return null; // Will show the normal form
    }
  };

  // Show status UI if not 'not_applied'
  if (applicationStatus !== 'not_applied') {
    return renderApplicationStatus();
  }

  // Show login prompt if not authenticated
  if (!loading && !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="main-content pt-0">
          <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
            <div className="max-w-4xl mx-auto px-4 text-center">
              <LogIn className="w-16 h-16 mx-auto mb-6 text-yellow-300" />
              <h1 className="text-4xl font-bold mb-6">
                Login Required
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                You need to be logged in to apply as a seller. Please login to your account to continue with the seller application process.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth">
                  <Button variant="secondary" size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                    <LogIn className="w-5 h-5 mr-2" />
                    Login to Continue
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" size="lg" className="border-white text-black hover:bg-white hover:text-blue-600">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="main-content pt-0">
        {/* Registration Form - Moved to Top */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Started Today</h2>
              <p className="text-gray-600 text-lg">Fill out the form below to start your seller journey</p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Error Dropdown - Prominent and Visible */}
              {(showErrorDropdown && errors.length > 0) && (
                <div className="mx-0 bg-red-500 text-white shadow-2xl animate-slide-down sticky top-0 z-50 border-b-4 border-red-600">
                  <div className="px-8 py-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        <AlertCircle className="w-6 h-6 mr-4 mt-0.5 flex-shrink-0 text-white" />
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-2 flex items-center">
                            <XCircle className="w-5 h-5 mr-2" />
                            Please Fix The Following Errors
                          </h3>
                          <ul className="space-y-2 list-disc list-inside">
                            {errors.map((err, index) => (
                              <li key={index} className="text-sm font-medium">{err}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowErrorDropdown(false);
                          setErrors([]);
                        }}
                        className="ml-4 p-2 hover:bg-red-600 rounded-lg transition-colors flex-shrink-0"
                        aria-label="Close errors"
                        title="Close errors"
                      >
                        <XCircle className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Legacy error display (fallback) */}
              {error && !showErrorDropdown && (
                <div className="mx-8 mt-8 bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg mb-6 flex items-start">
                  <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* User Info Display */}
              {currentUser && (
                <div className="mx-8 mt-8 mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    Application for: {currentUser.displayName || userData?.name || 'User'}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-500" />
                      {currentUser.email}
                    </p>
                    {userData?.phone && (
                      <p className="text-gray-700 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-500" />
                        {userData.phone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-10">

                {/* Business Information */}
                <div className="pt-8 border-t border-gray-100 first:border-t-0 first:pt-0">
                  <div className="flex items-center mb-6 pb-4 border-b-2 border-gray-100">
                    <div className="p-3 bg-purple-100 rounded-xl mr-4">
                      <Building className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Business Information</h3>
                      <p className="text-sm text-gray-500 mt-1">Tell us about your business</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2.5">Business Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 shadow-sm hover:shadow-md"
                        placeholder="Enter your business name"
                      />
                    </div>
                    <div>
                      <label htmlFor="businessType" className="block text-sm font-semibold text-gray-700 mb-3">Business Type *</label>
                      <SelectDropdown
                        id="businessType"
                        value={formData.businessType}
                        onChange={(value) => setFormData({ ...formData, businessType: value })}
                        placeholder="Choose your business type..."
                        options={businessTypes.map((type) => ({ value: type, label: type }))}
                        buttonClassName="py-3.5 border-2"
                        menuClassName="border-2"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2.5">Business Description</label>
                      <textarea
                        name="businessDescription"
                        value={formData.businessDescription}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 shadow-sm hover:shadow-md resize-none"
                        placeholder="Describe your business and what you sell (optional)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2.5">Business Address <span className="text-red-500">*</span></label>
                      <textarea
                        name="businessAddress"
                        value={formData.businessAddress}
                        onChange={handleInputChange}
                        required
                        rows={3}
                        className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 shadow-sm hover:shadow-md resize-none"
                        placeholder="Enter your business address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2.5">Business Phone</label>
                      <input
                        type="tel"
                        name="businessPhone"
                        value={formData.businessPhone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 shadow-sm hover:shadow-md"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2.5">Business Email</label>
                      <input
                        type="email"
                        name="businessEmail"
                        value={formData.businessEmail}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 shadow-sm hover:shadow-md"
                        placeholder="business@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2.5">Website</label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 shadow-sm hover:shadow-md"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Location */}
                <div className="pt-8 border-t border-gray-100">
                  <div className="flex items-center mb-6 pb-4 border-b-2 border-gray-100">
                    <div className="p-3 bg-blue-100 rounded-xl mr-4">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Business Location</h3>
                      <p className="text-sm text-gray-500 mt-1">Set your store location on the map</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Store Location <span className="text-red-500">*</span>
                      </label>
                      <p className="text-sm text-gray-600 mb-4">
                        Click on the map or use the location button to set your business location. This helps customers find your store.
                      </p>
                      {formData.location && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800 font-medium flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Location set: {formData.location.lat.toFixed(6)}, {formData.location.lng.toFixed(6)}
                          </p>
                          {formData.location.address && (
                            <p className="text-xs text-green-700 mt-1">{formData.location.address}</p>
                          )}
                        </div>
                      )}
                      <div className="border-2 border-gray-300 rounded-xl overflow-hidden shadow-sm">
                        <GoogleMapLocation
                          location={formData.location}
                          onLocationChange={(location) => setFormData({ ...formData, location })}
                          isEditing={true}
                          height="400px"
                        />
                      </div>
                      {!formData.location && (
                        <p className="text-sm text-gray-500 mt-3 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2 text-amber-500" />
                          Please set your business location on the map
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Business Details */}
                <div className="pt-8 border-t border-gray-100">
                  <div className="flex items-center mb-6 pb-4 border-b-2 border-gray-100">
                    <div className="p-3 bg-green-100 rounded-xl mr-4">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Business Details</h3>
                      <p className="text-sm text-gray-500 mt-1">Additional information about your business</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-1 gap-6">
                    <div>
                      <label htmlFor="yearsInBusiness" className="block text-sm font-semibold text-gray-700 mb-3">Years in Business</label>
                      <SelectDropdown
                        id="yearsInBusiness"
                        value={formData.yearsInBusiness}
                        onChange={(value) => setFormData({ ...formData, yearsInBusiness: value })}
                        placeholder="Select years..."
                        options={['0-1', '1-3', '3-5', '5-10', '10+'].map((years) => ({
                          value: years,
                          label: years === '10+' ? years : `${years} years`,
                        }))}
                        buttonClassName="py-3.5 border-2"
                        menuClassName="border-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="pt-8 border-t border-gray-100">
                  <div className="flex items-center mb-6 pb-4 border-b-2 border-gray-100">
                    <div className="p-3 bg-yellow-100 rounded-xl mr-4">
                      <Star className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Product Categories</h3>
                      <p className="text-sm text-gray-500 mt-1">Select the categories you want to sell in (you can select multiple)</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categories.map(category => (
                      <label key={category} className="flex items-center p-3 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200">
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(category)}
                          onChange={() => handleCategoryChange(category)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Legal Documents */}
                <div className="pt-8 border-t border-gray-100">
                  <div className="flex items-center mb-6 pb-4 border-b-2 border-gray-100">
                    <div className="p-3 bg-red-100 rounded-xl mr-4">
                      <FileText className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Legal Documents</h3>
                      <p className="text-sm text-gray-500 mt-1">Required documentation for verification</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                        PAN Card Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="panNumber"
                        value={formData.panNumber}
                        onChange={handleInputChange}
                        required
                        maxLength={10}
                        className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 shadow-sm hover:shadow-md uppercase"
                        placeholder="ABCDE1234F"
                      />
                      <p className="text-xs text-gray-500 mt-2 flex items-center">
                        <Shield className="w-3 h-3 mr-1" />
                        Required for identity verification
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                        GSTIN Number <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        name="gstNumber"
                        value={formData.gstNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 shadow-sm hover:shadow-md"
                        placeholder="22ABCDE1234F1Z5"
                      />
                      <p className="text-xs text-gray-500 mt-2 flex items-center">
                        <Shield className="w-3 h-3 mr-1" />
                        Provide if your business is GST registered
                      </p>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="pt-8 border-t border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Terms and Conditions</h3>
                  <div className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <label className="flex items-start cursor-pointer group">
                      <input
                        type="checkbox"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleInputChange}
                        required
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-0.5 group-hover:border-blue-400 transition-colors"
                      />
                      <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">
                        I agree to the <Link href="/terms" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold">Terms and Conditions</Link> and <Link href="/privacy" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold">Privacy Policy</Link> <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <label className="flex items-start cursor-pointer group">
                      <input
                        type="checkbox"
                        name="agreeToMarketing"
                        checked={formData.agreeToMarketing}
                        onChange={handleInputChange}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-0.5 group-hover:border-blue-400 transition-colors"
                      />
                      <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">
                        I would like to receive marketing communications and updates about new features
                      </span>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="text-center pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-4 px-16 rounded-xl font-bold text-lg hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:hover:scale-100 relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                          Submitting Application...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Submit Application
                        </>
                      )}
                    </span>
                  </button>
                  <p className="text-sm text-gray-500 mt-5 flex items-center justify-center">
                    <Clock className="w-4 h-4 mr-2" />
                    We'll review your application and get back to you within 24-48 hours
                  </p>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Hero Section - "Start Selling on Showmyfit" - Moved Below Form */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              <div className="lg:w-1/2 mb-8 lg:mb-0">
                <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                  Start Selling on <span className="text-yellow-300">Showmyfit</span>
                </h1>
                <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                  Join thousands of successful sellers and grow your business with our powerful marketplace platform.
                  Reach millions of customers and boost your sales.
                </p>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center text-blue-100">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span>No setup fees</span>
                  </div>
                  <div className="flex items-center text-blue-100">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span>24/7 support</span>
                  </div>
                  <div className="flex items-center text-blue-100">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span>Fast approval</span>
                  </div>
                </div>
              </div>

              <div className="lg:w-1/2 lg:pl-12">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-6">Why Choose Showmyfit?</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <TrendingUp className="w-6 h-6 text-yellow-300 mr-3 mt-1" />
                      <div>
                        <h4 className="font-semibold mb-1">Boost Your Sales</h4>
                        <p className="text-blue-100 text-sm">Increase your revenue by up to 300%</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Users className="w-6 h-6 text-yellow-300 mr-3 mt-1" />
                      <div>
                        <h4 className="font-semibold mb-1">Reach More Customers</h4>
                        <p className="text-blue-100 text-sm">Access millions of active buyers</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Shield className="w-6 h-6 text-yellow-300 mr-3 mt-1" />
                      <div>
                        <h4 className="font-semibold mb-1">Secure Payments</h4>
                        <p className="text-blue-100 text-sm">Safe and reliable payment processing</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Headphones className="w-6 h-6 text-yellow-300 mr-3 mt-1" />
                      <div>
                        <h4 className="font-semibold mb-1">24/7 Support</h4>
                        <p className="text-blue-100 text-sm">Dedicated support team</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">Active Sellers</div>
                <div className="text-gray-600">Join our community</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">GMV Generated</div>
                <div className="text-gray-600">Help grow our platform</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">Happy Customers</div>
                <div className="text-gray-600">Serve our community</div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Need Help?</h2>
              <p className="text-gray-600 text-lg">Our team is here to help you get started</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-blue-50 rounded-xl">
                <Phone className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Call Us</h3>
                <p className="text-gray-600 mb-2">+91 98765 43210</p>
                <p className="text-sm text-gray-500">Mon-Fri, 9AM-6PM</p>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-xl">
                <Mail className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Us</h3>
                <p className="text-gray-600 mb-2">sellers@showmyfit.com</p>
                <p className="text-sm text-gray-500">24/7 Support</p>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-xl">
                <Headphones className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Live Chat</h3>
                <p className="text-gray-600 mb-2">Chat with us</p>
                <p className="text-sm text-gray-500">Instant Support</p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default BecomeSellerPage;
