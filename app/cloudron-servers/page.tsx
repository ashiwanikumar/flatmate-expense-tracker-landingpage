'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cloudronAPI } from '@/lib/api';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';

export default function CloudronServersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [addingServer, setAddingServer] = useState(false);
  const [syncingServerId, setSyncingServerId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [serverToDelete, setServerToDelete] = useState<{ id: string; domain: string } | null>(null);
  const [serverForm, setServerForm] = useState({
    domain: '',
    serverUrl: '',
    apiToken: '',
    provider: 'generic',
  });

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
    if (!serverForm.serverUrl || !serverForm.apiToken) {
      toast.error('Server URL and API Token are required');
      return;
    }

    setTestingConnection(true);
    try {
      const response = await cloudronAPI.testConnection({
        serverUrl: serverForm.serverUrl,
        apiToken: serverForm.apiToken,
      });
      toast.success(`Connection successful! Version: ${response.data.data.version}`);
    } catch (error: any) {
      console.error('Connection test failed:', error);
      toast.error(error.response?.data?.message || 'Connection test failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!serverForm.domain || !serverForm.serverUrl || !serverForm.apiToken) {
      toast.error('Please fill in all required fields');
      return;
    }

    setAddingServer(true);
    try {
      await cloudronAPI.addServer(serverForm);
      toast.success('Cloudron server added successfully!');
      setShowAddModal(false);
      setServerForm({
        domain: '',
        serverUrl: '',
        apiToken: '',
        provider: 'generic',
      });
      fetchServers();
    } catch (error: any) {
      console.error('Error adding server:', error);
      toast.error(error.response?.data?.message || 'Failed to add server');
    } finally {
      setAddingServer(false);
    }
  };

  const handleSyncServer = async (serverId: string) => {
    setSyncingServerId(serverId);
    try {
      await cloudronAPI.syncServer(serverId);
      toast.success('Server synced successfully!');
      fetchServers();
    } catch (error: any) {
      console.error('Error syncing server:', error);
      toast.error(error.response?.data?.message || 'Failed to sync server');
    } finally {
      setSyncingServerId(null);
    }
  };

  const handleDeleteClick = (serverId: string, domain: string) => {
    setServerToDelete({ id: serverId, domain });
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!serverToDelete || deleteConfirmText.toUpperCase() !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    try {
      await cloudronAPI.deleteServer(serverToDelete.id);
      toast.success('Server deleted successfully!');
      setShowDeleteModal(false);
      setServerToDelete(null);
      setDeleteConfirmText('');
      fetchServers();
    } catch (error: any) {
      console.error('Error deleting server:', error);
      toast.error(error.response?.data?.message || 'Failed to delete server');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} />
      <NavigationMenu />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cloudron Servers</h1>
              <p className="mt-2 text-sm text-gray-600">Manage your Cloudron email servers</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
            >
              Add Server
            </button>
          </div>

          {/* Servers List */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : servers.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Servers</h3>
              <p className="text-gray-500 mb-4">Add your first Cloudron server to get started</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
              >
                Add Server
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servers.map((server) => (
                <div key={server._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{server.domain}</h3>
                        <p className="text-sm text-gray-500 mt-1">{server.serverUrl}</p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          server.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : server.status === 'inactive'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {server.status}
                      </span>
                    </div>

                    {/* Metadata */}
                    {server.metadata && (
                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Version:</span>
                          <span className="font-medium text-gray-900">{server.metadata.version || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Apps:</span>
                          <span className="font-medium text-gray-900">{server.metadata.totalApps || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Mailboxes:</span>
                          <span className="font-medium text-gray-900">{server.metadata.totalMailboxes || 0}</span>
                        </div>
                      </div>
                    )}

                    {/* Last Synced */}
                    {server.lastSyncedAt && (
                      <p className="text-xs text-gray-500 mb-4">
                        Last synced: {new Date(server.lastSyncedAt).toLocaleString()}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <Link
                        href={`/cloudron-servers/${server._id}`}
                        className="px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors text-center text-sm font-medium"
                      >
                        Manage
                      </Link>
                      <Link
                        href={`/cloudron-servers/${server._id}/volumes`}
                        className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-center text-sm font-medium"
                        title="Manage Volumes"
                      >
                        Volumes
                      </Link>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSyncServer(server._id)}
                        disabled={syncingServerId === server._id}
                        className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Sync Server"
                      >
                        <svg className={`w-5 h-5 mx-auto ${syncingServerId === server._id ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(server._id, server.domain)}
                        className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                        title="Delete Server"
                      >
                        <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Server Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">Add Cloudron Server</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddServer} className="px-6 py-5">
              <div className="space-y-4">
                {/* Domain */}
                <div>
                  <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-2">
                    Domain <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="domain"
                    value={serverForm.domain}
                    onChange={(e) => setServerForm({ ...serverForm, domain: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    placeholder="corp.netraga.com"
                    disabled={addingServer}
                  />
                  <p className="mt-1 text-xs text-gray-500">The primary domain for this Cloudron server</p>
                </div>

                {/* Server URL */}
                <div>
                  <label htmlFor="serverUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Server URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    id="serverUrl"
                    value={serverForm.serverUrl}
                    onChange={(e) => setServerForm({ ...serverForm, serverUrl: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    placeholder="https://my.corp.netraga.com"
                    disabled={addingServer}
                  />
                  <p className="mt-1 text-xs text-gray-500">The full URL to access your Cloudron dashboard</p>
                </div>

                {/* API Token */}
                <div>
                  <label htmlFor="apiToken" className="block text-sm font-medium text-gray-700 mb-2">
                    API Token <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="apiToken"
                    value={serverForm.apiToken}
                    onChange={(e) => setServerForm({ ...serverForm, apiToken: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition font-mono text-sm"
                    placeholder="Enter your Cloudron API token"
                    rows={3}
                    disabled={addingServer}
                  />
                  <p className="mt-1 text-xs text-gray-500">Generate this from your Cloudron dashboard under Account → Access Tokens</p>
                </div>

                {/* Provider */}
                <div>
                  <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-2">
                    Provider
                  </label>
                  <select
                    id="provider"
                    value={serverForm.provider}
                    onChange={(e) => setServerForm({ ...serverForm, provider: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    disabled={addingServer}
                  >
                    <option value="generic">Generic</option>
                    <option value="aws">AWS</option>
                    <option value="digitalocean">DigitalOcean</option>
                    <option value="hetzner">Hetzner</option>
                    <option value="linode">Linode</option>
                    <option value="vultr">Vultr</option>
                  </select>
                </div>

                {/* Test Connection Button */}
                <div>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection || !serverForm.serverUrl || !serverForm.apiToken}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {testingConnection ? 'Testing Connection...' : 'Test Connection'}
                  </button>
                </div>
              </div>
            </form>

            {/* Buttons */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={addingServer}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleAddServer}
                disabled={addingServer}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingServer ? 'Adding Server...' : 'Add Server'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Syncing Modal */}
      {syncingServerId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mb-4">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mx-auto"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Syncing Server</h3>
              <p className="text-gray-600">Please wait while we sync the server data...</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && serverToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
            </div>

            <div className="px-6 py-5">
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to delete server <span className="font-bold">"{serverToDelete.domain}"</span>?
                </p>
                <p className="text-sm text-red-600">
                  This action cannot be undone. All associated data will be permanently removed.
                </p>
              </div>

              <div>
                <label htmlFor="deleteConfirm" className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="font-bold text-red-600">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  id="deleteConfirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                  placeholder="Type DELETE here"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setServerToDelete(null);
                  setDeleteConfirmText('');
                }}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteConfirmText.toUpperCase() !== 'DELETE'}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Server
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
