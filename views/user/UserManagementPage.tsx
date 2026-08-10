'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getProfiles, updateProfileStatus } from '@/lib/supabase/admin';
import {
  Users,
  Calendar,
  Phone,
  MapPin,
  Shield,
  UserCheck,
  UserX,
  Eye,
  AlertCircle,
  TrendingUp,
  ShoppingBag
} from 'lucide-react';
import Button from '@/components/ui/Button';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'user' | 'shop' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  lastLoginAt?: Date;
  stats: {
    totalOrders: number;
    totalSpent: number;
    totalReviews: number;
  };
}

const UserManagementPage: React.FC = () => {
  const router = useRouter();
  const { currentUser, userData } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm] = useState('');
  const [filterRole] = useState('all');
  const [filterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Load users
  const loadUsers = async () => {
    setLoading(true);
    try {
      const profiles = await getProfiles();
      const usersData = profiles.map((profile) => ({
        id: profile.id,
        name: profile.displayName || 'Unknown User',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        role: (profile.role || 'user') as User['role'],
        status: (profile.status || 'active') as User['status'],
        createdAt:
          profile.createdAt instanceof Date
            ? profile.createdAt
            : new Date(profile.createdAt || Date.now()),
        lastLoginAt: profile.lastLoginAt
          ? profile.lastLoginAt instanceof Date
            ? profile.lastLoginAt
            : new Date(profile.lastLoginAt)
          : undefined,
        stats: {
          totalOrders: profile.stats?.totalOrders || 0,
          totalSpent: profile.stats?.totalSpent || 0,
          totalReviews: profile.stats?.totalReviews || 0,
        },
      })) as User[];
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage('Error loading users');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && userData?.role === 'admin') {
      loadUsers();
    }
  }, [currentUser, userData]);

  // Check if user is admin
  if (!currentUser || userData?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 admin-content">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">You need admin access to manage users.</p>
            <Button onClick={() => router.push('/profile')} variant="primary" size="lg">
              Go to Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Update user status
  const updateUserStatus = async (userId: string, status: 'active' | 'inactive' | 'suspended') => {
    try {
      await updateProfileStatus(userId, status);
      setUsers(users.map(user =>
        user.id === userId ? { ...user, status } : user
      ));
      setMessage(`User ${status} successfully!`);
      setIsSuccess(true);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating user status:', error);
      setMessage('Error updating user status');
      setIsSuccess(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'shop': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'shop': return <ShoppingBag className="w-4 h-4" />;
      case 'user': return <Users className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 admin-content">

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Users className="w-8 h-8 mr-3 text-red-600" />
                User Management
              </h1>
              <p className="text-gray-600 mt-2">Manage user accounts and permissions</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-gray-900">{users.length}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">
                  {users.filter(u => u.role === 'shop').length}
                </div>
                <div className="text-sm text-gray-600">Sellers</div>
              </div>
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

        {/* Users List */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">No users match your search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                              {(user.name || 'U').charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name || 'Unknown User'}</div>
                            <div className="text-sm text-gray-500">{user.email || 'No email'}</div>
                            {user.phone && (
                              <div className="text-sm text-gray-500 flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          <span className="ml-1">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Joined: {user.createdAt.toLocaleDateString()}
                        </div>
                        {user.lastLoginAt && (
                          <div className="text-xs text-gray-400">
                            Last login: {user.lastLoginAt.toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                            ₹{user.stats.totalSpent.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.stats.totalOrders} orders • {user.stats.totalReviews} reviews
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => setSelectedUser(user)}
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {user.role !== 'admin' && (
                            <>
                              {user.status === 'active' ? (
                                <Button
                                  onClick={() => updateUserStatus(user.id, 'suspended')}
                                  variant="danger"
                                  size="sm"
                                >
                                  <UserX className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => updateUserStatus(user.id, 'active')}
                                  variant="primary"
                                  size="sm"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
                  <Button
                    onClick={() => setSelectedUser(null)}
                    variant="outline"
                    size="sm"
                  >
                    <UserX className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Personal Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <p className="text-gray-900">{selectedUser.name || 'Unknown User'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="text-gray-900">{selectedUser.email || 'No email'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <p className="text-gray-900">{selectedUser.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                          {getRoleIcon(selectedUser.role)}
                          <span className="ml-1">{selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}</span>
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedUser.status)}`}>
                          {selectedUser.status.charAt(0).toUpperCase() + selectedUser.status.slice(1)}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Joined</label>
                        <p className="text-gray-900">{selectedUser.createdAt.toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  {selectedUser.address && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-1" />
                        <p className="text-gray-900">{selectedUser.address}</p>
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Stats</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900">{selectedUser.stats.totalOrders}</div>
                        <div className="text-sm text-gray-600">Orders</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900">₹{selectedUser.stats.totalSpent.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Total Spent</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900">{selectedUser.stats.totalReviews}</div>
                        <div className="text-sm text-gray-600">Reviews</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {selectedUser.role !== 'admin' && (
                    <div className="flex space-x-4">
                      {selectedUser.status === 'active' ? (
                        <Button
                          onClick={() => {
                            updateUserStatus(selectedUser.id, 'suspended');
                            setSelectedUser(null);
                          }}
                          variant="danger"
                          className="flex-1"
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Suspend User
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            updateUserStatus(selectedUser.id, 'active');
                            setSelectedUser(null);
                          }}
                          variant="primary"
                          className="flex-1"
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          Activate User
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;
