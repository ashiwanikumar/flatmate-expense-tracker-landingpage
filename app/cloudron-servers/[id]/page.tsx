'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cloudronAPI } from '@/lib/api';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';
import Footer from '@/components/Footer';

export default function CloudronServerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [server, setServer] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [domains, setDomains] = useState<any[]>([]);
  const [mailboxes, setMailboxes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'mailboxes' | 'domains' | 'email-config'>('overview');
  const [loading, setLoading] = useState(true);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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

  const toggleDomain = (domainName: string) => {
    const newExpanded = new Set(expandedDomains);
    if (newExpanded.has(domainName)) {
      newExpanded.delete(domainName);
    } else {
      newExpanded.add(domainName);
    }
    setExpandedDomains(newExpanded);
  };

  const toggleAllDomains = () => {
    if (expandedDomains.size === domains.length) {
      setExpandedDomains(new Set());
    } else {
      setExpandedDomains(new Set(domains.map(d => d.domain)));
    }
  };

  const getSortedDomains = () => {
    return [...domains].sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.domain.localeCompare(b.domain);
      } else {
        return b.domain.localeCompare(a.domain);
      }
    });
  };

  const copyAllEmailConfigs = () => {
    const sortedDomains = getSortedDomains();
    let configText = '# Email Client Configuration\n\n';

    sortedDomains.forEach((domain: any) => {
      configText += `## ${domain.domain}\n\n`;
      configText += `### Username\n`;
      configText += `mailboxname@${domain.domain}\n`;
      configText += `(Replace "mailboxname" with your actual mailbox name)\n\n`;

      configText += `### Password\n`;
      configText += `Password of the owner of the mailbox\n\n`;

      configText += `### Incoming Mail (IMAP)\n`;
      configText += `Server: mail.${domain.domain}\n`;
      configText += `Port: 993 (TLS)\n\n`;

      configText += `### Outgoing Mail (SMTP)\n`;
      configText += `Server: mail.${domain.domain}\n`;
      configText += `Port: 587 (STARTTLS) or 465 (TLS)\n\n`;

      configText += `### ManageSieve\n`;
      configText += `Server: mail.${domain.domain}\n`;
      configText += `Port: 4190 (STARTTLS)\n\n`;
      configText += `---\n\n`;
    });

    navigator.clipboard.writeText(configText);
    toast.success('All email configurations copied to clipboard!');
  };

  const copySingleDomainConfig = (domain: any) => {
    let configText = `# Email Client Configuration for ${domain.domain}\n\n`;

    configText += `## Username\n`;
    configText += `mailboxname@${domain.domain}\n`;
    configText += `(Replace "mailboxname" with your actual mailbox name)\n\n`;

    configText += `## Password\n`;
    configText += `Password of the owner of the mailbox\n\n`;

    configText += `## Incoming Mail (IMAP)\n`;
    configText += `Server: mail.${domain.domain}\n`;
    configText += `Port: 993 (TLS)\n\n`;

    configText += `## Outgoing Mail (SMTP)\n`;
    configText += `Server: mail.${domain.domain}\n`;
    configText += `Port: 587 (STARTTLS) or 465 (TLS)\n\n`;

    configText += `## ManageSieve\n`;
    configText += `Server: mail.${domain.domain}\n`;
    configText += `Port: 4190 (STARTTLS)\n`;

    navigator.clipboard.writeText(configText);
    toast.success(`Configuration for ${domain.domain} copied!`);
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
              <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-xl shadow-sm p-8 mb-6 border border-purple-100">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">{server?.domain}</h1>
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        {server?.serverUrl}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSync}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sync Server
                  </button>
                </div>

                {/* Quick Action Buttons - Organized Grid */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <Link
                      href={`/cloudron-servers/${serverId}/branding`}
                      className="px-3 py-2 bg-white text-purple-700 rounded-lg hover:bg-purple-50 transition-all duration-200 text-sm font-medium text-center border border-purple-200 shadow-sm hover:shadow"
                      title="Branding Settings"
                    >
                      Branding
                    </Link>
                    <Link
                      href={`/cloudron-servers/${serverId}/notifications`}
                      className="px-3 py-2 bg-white text-yellow-700 rounded-lg hover:bg-yellow-50 transition-all duration-200 text-sm font-medium text-center border border-yellow-200 shadow-sm hover:shadow"
                      title="View Notifications"
                    >
                      Notifications
                    </Link>
                    <Link
                      href={`/cloudron-servers/${serverId}/eventlogs`}
                      className="px-3 py-2 bg-white text-red-700 rounded-lg hover:bg-red-50 transition-all duration-200 text-sm font-medium text-center border border-red-200 shadow-sm hover:shadow"
                      title="View Eventlogs"
                    >
                      Eventlogs
                    </Link>
                    <Link
                      href={`/cloudron-servers/${serverId}/mailserver`}
                      className="px-3 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-all duration-200 text-sm font-medium text-center border border-blue-200 shadow-sm hover:shadow"
                    >
                      Mailserver
                    </Link>
                    <Link
                      href={`/cloudron-servers/${serverId}/network`}
                      className="px-3 py-2 bg-white text-green-700 rounded-lg hover:bg-green-50 transition-all duration-200 text-sm font-medium text-center border border-green-200 shadow-sm hover:shadow"
                    >
                      Network
                    </Link>
                    <Link
                      href={`/cloudron-servers/${serverId}/reverseproxy`}
                      className="px-3 py-2 bg-white text-orange-700 rounded-lg hover:bg-orange-50 transition-all duration-200 text-sm font-medium text-center border border-orange-200 shadow-sm hover:shadow"
                    >
                      Reverse Proxy
                    </Link>
                    <Link
                      href={`/cloudron-servers/${serverId}/system`}
                      className="px-3 py-2 bg-white text-indigo-700 rounded-lg hover:bg-indigo-50 transition-all duration-200 text-sm font-medium text-center border border-indigo-200 shadow-sm hover:shadow"
                    >
                      System Info
                    </Link>
                    <Link
                      href={`/cloudron-servers/${serverId}/provision`}
                      className="px-3 py-2 bg-white text-indigo-700 rounded-lg hover:bg-indigo-50 transition-all duration-200 text-sm font-medium text-center border border-indigo-200 shadow-sm hover:shadow"
                    >
                      Provision
                    </Link>
                    <Link
                      href={`/cloudron-servers/${serverId}/services`}
                      className="px-3 py-2 bg-white text-cyan-700 rounded-lg hover:bg-cyan-50 transition-all duration-200 text-sm font-medium text-center border border-cyan-200 shadow-sm hover:shadow"
                      title="Manage Services"
                    >
                      Services
                    </Link>
                    <Link
                      href={`/cloudron-servers/${serverId}/tasks`}
                      className="px-3 py-2 bg-white text-pink-700 rounded-lg hover:bg-pink-50 transition-all duration-200 text-sm font-medium text-center border border-pink-200 shadow-sm hover:shadow"
                      title="View Tasks"
                    >
                      Tasks
                    </Link>
                    <Link
                      href={`/cloudron-servers/${serverId}/volumes`}
                      className="px-3 py-2 bg-white text-teal-700 rounded-lg hover:bg-teal-50 transition-all duration-200 text-sm font-medium text-center border border-teal-200 shadow-sm hover:shadow"
                      title="Manage Storage Volumes"
                    >
                      Volumes
                    </Link>
                    <Link
                      href={`/cloudron-servers/${serverId}/user-directory`}
                      className="px-3 py-2 bg-white text-violet-700 rounded-lg hover:bg-violet-50 transition-all duration-200 text-sm font-medium text-center border border-violet-200 shadow-sm hover:shadow"
                      title="User Directory Settings"
                    >
                      User Directory
                    </Link>
                    <Link
                      href={`/cloudron-servers/${serverId}/updater`}
                      className="px-3 py-2 bg-white text-red-700 rounded-lg hover:bg-red-50 transition-all duration-200 text-sm font-medium text-center border border-red-200 shadow-sm hover:shadow"
                      title="Update Manager"
                    >
                      Updater
                    </Link>
                    <Link
                      href={`/cloudron-servers/${serverId}/users`}
                      className="px-3 py-2 bg-white text-amber-700 rounded-lg hover:bg-amber-50 transition-all duration-200 text-sm font-medium text-center border border-amber-200 shadow-sm hover:shadow"
                      title="User Management"
                    >
                      Users
                    </Link>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-600">Version</p>
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats?.server?.version || server?.metadata?.version || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-600">Apps</p>
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats?.apps?.total || 0}</p>
                    {stats?.apps?.running > 0 && (
                      <p className="text-xs text-green-600 mt-1 font-medium">{stats.apps.running} running</p>
                    )}
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-600">Mailboxes</p>
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{mailboxes.length || 0}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-600">Domains</p>
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{domains.length || 0}</p>
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
                    <button
                      onClick={() => setActiveTab('email-config')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'email-config'
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Configuring Email Clients
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
                          {mailboxes.slice(0, 5).map((mailbox: any, index: number) => (
                            <div key={mailbox.id || `mailbox-${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
                          {domains.map((domain: any, index: number) => (
                            <div key={domain.domain || `domain-${index}`} className="p-4 bg-gray-50 rounded-lg">
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

                  {/* Email Configuration Tab */}
                  {activeTab === 'email-config' && (
                    <div>
                      <div className="mb-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Configuring Email Clients</h3>
                            <p className="text-gray-600">Use the settings below to configure email clients for your domains.</p>
                          </div>
                          {domains.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                </svg>
                                Sort {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                              </button>
                              <button
                                onClick={toggleAllDomains}
                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  {expandedDomains.size === domains.length ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  )}
                                </svg>
                                {expandedDomains.size === domains.length ? 'Collapse All' : 'Expand All'}
                              </button>
                              <button
                                onClick={copyAllEmailConfigs}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-medium flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy All Configs
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {domains.length === 0 ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                          <svg className="w-12 h-12 text-yellow-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <p className="text-yellow-800 font-medium">No domains configured</p>
                          <p className="text-yellow-700 text-sm mt-2">Please add a domain first to configure email clients.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {getSortedDomains().map((domain: any, index: number) => {
                            const isExpanded = expandedDomains.has(domain.domain);
                            return (
                            <div key={domain.domain || `config-${index}`} className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                              {/* Domain Header */}
                              <div
                                className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 cursor-pointer hover:from-purple-700 hover:to-blue-700 transition-all"
                                onClick={() => toggleDomain(domain.domain)}
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h4 className="text-xl font-bold text-white">{domain.domain}</h4>
                                    <p className="text-purple-100 text-sm">Email client configuration</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copySingleDomainConfig(domain);
                                      }}
                                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                                      title="Copy this domain's configuration"
                                    >
                                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                    </button>
                                    <svg
                                      className={`w-6 h-6 text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </div>
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="p-6 space-y-6">
                                {/* Username */}
                                <div>
                                  <label className="block text-sm font-bold text-gray-900 mb-3">Username</label>
                                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                                    <p className="font-mono text-gray-900">mailboxname@{domain.domain}</p>
                                    <p className="text-xs text-gray-600 mt-1">Replace "mailboxname" with your actual mailbox name</p>
                                  </div>
                                </div>

                                {/* Password */}
                                <div>
                                  <label className="block text-sm font-bold text-gray-900 mb-3">Password</label>
                                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                                    <p className="text-gray-900">Password of the owner of the mailbox</p>
                                  </div>
                                </div>

                                {/* Incoming Mail (IMAP) */}
                                <div>
                                  <h5 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    Incoming Mail (IMAP)
                                  </h5>
                                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-5 space-y-3">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-semibold text-gray-700">Server:</span>
                                      <div className="flex items-center gap-2">
                                        <code className="px-3 py-1 bg-white border border-blue-300 rounded text-blue-900 font-mono text-sm">mail.{domain.domain}</code>
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(`mail.${domain.domain}`);
                                            toast.success('IMAP server copied!');
                                          }}
                                          className="p-2 hover:bg-blue-100 rounded transition-colors"
                                          title="Copy to clipboard"
                                        >
                                          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-semibold text-gray-700">Port:</span>
                                      <code className="px-3 py-1 bg-white border border-blue-300 rounded text-blue-900 font-mono text-sm font-bold">993 (TLS)</code>
                                    </div>
                                  </div>
                                </div>

                                {/* Outgoing Mail (SMTP) */}
                                <div>
                                  <h5 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                    Outgoing Mail (SMTP)
                                  </h5>
                                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-5 space-y-3">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-semibold text-gray-700">Server:</span>
                                      <div className="flex items-center gap-2">
                                        <code className="px-3 py-1 bg-white border border-green-300 rounded text-green-900 font-mono text-sm">mail.{domain.domain}</code>
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(`mail.${domain.domain}`);
                                            toast.success('SMTP server copied!');
                                          }}
                                          className="p-2 hover:bg-green-100 rounded transition-colors"
                                          title="Copy to clipboard"
                                        >
                                          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-semibold text-gray-700">Port:</span>
                                      <code className="px-3 py-1 bg-white border border-green-300 rounded text-green-900 font-mono text-sm font-bold">587 (STARTTLS) or 465 (TLS)</code>
                                    </div>
                                  </div>
                                </div>

                                {/* ManageSieve */}
                                <div>
                                  <h5 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                    ManageSieve
                                  </h5>
                                  <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-5 space-y-3">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-semibold text-gray-700">Server:</span>
                                      <div className="flex items-center gap-2">
                                        <code className="px-3 py-1 bg-white border border-purple-300 rounded text-purple-900 font-mono text-sm">mail.{domain.domain}</code>
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(`mail.${domain.domain}`);
                                            toast.success('ManageSieve server copied!');
                                          }}
                                          className="p-2 hover:bg-purple-100 rounded transition-colors"
                                          title="Copy to clipboard"
                                        >
                                          <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-semibold text-gray-700">Port:</span>
                                      <code className="px-3 py-1 bg-white border border-purple-300 rounded text-purple-900 font-mono text-sm font-bold">4190 (STARTTLS)</code>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              )}
                            </div>
                            );
                          })}
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

      <Footer />
    </div>
  );
}
