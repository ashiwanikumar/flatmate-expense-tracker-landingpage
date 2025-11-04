'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cloudronAPI } from '@/lib/api';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';

interface Notification {
  id: string;
  eventId: string;
  title: string;
  message: string;
  creationTime: string;
  acknowledged: boolean;
}

export default function NotificationsPage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [server, setServer] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);
  const [filterAcknowledged, setFilterAcknowledged] = useState<'all' | 'acknowledged' | 'unacknowledged'>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    setUser(JSON.parse(userData));
    fetchServer();
    fetchNotifications();
  }, [page, filterAcknowledged]);

  const fetchServer = async () => {
    try {
      const response = await cloudronAPI.getServer(serverId);
      setServer(response.data.data);
    } catch (error: any) {
      console.error('Error fetching server:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch server');
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params: any = { page, per_page: perPage };

      if (filterAcknowledged === 'acknowledged') {
        params.acknowledged = true;
      } else if (filterAcknowledged === 'unacknowledged') {
        params.acknowledged = false;
      }

      const response = await cloudronAPI.getNotifications(serverId, params);
      setNotifications(response.data.data.notifications || []);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (notificationId: string, acknowledged: boolean) => {
    try {
      await cloudronAPI.updateNotification(serverId, notificationId, { acknowledged });
      toast.success(`Notification ${acknowledged ? 'acknowledged' : 'unacknowledged'}!`);
      fetchNotifications();
    } catch (error: any) {
      console.error('Error updating notification:', error);
      toast.error(error.response?.data?.message || 'Failed to update notification');
    }
  };

  const handleBulkAcknowledge = async () => {
    try {
      const unacknowledged = notifications.filter(n => !n.acknowledged);

      if (unacknowledged.length === 0) {
        toast.error('No unacknowledged notifications');
        return;
      }

      const promises = unacknowledged.map(n =>
        cloudronAPI.updateNotification(serverId, n.id, { acknowledged: true })
      );

      await Promise.all(promises);
      toast.success(`Acknowledged ${unacknowledged.length} notifications!`);
      fetchNotifications();
    } catch (error: any) {
      console.error('Error bulk acknowledging:', error);
      toast.error(error.response?.data?.message || 'Failed to acknowledge notifications');
    }
  };

  const handleViewDetail = async (notification: Notification) => {
    try {
      const response = await cloudronAPI.getNotification(serverId, notification.id);
      setSelectedNotification(response.data.data);
      setShowDetailModal(true);
    } catch (error: any) {
      console.error('Error fetching notification detail:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch notification detail');
    }
  };

  const getNotificationIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('app down') || lowerTitle.includes('error')) {
      return (
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      );
    } else if (lowerTitle.includes('update') || lowerTitle.includes('upgrade')) {
      return (
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
      );
    } else if (lowerTitle.includes('memory') || lowerTitle.includes('disk') || lowerTitle.includes('space')) {
      return (
        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    } else if (lowerTitle.includes('reboot')) {
      return (
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
      );
    }
  };

  const unacknowledgedCount = notifications.filter(n => !n.acknowledged).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} />
      <NavigationMenu />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link href="/cloudron-servers" className="hover:text-purple-600">
              Servers
            </Link>
            <span>/</span>
            <Link href={`/cloudron-servers/${serverId}`} className="hover:text-purple-600">
              {server?.domain || 'Server'}
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Notifications</span>
          </div>

          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {server?.domain} - {unacknowledgedCount} unacknowledged
                </p>
              </div>
              <div className="flex gap-3">
                {unacknowledgedCount > 0 && (
                  <button
                    onClick={handleBulkAcknowledge}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
                  >
                    Acknowledge All
                  </button>
                )}
                <button
                  onClick={fetchNotifications}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterAcknowledged('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterAcknowledged === 'all'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterAcknowledged('unacknowledged')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterAcknowledged === 'unacknowledged'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Unacknowledged
                </button>
                <button
                  onClick={() => setFilterAcknowledged('acknowledged')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterAcknowledged === 'acknowledged'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Acknowledged
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">No notifications found</p>
              <p className="text-gray-400 text-sm mt-1">
                {filterAcknowledged !== 'all' && 'Try changing the filter'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.acknowledged ? 'bg-purple-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {getNotificationIcon(notification.title)}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-semibold text-gray-900">
                                {notification.title}
                              </h3>
                              {!notification.acknowledged && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(notification.creationTime).toLocaleString()}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetail(notification)}
                              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              View
                            </button>
                            {!notification.acknowledged ? (
                              <button
                                onClick={() => handleAcknowledge(notification.id, true)}
                                className="px-3 py-1.5 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
                              >
                                Acknowledge
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAcknowledge(notification.id, false)}
                                className="px-3 py-1.5 text-sm bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                              >
                                Unacknowledge
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {page}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={notifications.length < perPage}
                    className="px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {getNotificationIcon(selectedNotification.title)}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedNotification.title}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(selectedNotification.creationTime).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Message</label>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedNotification.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Event ID</label>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded p-2 font-mono">
                    {selectedNotification.eventId}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedNotification.acknowledged
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {selectedNotification.acknowledged ? 'Acknowledged' : 'Unacknowledged'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                {!selectedNotification.acknowledged ? (
                  <button
                    onClick={() => {
                      handleAcknowledge(selectedNotification.id, true);
                      setShowDetailModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
                  >
                    Acknowledge
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleAcknowledge(selectedNotification.id, false);
                      setShowDetailModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Mark as Unacknowledged
                  </button>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
