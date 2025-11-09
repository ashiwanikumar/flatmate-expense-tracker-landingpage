'use client';

import { useState, useEffect } from 'react';
import { participationAPI, authAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NavigationMenu from '@/components/NavigationMenu';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  organizationRole?: string;
  expenseParticipation?: {
    isParticipating: boolean;
    lastUpdated?: string;
    updatedBy?: string;
  };
  createdAt: string;
}

export default function ParticipationPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
      } else {
        const response = await authAPI.getMe();
        setCurrentUser(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err);
      router.push('/auth/login');
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await participationAPI.getAll();
      setUsers(response.data.data.users || []);
      setIsOwner(response.data.data.isOwner || false);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleParticipation = async (userId: string, currentStatus: boolean) => {
    try {
      setUpdating(userId);
      const newStatus = !currentStatus;

      // Additional frontend check for owner deactivation
      if (isOwner && userId === currentUser?._id && !newStatus) {
        toast.error('Organization owner cannot deactivate their own participation');
        setUpdating(null);
        return;
      }

      await participationAPI.updateParticipation(userId, newStatus);

      // Update local state
      setUsers(users.map(user =>
        user._id === userId
          ? {
              ...user,
              expenseParticipation: {
                isParticipating: newStatus,
                lastUpdated: new Date().toISOString(),
                updatedBy: currentUser._id
              }
            }
          : user
      ));

      toast.success(`Participation ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update participation');
      console.error('Error updating participation:', err);
    } finally {
      setUpdating(null);
    }
  };

  const isAdmin = currentUser?.organizationRole === 'admin' || currentUser?.organizationRole === 'super_admin';
  const canManageAll = isAdmin || isOwner;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {currentUser && <Header user={currentUser} />}
        <NavigationMenu />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {currentUser && <Header user={currentUser} />}
      <NavigationMenu />
      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Expense Participation Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage which members participate in expense splitting
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900">How it works</h3>
              <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
                <li>Only <strong>participating members</strong> will be included in expense splits</li>
                <li>Members can activate/deactivate their own participation</li>
                <li>Owners and admins can manage participation for all members</li>
                <li>Inactive members won't appear in available users when creating expenses</li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => {
                  const isParticipating = user.expenseParticipation?.isParticipating ?? true;
                  const canModify = canManageAll || user._id === currentUser?._id;
                  const isCurrentUserOwner = isOwner && user._id === currentUser?._id;
                  const canDeactivateSelf = !isCurrentUserOwner; // Owner cannot deactivate themselves

                  return (
                    <tr key={user._id} className={isParticipating ? '' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.organizationRole === 'owner'
                            ? 'bg-purple-100 text-purple-800'
                            : user.organizationRole === 'admin'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.organizationRole || user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          isParticipating
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {isParticipating ? 'Participating' : 'Not Participating'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.expenseParticipation?.lastUpdated
                          ? new Date(user.expenseParticipation.lastUpdated).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {canModify ? (
                          isCurrentUserOwner && isParticipating ? (
                            <span className="text-gray-400 text-xs" title="Owner must remain participating">
                              Owner (Always Active)
                            </span>
                          ) : (
                            <button
                              onClick={() => handleToggleParticipation(user._id, isParticipating)}
                              disabled={updating === user._id}
                              className={`px-3 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                isParticipating
                                  ? 'bg-red-600 text-white hover:bg-red-700'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              {updating === user._id ? 'Updating...' : (isParticipating ? 'Deactivate' : 'Activate')}
                            </button>
                          )
                        ) : (
                          <span className="text-gray-400 text-xs">No permission</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No members found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by inviting members to your organization.</p>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Members</dt>
                    <dd className="text-lg font-semibold text-gray-900">{users.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Participating</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {users.filter(u => u.expenseParticipation?.isParticipating ?? true).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Not Participating</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {users.filter(u => u.expenseParticipation?.isParticipating === false).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
