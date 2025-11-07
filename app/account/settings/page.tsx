'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { accountDeletionAPI, authAPI, organizationAPI } from '@/lib/api';
import LayoutWrapper from '@/components/LayoutWrapper';

interface DeletionStatus {
  hasDeletionRequest: boolean;
  isScheduledForDeletion: boolean;
  deletionRequest?: {
    status: string;
    requestedAt: string;
    scheduledDeletionAt: string;
    daysRemaining: number;
    canRecover: boolean;
    deletionReason?: string;
    deletionReasonText?: string;
  };
}

interface Organization {
  _id: string;
  name: string;
  type: string;
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  members: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
    };
    role: string;
    joinedAt: string;
  }>;
  settings: {
    currency: string;
    timezone: string;
  };
  createdAt: string;
}

export default function AccountSettings() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState('other');
  const [deletionReasonText, setDeletionReasonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Organization name editing
  const [isEditingOrgName, setIsEditingOrgName] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [orgUpdateLoading, setOrgUpdateLoading] = useState(false);

  // Countdown timer state
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    fetchUserData();
    fetchDeletionStatus();
    fetchOrganization();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!deletionStatus?.isScheduledForDeletion || !deletionStatus.deletionRequest?.scheduledDeletionAt) {
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const deletionTime = new Date(deletionStatus.deletionRequest!.scheduledDeletionAt).getTime();
      const distance = deletionTime - now;

      if (distance < 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [deletionStatus]);

  const fetchUserData = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.data);
    } catch (error: any) {
      console.error('Error fetching user:', error);
      if (error.response?.status === 401) {
        router.push('/auth/login');
      }
    }
  };

  const fetchOrganization = async () => {
    try {
      const response = await organizationAPI.getMyOrganization();
      setOrganization(response.data.data);

      // Get current user's role
      const currentUser = response.data.data.members.find(
        (m: any) => m.user._id === response.data.data.owner._id || m.user.email === user?.email
      );
      if (currentUser) {
        setUserRole(currentUser.role);
      }
    } catch (error: any) {
      console.error('Error fetching organization:', error);
      // Don't show error if user doesn't have an organization
      if (error.response?.status !== 404) {
        setMessage({
          type: 'error',
          text: 'Failed to load organization information',
        });
      }
    }
  };

  const fetchDeletionStatus = async () => {
    try {
      const response = await accountDeletionAPI.getDeletionStatus();
      setDeletionStatus(response.data.data);
    } catch (error) {
      console.error('Error fetching deletion status:', error);
    }
  };

  const handleRequestDeletion = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      await accountDeletionAPI.requestDeletion({
        deletionReason,
        deletionReasonText: deletionReasonText.trim() || undefined,
      });

      setMessage({
        type: 'success',
        text: 'Account deletion scheduled. You have 30 days to recover your account.',
      });
      setShowDeleteModal(false);
      setDeletionReason('other');
      setDeletionReasonText('');
      await fetchDeletionStatus();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to request account deletion',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!confirm('Are you sure you want to cancel the account deletion?')) {
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      await accountDeletionAPI.cancelDeletion();

      setMessage({
        type: 'success',
        text: 'Account deletion cancelled successfully!',
      });
      await fetchDeletionStatus();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to cancel account deletion',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartEditOrgName = () => {
    setNewOrgName(organization?.name || '');
    setIsEditingOrgName(true);
  };

  const handleCancelEditOrgName = () => {
    setIsEditingOrgName(false);
    setNewOrgName('');
  };

  const handleUpdateOrgName = async () => {
    if (!newOrgName.trim()) {
      setMessage({
        type: 'error',
        text: 'Organization name cannot be empty',
      });
      return;
    }

    if (newOrgName.trim() === organization?.name) {
      setIsEditingOrgName(false);
      return;
    }

    try {
      setOrgUpdateLoading(true);
      setMessage({ type: '', text: '' });

      await organizationAPI.updateOrganization({
        name: newOrgName.trim(),
      });

      setMessage({
        type: 'success',
        text: 'Organization name updated successfully!',
      });
      setIsEditingOrgName(false);
      await fetchOrganization();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update organization name',
      });
    } finally {
      setOrgUpdateLoading(false);
    }
  };

  const canEditOrganization = userRole === 'owner' || userRole === 'admin';

  return (
    <LayoutWrapper user={user}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-4 sm:py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Account Settings</h1>
            <p className="text-xs sm:text-sm text-gray-600">Manage your account and organization preferences</p>
          </div>

          {/* Messages */}
          {message.text && (
            <div
              className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Organization Info */}
          {organization && (
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h2 className="text-base sm:text-xl font-semibold text-gray-900">Organization Information</h2>
                {canEditOrganization && !isEditingOrgName && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded self-start">
                    {userRole === 'owner' ? 'Owner' : 'Admin'}
                  </span>
                )}
              </div>

              <div className="space-y-3 text-sm sm:text-base text-gray-900">
                <div>
                  <span className="text-gray-600 text-xs sm:text-sm">Organization Name:</span>
                  {isEditingOrgName ? (
                    <div className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                        maxLength={100}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        placeholder="Enter organization name"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateOrgName}
                          disabled={orgUpdateLoading}
                          className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {orgUpdateLoading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancelEditOrgName}
                          disabled={orgUpdateLoading}
                          className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center justify-between">
                      <span className="ml-2 font-medium text-gray-900 text-sm sm:text-base">{organization.name}</span>
                      {canEditOrganization && (
                        <button
                          onClick={handleStartEditOrgName}
                          className="text-purple-600 hover:text-purple-700 text-xs sm:text-sm font-medium flex items-center gap-1"
                        >
                          <svg
                            className="w-3 h-3 sm:w-4 sm:h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-gray-600 text-xs sm:text-sm">Organization Type:</span>
                  <span className="ml-2 font-medium text-gray-900 capitalize text-sm sm:text-base">{organization.type}</span>
                </div>

                <div className="break-words">
                  <span className="text-gray-600 text-xs sm:text-sm">Owner:</span>
                  <span className="ml-2 font-medium text-gray-900 text-sm sm:text-base">{organization.owner.name}</span>
                  <span className="ml-1 text-xs sm:text-sm text-gray-600">({organization.owner.email})</span>
                </div>

                <div>
                  <span className="text-gray-600 text-xs sm:text-sm">Total Members:</span>
                  <span className="ml-2 font-medium text-gray-900 text-sm sm:text-base">{organization.members.length}</span>
                </div>

                <div>
                  <span className="text-gray-600 text-xs sm:text-sm">Created:</span>
                  <span className="ml-2 font-medium text-gray-900 text-sm sm:text-base">
                    {new Date(organization.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {!canEditOrganization && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-800">
                    ℹ️ Only organization owners and admins can edit organization details.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Account Info */}
          {user && (
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
              <h2 className="text-base sm:text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
              <div className="space-y-3 text-gray-900">
                <div className="break-words">
                  <span className="text-gray-600 text-xs sm:text-sm">Name:</span>
                  <span className="ml-2 font-medium text-gray-900 text-sm sm:text-base">{user.name}</span>
                </div>
                <div className="break-words">
                  <span className="text-gray-600 text-xs sm:text-sm">Email:</span>
                  <span className="ml-2 font-medium text-gray-900 text-sm sm:text-base">{user.email}</span>
                </div>
                <div>
                  <span className="text-gray-600 text-xs sm:text-sm">Account Status:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-xs sm:text-sm font-medium ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Deletion Status Card */}
          {deletionStatus?.isScheduledForDeletion && (
            <div className="bg-gradient-to-br from-red-50 via-red-50 to-orange-50 border-2 border-red-300 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="text-center mb-4 sm:mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full mb-3 sm:mb-4">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-red-900 mb-2">
                  ⚠️ Account Deletion Scheduled
                </h3>
                <p className="text-red-800 text-sm sm:text-base lg:text-lg">
                  Your account will be permanently deleted in:
                </p>
              </div>

              {/* Countdown Timer */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
                {/* Days */}
                <div className="bg-white rounded-lg shadow-md p-2 sm:p-3 lg:p-4 text-center border-2 border-red-200">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600 mb-1">
                    {countdown.days}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-gray-600 uppercase">
                    Days
                  </div>
                </div>

                {/* Hours */}
                <div className="bg-white rounded-lg shadow-md p-2 sm:p-3 lg:p-4 text-center border-2 border-orange-200">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-600 mb-1">
                    {countdown.hours.toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-gray-600 uppercase">
                    Hours
                  </div>
                </div>

                {/* Minutes */}
                <div className="bg-white rounded-lg shadow-md p-2 sm:p-3 lg:p-4 text-center border-2 border-yellow-200">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-yellow-600 mb-1">
                    {countdown.minutes.toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-gray-600 uppercase">
                    Minutes
                  </div>
                </div>

                {/* Seconds */}
                <div className="bg-white rounded-lg shadow-md p-2 sm:p-3 lg:p-4 text-center border-2 border-amber-200">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-600 mb-1">
                    {countdown.seconds.toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-gray-600 uppercase">
                    Seconds
                  </div>
                </div>
              </div>

              {/* Deletion Date */}
              <div className="bg-white border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Scheduled Deletion Date</p>
                  <p className="text-sm sm:text-base lg:text-lg font-bold text-red-900">
                    {new Date(
                      deletionStatus.deletionRequest?.scheduledDeletionAt || ''
                    ).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* Warning Message */}
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm text-yellow-800 text-center">
                  ⚡ <strong>Important:</strong> After the countdown reaches zero, all your data will be permanently deleted and cannot be recovered!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 justify-center">
                <button
                  onClick={handleCancelDeletion}
                  disabled={loading}
                  className="w-full px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold text-sm sm:text-base lg:text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : '↩️ Cancel Deletion & Keep Account'}
                </button>
                <button
                  onClick={() => router.push('/account/recover')}
                  className="w-full px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-white text-green-700 border-2 border-green-600 rounded-lg font-bold text-sm sm:text-base lg:text-lg hover:bg-green-50 transition-all shadow-md hover:shadow-lg"
                >
                  📋 View Recovery Details
                </button>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-red-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-xl font-semibold text-red-900 mb-4 flex items-center">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Danger Zone
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              Once you delete your account, there is no going back after 30 days. Please be
              certain.
            </p>

            {!deletionStatus?.isScheduledForDeletion && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Delete My Account
              </button>
            )}
          </div>
        </div>

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Delete Account</h3>
              <div className="mb-6">
                <p className="text-xs sm:text-sm text-gray-600 mb-4">
                  Are you sure you want to delete your account? This will:
                </p>
                <ul className="list-disc pl-5 text-xs sm:text-sm text-gray-700 space-y-2 mb-4">
                  <li>Schedule your account for deletion in 30 days</li>
                  <li>Allow you to recover within 30 days</li>
                  <li>Permanently delete all your data after 30 days</li>
                  <li>Remove your profile and personal information</li>
                </ul>

                <div className="mb-4">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Reason for leaving (optional)
                  </label>
                  <select
                    value={deletionReason}
                    onChange={(e) => setDeletionReason(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  >
                    <option value="no_longer_needed">No longer needed</option>
                    <option value="switching_service">Switching to another service</option>
                    <option value="privacy_concerns">Privacy concerns</option>
                    <option value="too_expensive">Too expensive</option>
                    <option value="technical_issues">Technical issues</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Additional feedback (optional)
                  </label>
                  <textarea
                    value={deletionReasonText}
                    onChange={(e) => setDeletionReasonText(e.target.value)}
                    placeholder="Tell us more about your decision..."
                    rows={3}
                    maxLength={500}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {deletionReasonText.length}/500 characters
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletionReason('other');
                    setDeletionReasonText('');
                  }}
                  disabled={loading}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestDeletion}
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
