'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Mail, CheckCircle, AlertCircle, RefreshCw, Database } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { getProfiles, listAdminEmails } from '@/lib/supabase/admin';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const DebugAdminPage: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const navigate = (path: any) => router.push(path);

  const runDebugCheck = async () => {
    if (!currentUser?.email) return;

    setLoading(true);
    try {
      console.log('=== DEBUG ADMIN CHECK ===');
      console.log('Current User Email:', currentUser.email);
      console.log('User Data Role:', userData?.role);

      const emails = await listAdminEmails();
      const allAdmins = emails.map((email) => ({ id: email, data: { email } }));
      const emailResults = allAdmins.filter(
        (admin) => admin.data.email === currentUser.email?.toLowerCase()
      );

      const { data: profile } = await getSupabaseBrowserClient()
        .from('profiles')
        .select('*')
        .or(`id.eq.${currentUser.uid},auth_user_id.eq.${currentUser.uid}`)
        .maybeSingle();

      setDebugInfo({
        currentUserEmail: currentUser.email,
        userDataRole: userData?.role,
        allAdminsCount: allAdmins.length,
        allAdmins,
        emailQueryCount: emailResults.length,
        emailQueryResults: emailResults,
        userDocExists: Boolean(profile),
        userDocData: profile,
        profilesCount: (await getProfiles()).length,
      });

    } catch (error: any) {
      console.error('Debug check error:', error);
      setDebugInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDebugCheck();
  }, [currentUser, userData]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="main-content pt-24">
          <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
              <p className="text-gray-600 mb-6">You need to be signed in to debug admin status.</p>
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
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Database className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Debug Admin Detection</h1>
                <p className="text-gray-600">Detailed debugging information</p>
              </div>

              <div className="mb-6">
                <Button
                  onClick={runDebugCheck}
                  variant="primary"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Running Debug Check...
                    </>
                  ) : (
                    'Run Debug Check'
                  )}
                </Button>
              </div>

              {debugInfo && (
                <div className="space-y-6">
                  {/* Current User Info */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Current User Info</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Email:</p>
                        <p className="font-medium">{debugInfo.currentUserEmail}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Role:</p>
                        <p className="font-medium">{debugInfo.userDataRole || 'Not set'}</p>
                      </div>
                    </div>
                  </div>

                  {/* All Admins */}
                  <div className="bg-blue-50 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">All Admins in Collection</h2>
                    <p className="text-sm text-gray-600 mb-3">Found {debugInfo.allAdminsCount} admin document(s)</p>
                    <div className="space-y-2">
                      {debugInfo.allAdmins?.map((admin: any, index: number) => (
                        <div key={index} className="bg-white p-3 rounded-lg">
                          <p className="text-sm font-medium">Document ID: {admin.id}</p>
                          <p className="text-sm text-gray-600">Email: {admin.data.email}</p>
                          <p className="text-sm text-gray-600">Role: {admin.data.role}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Email Query Results */}
                  <div className="bg-green-50 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Query Results</h2>
                    <p className="text-sm text-gray-600 mb-3">Query: where('email', '==', '{debugInfo.currentUserEmail}')</p>
                    <p className="text-sm text-gray-600 mb-3">Found {debugInfo.emailQueryCount} matching document(s)</p>
                    <div className="space-y-2">
                      {debugInfo.emailQueryResults?.map((result: any, index: number) => (
                        <div key={index} className="bg-white p-3 rounded-lg">
                          <p className="text-sm font-medium">Document ID: {result.id}</p>
                          <p className="text-sm text-gray-600">Email: {result.data.email}</p>
                          <p className="text-sm text-gray-600">Role: {result.data.role}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* User Document */}
                  <div className="bg-yellow-50 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">User Document</h2>
                    <p className="text-sm text-gray-600 mb-3">Document exists: {debugInfo.userDocExists ? 'Yes' : 'No'}</p>
                    {debugInfo.userDocData && (
                      <div className="bg-white p-3 rounded-lg">
                        <pre className="text-sm text-gray-800 overflow-auto">
                          {JSON.stringify(debugInfo.userDocData, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Error */}
                  {debugInfo.error && (
                    <div className="bg-red-50 rounded-xl p-6">
                      <h2 className="text-lg font-semibold text-red-900 mb-4">Error</h2>
                      <p className="text-red-800">{debugInfo.error}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 flex space-x-4">
                <Button
                  onClick={() => router.push('/profile')}
                  variant="outline"
                  className="flex-1"
                >
                  Go to Profile
                </Button>
                <Button
                  onClick={() => router.push('/admin/test')}
                  variant="outline"
                  className="flex-1"
                >
                  Admin Test Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugAdminPage;
