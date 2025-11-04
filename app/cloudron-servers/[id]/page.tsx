'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cloudronAPI } from '@/lib/api';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';

export default function CloudronServerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [server, setServer] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [domains, setDomains] = useState<any[]>([]);
  const [mailboxes, setMailboxes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'mailboxes' | 'domains'>('overview');
  const [loading, setLoading] = useState(true);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [serverRes, statsRes, domainsRes, mailboxesRes] = await Promise.allSettled([
        cloudronAPI.getServer(serverId),
        cloudronAPI.getServerStats(serverId),
        cloudronAPI.getDomains(serverId),
        cloudronAPI.getMailboxes(serverId),
      ]);

      if (serverRes.status === 'fulfilled') {
        setServer(serverRes.value.data.data);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.data);
      }
      if (domainsRes.status === 'fulfilled') {
        setDomains(domainsRes.value.data.data || []);
      }
      if (mailboxesRes.status === 'fulfilled') {
        setMailboxes(mailboxesRes.value.data.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      await cloudronAPI.syncServer(serverId);
      toast.success('Server synced successfully!');
      fetchData();
    } catch (error: any) {
      console.error('Error syncing server:', error);
      toast.error(error.response?.data?.message || 'Failed to sync server');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} />
      <NavigationMenu />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link href="/cloudron-servers" className="hover:text-purple-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Servers
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {/* Server Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{server?.domain}</h1>
                    <p className="text-sm text-gray-600 mt-1">{server?.serverUrl}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/cloudron-servers/${serverId}/notifications`}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all duration-200 font-medium flex items-center gap-2"
                      title="View Notifications"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      Notifications
                    </Link>
                    <Link
                      href={`/cloudron-servers/${serverId}/mailserver`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
                    >
                      Mailserver
                    </Link>
                    <Link
                      href={`/cloudron-servers/${serverId}/network`}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium"
                    >
                      Network
                    </Link>
                    <Link
                      href={`/cloudron-servers/${serverId}/reverseproxy`}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all duration-200 font-medium"
                    >
                      Reverse Proxy
                    </Link>
                    <Link
                      href={`/cloudron-servers/${serverId}/provision`}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium"
                    >
                      Provision
                    </Link>
                    <button
                      onClick={handleSync}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 font-medium"
                    >
                      Sync Server
                    </button>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Version</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.server?.version || server?.metadata?.version || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Apps</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.apps?.total || 0}
                      {stats?.apps?.running > 0 && (
                        <span className="text-sm text-green-600 ml-2">{stats.apps.running} running</span>
                      )}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Mailboxes</p>
                    <p className="text-2xl font-bold text-gray-900">{mailboxes.length || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Domains</p>
                    <p className="text-2xl font-bold text-gray-900">{domains.length || 0}</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'overview'
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('mailboxes')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'mailboxes'
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Mailboxes
                    </button>
                    <button
                      onClick={() => setActiveTab('domains')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Server Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-gray-600">Domain</label>
                            <p className="text-base font-medium text-gray-900">{server?.domain}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-600">Server URL</label>
                            <p className="text-base font-medium text-gray-900">{server?.serverUrl}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-600">Provider</label>
                            <p className="text-base font-medium text-gray-900 capitalize">{server?.provider || 'Generic'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-600">Status</label>
                            <span
                              className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                                server?.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : server?.status === 'inactive'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {server?.status}
                            </span>
                          </div>
                          {server?.lastSyncedAt && (
                            <div>
                              <label className="text-sm text-gray-600">Last Synced</label>
                              <p className="text-base font-medium text-gray-900">
                                {new Date(server.lastSyncedAt).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {stats && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-4">Statistics</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 rounded-lg p-4">
                              <p className="text-sm text-blue-600 mb-1">Total Apps</p>
                              <p className="text-3xl font-bold text-blue-900">{stats.apps?.total || 0}</p>
                              {stats.apps?.running > 0 && (
                                <p className="text-xs text-blue-600 mt-1">{stats.apps.running} running</p>
                              )}
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4">
                              <p className="text-sm text-purple-600 mb-1">Total Mailboxes</p>
                              <p className="text-3xl font-bold text-purple-900">{stats.mailboxes?.total || 0}</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4">
                              <p className="text-sm text-green-600 mb-1">Total Domains</p>
                              <p className="text-3xl font-bold text-green-900">{stats.domains?.total || 0}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mailboxes Tab */}
                  {activeTab === 'mailboxes' && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Mailboxes</h3>
                        <Link
                          href={`/cloudron-servers/${serverId}/mailboxes`}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
                        >
                          Manage Mailboxes
                        </Link>
                      </div>
                      {mailboxes.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No mailboxes configured</p>
                      ) : (
                        <div className="space-y-2">
                          {mailboxes.slice(0, 5).map((mailbox: any) => (
                            <div key={mailbox.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {mailbox.name}@{mailbox.domain}
                                </p>
                                <p className="text-sm text-gray-600">{mailbox.ownerType || 'user'}</p>
                              </div>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  mailbox.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {mailbox.active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          ))}
                          {mailboxes.length > 5 && (
                            <p className="text-sm text-gray-500 text-center pt-2">
                              +{mailboxes.length - 5} more mailboxes
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Domains Tab */}
                  {activeTab === 'domains' && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Domains</h3>
                        <Link
                          href={`/cloudron-servers/${serverId}/domains`}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
                        >
                          Manage Domains
                        </Link>
                      </div>
                      {domains.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No domains configured</p>
                      ) : (
                        <div className="space-y-3">
                          {domains.map((domain: any) => (
                            <div key={domain.domain} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-bold text-gray-900">{domain.domain}</p>
                                  <p className="text-sm text-gray-600">Provider: {domain.provider}</p>
                                </div>
                                <div className="flex gap-2 items-center">
                                  {domain.tlsConfig?.wildcard && (
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                      Wildcard
                                    </span>
                                  )}
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                    {domain.tlsConfig?.provider || 'N/A'}
                                  </span>
                                  <Link
                                    href={`/cloudron-servers/${serverId}/mail/${encodeURIComponent(domain.domain)}`}
                                    className="px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors text-xs font-medium"
                                    title="Mail Configuration"
                                  >
                                    Mail
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
