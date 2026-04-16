'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Plus, Trash2, Save, RefreshCw } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

const ManageAdminsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Load admin emails from user profile
  const loadAdminEmails = async () => {
    if (!currentUser) {
      console.log('No current user, cannot load admin emails');
      return;
    }

    setLoading(true);
    try {
      console.log('Loading admin emails for user:', currentUser.uid);

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User data loaded:', {
          adminEmails: userData.adminEmails,
          role: userData.role
        });
        setAdminEmails(userData.adminEmails || []);
      } else {
        console.log('User document does not exist');
        setAdminEmails([]);
      }
    } catch (error: any) {
      console.error('Error loading admin emails:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        userId: currentUser?.uid
      });
      setMessage(`Error loading admin emails: ${error.message}`);
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminEmails();
  }, [currentUser]);

  const addAdminEmail = () => {
    if (newEmail.trim() && !adminEmails.includes(newEmail.trim())) {
      const updatedEmails = [...adminEmails, newEmail.trim()];
      setAdminEmails(updatedEmails);
      setNewEmail('');
      setMessage('Email added! Click "Save Admin Emails" to save changes.');
      setIsSuccess(true);
    } else if (adminEmails.includes(newEmail.trim())) {
      setMessage('This email is already in the list!');
      setIsSuccess(false);
    }
  };

  const removeAdminEmail = (emailToRemove: string) => {
    setAdminEmails(adminEmails.filter(email => email !== emailToRemove));
  };

  const saveAdminEmails = async () => {
    if (!currentUser) {
      setMessage('You must be logged in to save admin emails');
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    try {
      console.log('Saving admin emails:', {
        userId: currentUser.uid,
        emails: adminEmails
      });

      await setDoc(doc(db, 'users', currentUser.uid), {
        adminEmails: adminEmails,
        updatedAt: new Date()
      }, { merge: true });

      console.log('Admin emails saved successfully');
      setMessage('Admin emails saved successfully!');
      setIsSuccess(true);
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Error saving admin emails:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        userId: currentUser?.uid,
        emails: adminEmails
      });
      setMessage(`Error saving admin emails: ${error.message}`);
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
        <Navbar userRole="user" />
        <div className="main-content pt-24">
          <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
              <p className="text-gray-600 mb-6">You need to be signed in to manage admin emails.</p>
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 admin-content">
      <Navbar userRole="admin" />

      <div className="main-content pt-24">
        <div className="min-h-screen px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Manage Admin Emails</h1>
                <p className="text-gray-600">Add or remove admin emails from your profile</p>
              </div>

              {/* Add New Admin Email */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Plus className="w-6 h-6 mr-2 text-blue-600" />
                  Add Admin Email
                </h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Enter admin email (e.g., admin@example.com)"
                    />
                  </div>
                  <Button
                    onClick={addAdminEmail}
                    variant="primary"
                    disabled={!newEmail.trim() || adminEmails.includes(newEmail.trim())}
                    className="px-8 py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Email
                  </Button>
                </div>
              </div>

              {/* Current Admin Emails */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Mail className="w-6 h-6 mr-2 text-green-600" />
                  Current Admin Emails ({adminEmails.length})
                </h2>
                {adminEmails.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-lg">No admin emails added yet</p>
                    <p className="text-gray-400 text-sm">Add an email above to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {adminEmails.map((email, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl hover:shadow-md transition-all">
                        <div className="flex items-center">
                          <Mail className="w-5 h-5 text-green-600 mr-3" />
                          <span className="font-semibold text-gray-900 text-lg">{email}</span>
                        </div>
                        <Button
                          onClick={() => removeAdminEmail(email)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 px-4 py-2"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={saveAdminEmails}
                    variant="primary"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all text-lg"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        💾 Save Admin Emails
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={loadAdminEmails}
                    variant="outline"
                    disabled={loading}
                    className="px-6 py-4 border-2 border-gray-300 hover:border-gray-400 rounded-xl font-semibold"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    🔄 Refresh
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-3 text-center">
                  ⚠️ Remember to save your changes after adding/removing emails!
                </p>
              </div>

              {/* Message */}
              {message && (
                <div className={`p-6 rounded-xl border-2 flex items-center text-lg font-semibold ${isSuccess ? 'bg-green-50 text-green-800 border-green-300' : 'bg-red-50 text-red-800 border-red-300'
                  }`}>
                  {isSuccess ? '✅' : '❌'} {message}
                </div>
              )}

              {/* Instructions */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Add admin emails to your profile</li>
                  <li>2. Save the changes</li>
                  <li>3. When users with those emails sign in, they'll get admin access</li>
                  <li>4. Check your profile to see if admin detection works</li>
                </ol>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => router.push('/profile')}
                  variant="outline"
                  className="flex-1 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 hover:border-blue-400 py-4 px-6 rounded-xl font-bold text-lg"
                >
                  👤 Check Profile
                </Button>
                <Button
                  onClick={() => router.push('/admin/debug')}
                  variant="outline"
                  className="flex-1 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 hover:border-orange-400 py-4 px-6 rounded-xl font-bold text-lg"
                >
                  🔧 Debug Admin
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAdminsPage;
