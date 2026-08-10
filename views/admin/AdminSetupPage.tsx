'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Key, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { addAdminEmail } from '@/firebase/adminSetup';

const AdminSetupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage('');

    try {
      await addAdminEmail(email);
      setMessage(`Admin email ${email} added successfully!`);
      setIsSuccess(true);
      setEmail('');
    } catch (error) {
      setMessage('Error adding admin email. Please try again.');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 admin-content">

      <div className="main-content pt-24">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Setup</h1>
                <p className="text-gray-600">Add admin email to enable admin features</p>
              </div>

              <form onSubmit={handleAddAdmin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Email
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="admin@showmyfit.com"
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
                  {loading ? 'Adding Admin...' : 'Add Admin Email'}
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
                <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Enter the email address you want to make admin</li>
                  <li>2. Click "Add Admin Email"</li>
                  <li>3. Sign up/sign in with that email</li>
                  <li>4. You'll see the admin profile automatically</li>
                </ol>
              </div>

              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="w-full"
                >
                  Back to Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSetupPage;
