'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { listAdminEmails } from '@/lib/supabase/admin';

const AdminTestPage: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const [adminCheck, setAdminCheck] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const navigate = (path: any) => router.push(path);

  const checkAdminStatus = async () => {
    if (!currentUser?.email) return;

    setLoading(true);
    try {
      console.log('Checking admin status for:', currentUser.email);

      const emails = await listAdminEmails();
      const adminExists = emails.includes(currentUser.email.toLowerCase());

      setAdminCheck({
        email: currentUser.email,
        adminExists,
        userRole: userData?.role,
        adminData: adminExists ? { email: currentUser.email } : null
      });
    } catch (error: any) {
      console.error('Error checking admin status:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        email: currentUser?.email
      });
      setAdminCheck({
        error: `Failed to check admin status: ${error.message}`,
        email: currentUser?.email || 'Unknown'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, [currentUser, userData]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="main-content pt-24">
          <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
              <p className="text-gray-600 mb-6">You need to be signed in to check admin status.</p>
              <Button onClick={() => router.push('/auth')} variant="primary" size="lg">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">

      <div className="main-content pt-24">
        <div className="min-h-screen px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Status Check</h1>
                <p className="text-gray-600">Debug admin detection for current user</p>
              </div>

              {/* Current User Info */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Current User Info</h2>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{currentUser.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Role:</span>
                    <span className="ml-2 font-medium">{userData?.role || 'Not set'}</span>
                  </div>
                </div>
              </div>

              {/* Admin Check Results */}
              {adminCheck && (
                <div className="bg-white border rounded-xl p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Check Results</h2>

                  {adminCheck.error ? (
                    <div className="flex items-center text-red-600">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      {adminCheck.error}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="font-medium">Email in admins collection:</span>
                        <div className="flex items-center">
                          {adminCheck.adminExists ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                          )}
                          <span className={adminCheck.adminExists ? 'text-green-600' : 'text-red-600'}>
                            {adminCheck.adminExists ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="font-medium">User role in database:</span>
                        <span className="font-medium">{adminCheck.userRole || 'Not set'}</span>
                      </div>

                      {adminCheck.adminData && (
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h3 className="font-semibold text-green-900 mb-2">Admin Data:</h3>
                          <pre className="text-sm text-green-800 overflow-auto">
                            {JSON.stringify(adminCheck.adminData, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-4">
                <Button
                  onClick={checkAdminStatus}
                  variant="primary"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    'Refresh Check'
                  )}
                </Button>

                <Button
                  onClick={() => router.push('/profile')}
                  variant="outline"
                  className="flex-1"
                >
                  Go to Profile
                </Button>
              </div>

              {/* Instructions */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">How Admin Detection Works:</h3>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. User signs in with email</li>
                  <li>2. System checks if email exists in 'admins' collection</li>
                  <li>3. If found, user role is set to 'admin'</li>
                  <li>4. Profile page shows admin interface</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTestPage;
