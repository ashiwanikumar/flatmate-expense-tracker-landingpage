'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cloudronAPI } from '@/lib/api';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';

// Action filter options based on Cloudron API
const ACTION_FILTERS = [
  { value: 'app.clone', label: 'App Clone' },
  { value: 'app.configure', label: 'App Configure' },
  { value: 'app.repair', label: 'App Repair' },
  { value: 'app.install', label: 'App Install' },
  { value: 'app.restore', label: 'App Restore' },
  { value: 'app.import', label: 'App Import' },
  { value: 'app.uninstall', label: 'App Uninstall' },
  { value: 'app.update', label: 'App Update' },
  { value: 'app.update.finish', label: 'App Update Finish' },
  { value: 'app.backup', label: 'App Backup' },
  { value: 'app.backup.finish', label: 'App Backup Finish' },
  { value: 'app.login', label: 'App Login' },
  { value: 'app.oom', label: 'App OOM' },
  { value: 'app.up', label: 'App Up' },
  { value: 'app.down', label: 'App Down' },
  { value: 'app.start', label: 'App Start' },
  { value: 'app.stop', label: 'App Stop' },
  { value: 'app.restart', label: 'App Restart' },
  { value: 'backup.finish', label: 'Backup Finish' },
  { value: 'backup.start', label: 'Backup Start' },
  { value: 'backup.cleanup.finish', label: 'Backup Cleanup Finish' },
  { value: 'certificate.new', label: 'Certificate New' },
  { value: 'certificate.cleanup', label: 'Certificate Cleanup' },
  { value: 'cloudron.activate', label: 'Cloudron Activate' },
  { value: 'cloudron.provision', label: 'Cloudron Provision' },
  { value: 'cloudron.install.finish', label: 'Cloudron Install Finish' },
  { value: 'cloudron.start', label: 'Cloudron Start' },
  { value: 'dashboard.domain.update', label: 'Dashboard Domain Update' },
  { value: 'domain.add', label: 'Domain Add' },
  { value: 'domain.update', label: 'Domain Update' },
  { value: 'domain.remove', label: 'Domain Remove' },
  { value: 'dyndns.update', label: 'DynDNS Update' },
  { value: 'mail.location', label: 'Mail Location' },
  { value: 'mail.enabled', label: 'Mail Enabled' },
  { value: 'mail.disabled', label: 'Mail Disabled' },
  { value: 'mail.box.add', label: 'Mailbox Add' },
  { value: 'mail.box.remove', label: 'Mailbox Remove' },
  { value: 'mail.box.update', label: 'Mailbox Update' },
  { value: 'mail.list.add', label: 'Mail List Add' },
  { value: 'mail.list.remove', label: 'Mail List Remove' },
  { value: 'mail.list.update', label: 'Mail List Update' },
  { value: 'service.configure', label: 'Service Configure' },
  { value: 'service.rebuild', label: 'Service Rebuild' },
  { value: 'service.restart', label: 'Service Restart' },
  { value: 'cloudron.update', label: 'Cloudron Update' },
  { value: 'cloudron.update.finish', label: 'Cloudron Update Finish' },
  { value: 'user.add', label: 'User Add' },
  { value: 'user.login', label: 'User Login' },
  { value: 'user.login.ghost', label: 'User Ghost Login' },
  { value: 'user.logout', label: 'User Logout' },
  { value: 'user.remove', label: 'User Remove' },
  { value: 'user.update', label: 'User Update' },
  { value: 'volume.add', label: 'Volume Add' },
  { value: 'volume.update', label: 'Volume Update' },
  { value: 'volume.remount', label: 'Volume Remount' },
  { value: 'volume.remove', label: 'Volume Remove' },
  { value: 'support.ticket', label: 'Support Ticket' },
  { value: 'support.ssh', label: 'Support SSH' },
];

