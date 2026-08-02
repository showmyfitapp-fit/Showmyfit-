'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import AdminReservedProducts from '@/components/admin/AdminReservedProducts';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

export default function Page() {
    const { currentUser, userData } = useAuth();
    const router = useRouter();

    if (!currentUser || userData?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 admin-content">
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                        <p className="text-gray-600 mb-6">You need admin access to view reserved products.</p>
                        <Button onClick={() => router.push('/profile')} variant="primary" size="lg">
                            Go to Profile
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 admin-content">
            <div className="main-content pt-24">
                <div className="min-h-screen px-4 py-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-6">Reserved Products Management</h1>
                            <AdminReservedProducts />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
