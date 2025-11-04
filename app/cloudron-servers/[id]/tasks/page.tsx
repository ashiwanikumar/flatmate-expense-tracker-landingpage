'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cloudronAPI } from '@/lib/api';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';
import Footer from '@/components/Footer';

const TASK_TYPES = [
  { value: 'all', label: 'All Tasks' },
  { value: 'app', label: 'App' },
  { value: 'backup', label: 'Backup' },
  { value: 'update', label: 'Update' },
  { value: 'checkCerts', label: 'Check Certificates' },
  { value: 'syncDyndns', label: 'Sync DynDNS' },
  { value: 'prepareDashboardLocation', label: 'Prepare Dashboard' },
  { value: 'cleanBackups', label: 'Clean Backups' },
  { value: 'syncExternalLdap', label: 'Sync LDAP' },
  { value: 'changeMailLocation', label: 'Change Mail Location' },
  { value: 'syncDnsRecords', label: 'Sync DNS Records' },
  { value: 'updateDiskUsage', label: 'Update Disk Usage' },
];

export default function TasksPage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [server, setServer] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [taskLogs, setTaskLogs] = useState<any>(null);

  // Filters
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    setUser(JSON.parse(userData));
    fetchData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchTasks();
      }, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, currentPage, perPage, filterType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [serverRes] = await Promise.allSettled([
        cloudronAPI.getServer(serverId),
      ]);

      if (serverRes.status === 'fulfilled') {
        setServer(serverRes.value.data.data);
      }

      await fetchTasks();
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const params: any = { page: currentPage, per_page: perPage };
      if (filterType !== 'all') {
        params.type = filterType;
      }

      const response = await cloudronAPI.getTasks(serverId, params);
      setTasks(response.data.data.tasks || []);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      // Don't show error toast on auto-refresh failures
      if (!autoRefresh) {
        toast.error(error.response?.data?.message || 'Failed to fetch tasks');
      }
    }
  };

  const handleViewDetails = async (task: any) => {
    try {
      const response = await cloudronAPI.getTask(serverId, task.id);
      setSelectedTask(response.data.data);
      setShowDetailsModal(true);
    } catch (error: any) {
      console.error('Error fetching task details:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch task details');
    }
  };

  const handleViewLogs = async (task: any) => {
    try {
      const response = await cloudronAPI.getTaskLogs(serverId, task.id, { lines: 100, format: 'short' });
      setTaskLogs(response.data.data);
      setSelectedTask(task);
      setShowLogsModal(true);
    } catch (error: any) {
      console.error('Error fetching task logs:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch task logs');
    }
  };

  const handleStopTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to stop this task?')) {
      return;
    }

    try {
      await cloudronAPI.stopTask(serverId, taskId);
      toast.success('Task stopped successfully!');
      fetchTasks();
    } catch (error: any) {
      console.error('Error stopping task:', error);
      toast.error(error.response?.data?.message || 'Failed to stop task');
    }
  };

  const getTaskStatusBadge = (task: any) => {
    if (task.success) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Success</span>;
    } else if (task.error) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Error</span>;
    } else if (task.active) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Active</span>;
    } else if (task.pending) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Unknown</span>;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
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
            <span className="text-gray-900 font-medium">Tasks</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tasks</h1>
                    <p className="text-sm text-gray-600 mt-1">Manage and monitor background tasks</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={autoRefresh}
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      Auto-refresh
                    </label>
                    <button
                      onClick={() => fetchTasks()}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 font-medium"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="mt-4 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
                    <select
                      value={filterType}
                      onChange={(e) => {
                        setFilterType(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {TASK_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-32">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Per Page</label>
                    <select
                      value={perPage}
                      onChange={(e) => {
                        setPerPage(parseInt(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tasks List */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {tasks.length === 0 ? (
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
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
                    <p className="mt-1 text-sm text-gray-500">No tasks match your current filters.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Task ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Progress
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Message
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tasks.map((task) => (
                          <tr key={task.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {task.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                {task.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {getTaskStatusBadge(task)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                                  <div
                                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${task.percent || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-600">{task.percent || 0}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                              {task.message || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(task.creationTime)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleViewDetails(task)}
                                  className="text-purple-600 hover:text-purple-900"
                                  title="View Details"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleViewLogs(task)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="View Logs"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </button>
                                {(task.active || task.pending) && (
                                  <button
                                    onClick={() => handleStopTask(task.id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Stop Task"
                                  >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {tasks.length > 0 && (
                  <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                    <div className="text-sm text-gray-700">
                      Showing page {currentPage}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => p + 1)}
                        disabled={tasks.length < perPage}
                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Task Details Modal */}
      {showDetailsModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Task Details</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedTask(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Task ID</label>
                  <p className="font-medium text-gray-900">{selectedTask.id}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Type</label>
                  <p className="font-medium text-gray-900">{selectedTask.type}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Status</label>
                  <div className="mt-1">{getTaskStatusBadge(selectedTask)}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Progress</label>
                  <p className="font-medium text-gray-900">{selectedTask.percent || 0}%</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Created At</label>
                  <p className="font-medium text-gray-900">{formatDate(selectedTask.creationTime)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Timestamp</label>
                  <p className="font-medium text-gray-900">{formatDate(selectedTask.ts)}</p>
                </div>
              </div>

              {selectedTask.message && (
                <div>
                  <label className="text-sm text-gray-600">Message</label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm text-gray-900">{selectedTask.message}</p>
                </div>
              )}

              {selectedTask.error && (
                <div>
                  <label className="text-sm text-gray-600">Error</label>
                  <div className="mt-1 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm font-medium text-red-900">{selectedTask.error.message}</p>
                    {selectedTask.error.code && (
                      <p className="text-xs text-red-600 mt-1">Code: {selectedTask.error.code}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedTask.result && Object.keys(selectedTask.result).length > 0 && (
                <div>
                  <label className="text-sm text-gray-600">Result</label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-xs text-gray-900 overflow-x-auto">
                    {JSON.stringify(selectedTask.result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Logs Modal */}
      {showLogsModal && selectedTask && taskLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Task Logs - {selectedTask.id}</h3>
              <button
                onClick={() => {
                  setShowLogsModal(false);
                  setTaskLogs(null);
                  setSelectedTask(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-words">
                  {taskLogs}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
