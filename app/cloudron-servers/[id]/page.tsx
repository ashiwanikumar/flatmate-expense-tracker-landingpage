'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';
import { cloudronAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CloudronServerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [server, setServer] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [mailboxes, setMailboxes] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'mailboxes' | 'domains'>('overview');
  const [loading, setLoading] = useState(true);
  const [mailboxesLoading, setMailboxesLoading] = useState(false);
  const [domainsLoading, setDomainsLoading] = useState(false);
  const [showAddMailboxModal, setShowAddMailboxModal] = useState(false);
  const [mailboxForm, setMailboxForm] = useState({
    name: '',
    domain: '',
    ownerId: '',
  });
  const [addingMailbox, setAddingMailbox] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchServerDetails();
  }, []);

  const fetchServerDetails = async () => {
    try {
      setLoading(true);
      const [serverRes, statsRes] = await Promise.all([
        cloudronAPI.getServer(serverId),
        cloudronAPI.getServerStats(serverId),
      ]);

      setServer(serverRes.data.data);
      setStats(statsRes.data.data);
    } catch (error: any) {
      console.error('Error fetching server details:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch server details');
    } finally {
      setLoading(false);
    }
  };

  const fetchMailboxes = async () => {
    try {
      setMailboxesLoading(true);
      const response = await cloudronAPI.getMailboxes(serverId);
      setMailboxes(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching mailboxes:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch mailboxes');
    } finally {
      setMailboxesLoading(false);
    }
  };

  const fetchDomains = async () => {
    try {
      setDomainsLoading(true);
      const response = await cloudronAPI.getDomains(serverId);
      setDomains(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching domains:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch domains');
    } finally {
      setDomainsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'mailboxes') {
      fetchMailboxes();
    } else if (activeTab === 'domains') {
      fetchDomains();
    }
  }, [activeTab]);

  const handleSync = async () => {
    try {
      await cloudronAPI.syncServer(serverId);
      toast.success('Server synced successfully!');
      fetchServerDetails();
    } catch (error: any) {
      console.error('Error syncing server:', error);
      toast.error(error.response?.data?.message || 'Failed to sync server');
    }
  };

  const handleOpenAddMailbox = async () => {
    setShowAddMailboxModal(true);
    // Fetch domains if not already loaded
    if (domains.length === 0) {
      await fetchDomains();
    }
  };

  const handleAddMailbox = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mailboxForm.name || !mailboxForm.domain) {
      toast.error('Please fill in all required fields');
      return;
    }

    setAddingMailbox(true);
    try {
      await cloudronAPI.createMailbox(serverId, mailboxForm);
      toast.success('Mailbox created successfully!');
      setShowAddMailboxModal(false);
      setMailboxForm({ name: '', domain: '', ownerId: '' });
      fetchMailboxes();
    } catch (error: any) {
      console.error('Error creating mailbox:', error);
      toast.error(error.response?.data?.message || 'Failed to create mailbox');
    } finally {
      setAddingMailbox(false);
    }
  };

  const handleDeleteMailbox = async (mailbox: any) => {
    if (!confirm(`Are you sure you want to delete mailbox "${mailbox.name}"?`)) {
      return;
    }

    try {
      await cloudronAPI.deleteMailbox(serverId, mailbox.id, mailbox.domain);
      toast.success('Mailbox deleted successfully!');
      fetchMailboxes();
    } catch (error: any) {
      console.error('Error deleting mailbox:', error);
      toast.error(error.response?.data?.message || 'Failed to delete mailbox');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
        <Header user={user} />
        <NavigationMenu />
        <main className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </main>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
        <Header user={user} />
        <NavigationMenu />
        <main className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Server not found</h2>
            <button
              onClick={() => router.push('/cloudron-servers')}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Back to Servers
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      <Header user={user} />
      <NavigationMenu />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/cloudron-servers')}
              className="text-sm text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-1"
            >
              ← Back to Servers
            </button>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{server.domain}</h1>
                <p className="text-sm text-gray-600 mt-1">{server.serverUrl}</p>
              </div>
              <button
                onClick={handleSync}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
              >
                Sync Server
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-600 mb-1">Version</div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.server?.version || 'N/A'}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-600 mb-1">Apps</div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.apps?.total || 0}
                  <span className="text-sm font-medium text-green-600 ml-2">
                    {stats.apps?.running || 0} running
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-600 mb-1">Mailboxes</div>
                <div className="text-2xl font-bold text-gray-900">{stats.mailboxes?.total || 0}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-600 mb-1">Domains</div>
                <div className="text-2xl font-bold text-gray-900">{stats.domains?.total || 0}</div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'overview'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('mailboxes')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'mailboxes'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Mailboxes
                </button>
                <button
                  onClick={() => setActiveTab('domains')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'domains'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Domains
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Domain</label>
                      <p className="mt-1 text-sm text-gray-900">{server.domain}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Provider</label>
                      <p className="mt-1 text-sm text-gray-900">{server.provider}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <p className="mt-1 text-sm text-gray-900 capitalize">{server.status}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Platform</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {stats?.server?.platform || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Last Synced</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(stats?.lastSynced)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Created At</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(server.createdAt)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mailboxes Tab */}
              {activeTab === 'mailboxes' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Mailboxes</h3>
                    <button
                      onClick={handleOpenAddMailbox}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm"
                    >
                      + Add Mailbox
                    </button>
                  </div>

                  {mailboxesLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                  ) : mailboxes.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No mailboxes found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {mailboxes.map((mailbox: any) => (
                        <div
                          key={`${mailbox.name}-${mailbox.domain}`}
                          className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{mailbox.name}@{mailbox.domain}</p>
                            <p className="text-sm text-gray-500">
                              Owner: {mailbox.ownerType} | Active: {mailbox.active ? 'Yes' : 'No'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteMailbox(mailbox)}
                            className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Domains Tab */}
              {activeTab === 'domains' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Domains</h3>
                  {domainsLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                  ) : domains.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No domains found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {domains.map((domain: any) => (
                        <div
                          key={domain.domain}
                          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <p className="font-medium text-gray-900">{domain.domain}</p>
                          <p className="text-sm text-gray-500">Provider: {domain.provider}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Mailbox Modal */}
      {showAddMailboxModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Mailbox</h3>
            </div>

            <form onSubmit={handleAddMailbox} className="px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={mailboxForm.name}
                    onChange={(e) => setMailboxForm({ ...mailboxForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    placeholder="sales"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domain <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={mailboxForm.domain}
                    onChange={(e) => setMailboxForm({ ...mailboxForm, domain: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    required
                  >
                    <option value="">Select domain</option>
                    {domains.map((domain: any) => (
                      <option key={domain.domain} value={domain.domain}>
                        {domain.domain}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddMailboxModal(false);
                  setMailboxForm({ name: '', domain: '', ownerId: '' });
                }}
                disabled={addingMailbox}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMailbox}
                disabled={addingMailbox}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50"
              >
                {addingMailbox ? 'Adding...' : 'Add Mailbox'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
