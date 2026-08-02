'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Plus, Trash2, Save, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { listAdminEmails, saveAdminEmails } from '@/lib/supabase/admin';

const ManageAdminsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const loadAdminEmails = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const emails = await listAdminEmails();
      setAdminEmails(emails);
    } catch (error: any) {
      console.error('Error loading admin emails:', error);
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
    const email = newEmail.trim().toLowerCase();
    if (email && !adminEmails.includes(email)) {
      setAdminEmails([...adminEmails, email]);
      setNewEmail('');
      setMessage('Email added! Click "Save Admin Emails" to save changes.');
      setIsSuccess(true);
    } else if (adminEmails.includes(email)) {
      setMessage('This email is already in the list!');
      setIsSuccess(false);
    }
  };

  const removeAdminEmail = (emailToRemove: string) => {
    setAdminEmails(adminEmails.filter((email) => email !== emailToRemove));
  };

  const handleSave = async () => {
    if (!currentUser) {
      setMessage('You must be logged in to save admin emails');
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    try {
      await saveAdminEmails(adminEmails);
      setMessage('Admin emails saved successfully!');
      setIsSuccess(true);
      setTimeout(() => setMessage(''), 3000);
      await loadAdminEmails();
    } catch (error: any) {
      console.error('Error saving admin emails:', error);
      setMessage(`Error saving admin emails: ${error.message}`);
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="main-content pt-24">
          <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
              <Button onClick={() => router.push('/login')} variant="primary">
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
      <div className="main-content pt-24">
        <div className="min-h-screen px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center mb-6">
                <Shield className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Manage Admins</h1>
                  <p className="text-gray-600">Emails in the Supabase admins table get admin access</p>
                </div>
              </div>

              {message && (
                <div
                  className={`mb-6 p-4 rounded-lg ${
                    isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {message}
                </div>
              )}

              <div className="flex gap-3 mb-6">
                <div className="relative flex-1">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="admin@example.com"
                  />
                </div>
                <Button onClick={addAdminEmail} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
                <Button onClick={loadAdminEmails} variant="outline" disabled={loading}>
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              <div className="space-y-3 mb-6">
                {adminEmails.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No admin emails yet.</p>
                ) : (
                  adminEmails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium text-gray-900">{email}</span>
                      <button
                        onClick={() => removeAdminEmail(email)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <Button onClick={handleSave} variant="primary" className="w-full" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Admin Emails'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAdminsPage;