export default function EventlogsPage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [server, setServer] = useState<any>(null);
  const [eventlogs, setEventlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    setUser(JSON.parse(userData));
    fetchServerAndEventlogs();
  }, [page, perPage, search, selectedActions]);

  const fetchServerAndEventlogs = async () => {
    try {
      setLoading(true);

      // Fetch server info
      const serverRes = await cloudronAPI.getServer(serverId);
      setServer(serverRes.data.data);

      // Build query parameters
      const params: any = {
        page,
        per_page: perPage,
      };

      if (search) {
        params.search = search;
      }

      if (selectedActions.length > 0) {
        params.actions = selectedActions.join(',');
      }

      // Fetch eventlogs
      const eventlogsRes = await cloudronAPI.getEventlogs(serverId, params);
      setEventlogs(eventlogsRes.data.data.eventlogs || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch eventlogs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page on search
  };

  const handleActionToggle = (action: string) => {
    setSelectedActions(prev => {
      if (prev.includes(action)) {
        return prev.filter(a => a !== action);
      } else {
        return [...prev, action];
      }
    });
    setPage(1); // Reset to first page on filter change
  };

  const handleClearFilters = () => {
    setSelectedActions([]);
    setSearch('');
    setPage(1);
  };

  const handleViewEvent = async (eventId: string) => {
    try {
      const res = await cloudronAPI.getEventlog(serverId, eventId);
      setSelectedEvent(res.data.data);
      setShowEventModal(true);
    } catch (error: any) {
      console.error('Error fetching event:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch event details');
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('error') || action.includes('down') || action.includes('oom') || action.includes('remove')) {
      return 'bg-red-100 text-red-800';
    }
    if (action.includes('install') || action.includes('add') || action.includes('new') || action.includes('enabled')) {
      return 'bg-green-100 text-green-800';
    }
    if (action.includes('update') || action.includes('configure') || action.includes('restart')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (action.includes('backup') || action.includes('restore')) {
      return 'bg-purple-100 text-purple-800';
    }
    if (action.includes('login') || action.includes('logout')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

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
            <span className="text-gray-900">Eventlogs</span>
          </div>

          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Eventlogs</h1>
                <p className="text-sm text-gray-600 mt-1">
                  View server activity logs for {server?.domain}
                </p>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="border-t pt-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search eventlogs..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Filter by Actions ({selectedActions.length} selected)
                    </label>
                    {selectedActions.length > 0 && (
                      <button
                        onClick={handleClearFilters}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {ACTION_FILTERS.map((filter) => (
                      <label key={filter.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedActions.includes(filter.value)}
                          onChange={() => handleActionToggle(filter.value)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">{filter.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Items per page
                    </label>
                    <select
                      value={perPage}
                      onChange={(e) => {
                        setPerPage(Number(e.target.value));
                        setPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Eventlogs List */}
          <div className="bg-white rounded-lg shadow-sm">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
              </div>
            ) : eventlogs.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No eventlogs found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {search || selectedActions.length > 0
                    ? 'Try adjusting your filters'
                    : 'No events have been logged yet'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Source
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {eventlogs.map((event: any) => (
                        <tr key={event.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(event.creationTime).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getActionBadgeColor(
                                event.action
                              )}`}
                            >
                              {event.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {event.source?.username || event.source?.ip || 'System'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {event.data?.message || event.data?.error || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleViewEvent(event.id)}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page {page} ({perPage} items per page)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={eventlogs.length < perPage}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Event Detail Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Event Details</h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Event ID</label>
                  <p className="text-gray-900 font-mono text-sm">{selectedEvent.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Action</label>
                  <p className="text-gray-900">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getActionBadgeColor(
                        selectedEvent.action
                      )}`}
                    >
                      {selectedEvent.action}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Time</label>
                  <p className="text-gray-900">{new Date(selectedEvent.creationTime).toLocaleString()}</p>
                </div>
                {selectedEvent.source && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Source</label>
                    <pre className="mt-1 text-sm bg-gray-50 rounded-lg p-3 overflow-x-auto">
                      {JSON.stringify(selectedEvent.source, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedEvent.data && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Data</label>
                    <pre className="mt-1 text-sm bg-gray-50 rounded-lg p-3 overflow-x-auto">
                      {JSON.stringify(selectedEvent.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
