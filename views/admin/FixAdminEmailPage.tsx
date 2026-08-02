'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Mail, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import { fixAdminEmail, addCorrectAdminEmail } from '@/firebase/fixAdminEmail';

const FixAdminEmailPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const navigate = (path: any) => router.push(path);

  const handleFixEmail = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Fix the existing document
      await fixAdminEmail();

      // Add the correct email as a new document
      await addCorrectAdminEmail();

      setMessage('Admin email fixed successfully! The correct email format has been added.');
      setIsSuccess(true);
    } catch (error) {
      setMessage('Error fixing admin email. Please try again.');
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
                  <Mail className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Fix Admin Email</h1>
                <p className="text-gray-600">Fix the email format mismatch</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Email Mismatch Detected:</p>
                    <p>Firebase: <code className="bg-yellow-100 px-1 rounded">vihaya.app@gmailcom</code></p>
                    <p>Website: <code className="bg-yellow-100 px-1 rounded">vihaya.app@gmail.com</code></p>
                    <p className="mt-2">The missing dot is preventing admin detection.</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleFixEmail}
                variant="primary"
                size="lg"
                className="w-full mb-6"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Fixing Email...
                  </>
                ) : (
                  'Fix Admin Email'
                )}
              </Button>

              {message && (
                <div className={`p-4 rounded-lg flex items-center ${isSuccess ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                  {isSuccess ? (
                    <CheckCircle className="w-5 h-5 mr-2" />
                  ) : (
                    <AlertCircle className="w-5 h-5 mr-2" />
                  )}
                  {message}
                </div>
              )}

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

export default FixAdminEmailPage;
