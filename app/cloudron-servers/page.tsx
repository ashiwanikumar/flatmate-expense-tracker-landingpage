'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';
import { cloudronAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface CloudronServer {
  _id: string;
  domain: string;
  serverUrl: string;
  provider: string;
  status: string;
  metadata: {
    version?: string;
    platform?: string;
    totalApps?: number;
    totalMailboxes?: number;
  };
  lastSyncedAt?: string;
  createdAt: string;
}

export default function CloudronServersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [servers, setServers] = useState<CloudronServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    domain: '',
    serverUrl: '',
    apiToken: '',
    provider: 'generic',
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [adding, setAdding] = useState(false);
  const [syncingServer, setSyncingServer] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      setLoading(true);
      const response = await cloudronAPI.getServers();
      setServers(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching servers:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch servers');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.serverUrl || !formData.apiToken) {
      toast.error('Please provide server URL and API token');
      return;
    }

    setTestingConnection(true);
    try {
      await cloudronAPI.testConnection({
        serverUrl: formData.serverUrl,
        apiToken: formData.apiToken,
      });
      toast.success('Connection successful!');
    } catch (error: any) {
      console.error('Connection test failed:', error);
      toast.error(error.response?.data?.message || 'Connection failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.domain || !formData.serverUrl || !formData.apiToken) {
      toast.error('Please fill in all required fields');
      return;
    }

    setAdding(true);
    try {
      await cloudronAPI.addServer(formData);
      toast.success('Server added successfully!');
      setShowAddModal(false);
      setFormData({ domain: '', serverUrl: '', apiToken: '', provider: 'generic' });
      fetchServers();
    } catch (error: any) {
      console.error('Error adding server:', error);
      toast.error(error.response?.data?.message || 'Failed to add server');
    } finally {
      setAdding(false);
    }
  };

  const handleSync = async (serverId: string) => {
    try {
      setSyncingServer(serverId);
      await cloudronAPI.syncServer(serverId);
      toast.success('Server synced successfully!');
      fetchServers();
    } catch (error: any) {
      console.error('Error syncing server:', error);
      toast.error(error.response?.data?.message || 'Failed to sync server');
    } finally {
      setSyncingServer(null);
    }
  };

  const handleDelete = async (serverId: string, domain: string) => {
    if (!confirm(`Are you sure you want to delete server "${domain}"?`)) {
      return;
    }

    try {
      await cloudronAPI.deleteServer(serverId);
      toast.success('Server deleted successfully!');
      fetchServers();
    } catch (error: any) {
      console.error('Error deleting server:', error);
      toast.error(error.response?.data?.message || 'Failed to delete server');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      <Header user={user} />
      <NavigationMenu />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cloudron Servers</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your Cloudron email servers</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
            >
              + Add Server
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          )}

          {/* Empty State */}
          {!loading && servers.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
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
                  d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No servers</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a Cloudron server.</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  + Add Server
                </button>
              </div>
            </div>
          )}

          {/* Servers Grid */}
          {!loading && servers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servers.map((server) => (
                <div
                  key={server._id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{server.domain}</h3>
                      <p className="text-sm text-gray-500">{server.provider}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        server.status
                      )}`}
                    >
                      {server.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Version:</span>
                      <span className="font-medium text-gray-900">
                        {server.metadata?.version || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Apps:</span>
                      <span className="font-medium text-gray-900">
                        {server.metadata?.totalApps || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Mailboxes:</span>
                      <span className="font-medium text-gray-900">
                        {server.metadata?.totalMailboxes || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Last Sync:</span>
                      <span className="font-medium text-gray-900 text-xs">
                        {formatDate(server.lastSyncedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/cloudron-servers/${server._id}`)}
                      className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition font-medium"
                    >
                      Manage
                    </button>
                    <button
                      onClick={() => handleSync(server._id)}
                      disabled={syncingServer === server._id}
                      className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {syncingServer === server._id ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Syncing...
                        </>
                      ) : (
                        'Sync'
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(server._id, server.domain)}
                      className="px-3 py-2 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Server Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Cloudron Server</h3>
            </div>

            <form onSubmit={handleAddServer} className="px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domain <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    placeholder="mail.example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Server URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.serverUrl}
                    onChange={(e) => setFormData({ ...formData, serverUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    placeholder="https://mail.example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Token <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.apiToken}
                    onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    placeholder="Enter API token"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                  <select
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  >
                    <option value="generic">Generic</option>
                    <option value="hostinger">Hostinger</option>
                    <option value="digitalocean">DigitalOcean</option>
                    <option value="aws">AWS</option>
                    <option value="gcp">Google Cloud</option>
                    <option value="azure">Azure</option>
                    <option value="hetzner">Hetzner</option>
                    <option value="vultr">Vultr</option>
                    <option value="linode">Linode</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                >
                  {testingConnection ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ domain: '', serverUrl: '', apiToken: '', provider: 'generic' });
                }}
                disabled={adding}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddServer}
                disabled={adding}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add Server'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
