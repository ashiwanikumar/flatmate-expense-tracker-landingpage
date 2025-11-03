'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { activityLogAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Footer from '@/components/Footer';
import LoadingModal from '@/components/LoadingModal';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';

export default function ActivityLogsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchActivityLogs();
  }, [pagination.page]);

  const fetchActivityLogs = async () => {
    try {
      const response = await activityLogAPI.getMyActivity({
        page: pagination.page,
        limit: pagination.limit
      });
      setLogs(response.data.data);
      setPagination(response.data.pagination);
    } catch (error: any) {
      console.error('Error fetching activity logs:', error);
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await activityLogAPI.exportCSV();

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Activity logs exported successfully! Check your email for confirmation.');
    } catch (error: any) {
      console.error('Error exporting activity logs:', error);
      toast.error('Failed to export activity logs');
    } finally {
      setExporting(false);
    }
  };


  const getActionBadgeColor = (action: string) => {
    const colors: any = {
      'login': 'bg-green-100 text-green-800',
      'logout': 'bg-gray-100 text-gray-800',
      'campaign_created': 'bg-blue-100 text-blue-800',
      'campaign_cancelled': 'bg-red-100 text-red-800',
      'campaign_paused': 'bg-yellow-100 text-yellow-800',
      'campaign_resumed': 'bg-green-100 text-green-800',
      'campaign_rescheduled': 'bg-purple-100 text-purple-800',
      'csv_uploaded': 'bg-indigo-100 text-indigo-800',
      'company_account_created': 'bg-teal-100 text-teal-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const getActionIcon = (action: string) => {
    const icons: any = {
      'login': '🔓',
      'logout': '🔒',
      'campaign_created': '🚀',
      'campaign_cancelled': '❌',
      'campaign_paused': '⏸️',
      'campaign_resumed': '▶️',
      'campaign_rescheduled': '📅',
      'csv_uploaded': '📄',
      'company_account_created': '🏢',
    };
    return icons[action] || '📋';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'rgb(12, 190, 225)', boxShadow: 'rgb(12, 190, 225) 0px 0px 4px 0px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white font-semibold text-sm sm:text-base">Loading activity logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      <Header user={user} />
      <NavigationMenu />

      {/* Main Content */}
      <main className="flex-grow px-4 sm:px-6 lg:px-8 py-4 sm:py-8 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Activity Logs</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="text-xs sm:text-sm text-gray-600">
              Total: {pagination.total} activities
            </div>
            <button
              onClick={handleExportCSV}
              disabled={logs.length === 0}
              className="px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-xs sm:text-sm w-full sm:w-auto justify-center"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export to CSV
            </button>
          </div>
        </div>

        {/* Activity Logs */}
        {logs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 sm:p-12 text-center">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-sm sm:text-base">No activity logs found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Desktop Table View - Hidden on Mobile */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      City
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      State
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country Code
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                          <span>{getActionIcon(log.action)}</span>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-xs sm:text-sm text-gray-900">
                        {log.description || '-'}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {log.ipAddress || '-'}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {log.location?.city || '-'}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {log.location?.region || '-'}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {log.location?.country || '-'}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {log.location?.countryCode || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View - Visible Only on Mobile/Tablet */}
            <div className="md:hidden divide-y divide-gray-200">
              {logs.map((log) => (
                <div key={log._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                      <span>{getActionIcon(log.action)}</span>
                      <span className="capitalize">{log.action.replace(/_/g, ' ')}</span>
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <span className="text-xs font-medium text-gray-500 min-w-20">Time:</span>
                      <span className="text-xs text-gray-900">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                    {log.description && (
                      <div className="flex items-start">
                        <span className="text-xs font-medium text-gray-500 min-w-20">Details:</span>
                        <span className="text-xs text-gray-900 flex-1">{log.description}</span>
                      </div>
                    )}
                    {log.ipAddress && (
                      <div className="flex items-start">
                        <span className="text-xs font-medium text-gray-500 min-w-20">IP:</span>
                        <span className="text-xs text-gray-500">{log.ipAddress}</span>
                      </div>
                    )}
                    {log.location?.city && (
                      <div className="flex items-start">
                        <span className="text-xs font-medium text-gray-500 min-w-20">City:</span>
                        <span className="text-xs text-gray-500">{log.location.city}</span>
                      </div>
                    )}
                    {log.location?.region && (
                      <div className="flex items-start">
                        <span className="text-xs font-medium text-gray-500 min-w-20">State:</span>
                        <span className="text-xs text-gray-500">{log.location.region}</span>
                      </div>
                    )}
                    {log.location?.country && (
                      <div className="flex items-start">
                        <span className="text-xs font-medium text-gray-500 min-w-20">Country:</span>
                        <span className="text-xs text-gray-500">{log.location.country}</span>
                      </div>
                    )}
                    {log.location?.countryCode && (
                      <div className="flex items-start">
                        <span className="text-xs font-medium text-gray-500 min-w-20">Code:</span>
                        <span className="text-xs text-gray-500">{log.location.countryCode}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white px-3 sm:px-4 py-3 border-t border-gray-200">
                {/* Mobile Pagination */}
                <div className="flex flex-col sm:hidden gap-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-700">
                      Page <span className="font-medium">{pagination.page}</span> of{' '}
                      <span className="font-medium">{pagination.pages}</span>
                    </p>
                  </div>
                  <div className="flex justify-between gap-2">
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={pagination.page === pagination.pages}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>

                {/* Desktop Pagination */}
                <div className="hidden sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-700">
                      Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        ‹
                      </button>
                      {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setPagination({ ...pagination, page })}
                          className={`relative inline-flex items-center px-3 sm:px-4 py-2 border text-xs sm:text-sm font-medium ${
                            page === pagination.page
                              ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                        disabled={pagination.page === pagination.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        ›
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />

      {/* Loading Modal */}
      <LoadingModal
        isOpen={exporting}
        title="Exporting Activity Logs"
        subtitle="Preparing your CSV file and sending email notification..."
      />
    </div>
  );
}
