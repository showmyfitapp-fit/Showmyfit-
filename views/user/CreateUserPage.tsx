'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

const CreateUserPage: React.FC = () => {
  const { signUp } = useAuth();
  const router = useRouter();
  const navigate = (path: any) => router.push(path);
  const [formData, setFormData] = useState({
    email: 'showmyfitapp@gmail.com',
    password: 'password123',
    displayName: 'ShowMyFit Admin',
    phone: '+1234567890',
    address: 'Admin Address'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await signUp(formData.email, formData.password, formData.displayName, 'admin', formData.phone, formData.address);
      setMessage('User created successfully! You can now sign in.');
      setIsSuccess(true);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar userRole="user" />

      <div className="main-content pt-24">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Admin User</h1>
                <p className="text-gray-600">Create a user account for testing</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="admin@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter password"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Creating User...' : 'Create User Account'}
                </Button>
              </form>

              {message && (
                <div className={`mt-6 p-4 rounded-lg flex items-center ${isSuccess ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                  {isSuccess ? (
                    <CheckCircle className="w-5 h-5 mr-2" />
                  ) : (
                    <AlertCircle className="w-5 h-5 mr-2" />
                  )}
                  {message}
                </div>
              )}

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Steps to Test Admin:</h3>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Create user account (above)</li>
                  <li>2. Add email to admins collection</li>
                  <li>3. Sign in with the account</li>
                  <li>4. Check if admin profile shows</li>
                </ol>
              </div>

              <div className="mt-6 flex space-x-4">
                <Button
                  onClick={() => router.push('/admin/setup')}
                  variant="outline"
                  className="flex-1"
                >
                  Add Admin Email
                </Button>
                <Button
                  onClick={() => router.push('/auth')}
                  variant="outline"
                  className="flex-1"
                >
                  Go to Sign In
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateUserPage;
