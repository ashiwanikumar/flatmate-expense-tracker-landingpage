'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cloudronAPI } from '@/lib/api';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';

export default function MailserverPage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [server, setServer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'spam' | 'eventlogs' | 'usage'>('config');
  const [loading, setLoading] = useState(true);

  // Configuration states
  const [location, setLocation] = useState<any>(null);
  const [maxEmailSize, setMaxEmailSize] = useState<any>(null);
  const [solrConfig, setSolrConfig] = useState<any>(null);
  const [mailboxSharing, setMailboxSharing] = useState<any>(null);
  const [virtualAllMail, setVirtualAllMail] = useState<any>(null);

  // Spam states
  const [spamAcl, setSpamAcl] = useState<any>(null);
  const [spamCustomConfig, setSpamCustomConfig] = useState<any>(null);
  const [dnsblConfig, setDnsblConfig] = useState<any>(null);

  // Eventlogs states
  const [eventlogs, setEventlogs] = useState<any[]>([]);
  const [eventlogsPage, setEventlogsPage] = useState(1);
  const [eventlogsPerPage] = useState(25);

  // Usage state
  const [usage, setUsage] = useState<any>(null);

  // Modal states
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMaxEmailSizeModal, setShowMaxEmailSizeModal] = useState(false);
  const [showSpamAclModal, setShowSpamAclModal] = useState(false);
  const [showSpamCustomConfigModal, setShowSpamCustomConfigModal] = useState(false);
  const [showDnsblConfigModal, setShowDnsblConfigModal] = useState(false);

  // Form states
  const [locationForm, setLocationForm] = useState({ domain: '', subdomain: '' });
  const [maxEmailSizeForm, setMaxEmailSizeForm] = useState({ size: 0 });
  const [spamAclForm, setSpamAclForm] = useState({ blacklist: [] as string[], newEmail: '' });
  const [spamCustomConfigForm, setSpamCustomConfigForm] = useState({ config: '' });
  const [dnsblConfigForm, setDnsblConfigForm] = useState({ zones: [] as string[], newZone: '' });

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
      const [serverRes] = await Promise.allSettled([
        cloudronAPI.getServer(serverId),
      ]);

      if (serverRes.status === 'fulfilled') {
        setServer(serverRes.value.data.data);
      }

      // Fetch configuration data
      await fetchConfigData();
      await fetchSpamData();
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfigData = async () => {
    try {
      const [locationRes, maxSizeRes, solrRes, sharingRes, virtualRes] = await Promise.allSettled([
        cloudronAPI.getMailserverLocation(serverId),
        cloudronAPI.getMaxEmailSize(serverId),
        cloudronAPI.getSolrConfig(serverId),
        cloudronAPI.getMailboxSharing(serverId),
        cloudronAPI.getVirtualAllMail(serverId),
      ]);

      if (locationRes.status === 'fulfilled') {
        setLocation(locationRes.value.data.data);
      }
      if (maxSizeRes.status === 'fulfilled') {
        setMaxEmailSize(maxSizeRes.value.data.data);
      }
      if (solrRes.status === 'fulfilled') {
        setSolrConfig(solrRes.value.data.data);
      }
      if (sharingRes.status === 'fulfilled') {
        setMailboxSharing(sharingRes.value.data.data);
      }
      if (virtualRes.status === 'fulfilled') {
        setVirtualAllMail(virtualRes.value.data.data);
      }
    } catch (error) {
      console.error('Error fetching config data:', error);
    }
  };

  const fetchSpamData = async () => {
    try {
      const [aclRes, customRes, dnsblRes] = await Promise.allSettled([
        cloudronAPI.getSpamAcl(serverId),
        cloudronAPI.getSpamCustomConfig(serverId),
        cloudronAPI.getDnsblConfig(serverId),
      ]);

      if (aclRes.status === 'fulfilled') {
        setSpamAcl(aclRes.value.data.data);
      }
      if (customRes.status === 'fulfilled') {
        setSpamCustomConfig(customRes.value.data.data);
      }
      if (dnsblRes.status === 'fulfilled') {
        setDnsblConfig(dnsblRes.value.data.data);
      }
    } catch (error) {
      console.error('Error fetching spam data:', error);
    }
  };

  const fetchEventlogs = async () => {
    try {
      const res = await cloudronAPI.getMailserverEventlogs(serverId, {
        page: eventlogsPage,
        per_page: eventlogsPerPage,
      });
      setEventlogs(res.data.data.eventlogs || []);
    } catch (error: any) {
      console.error('Error fetching eventlogs:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch eventlogs');
    }
  };

  const fetchUsage = async () => {
    try {
      const res = await cloudronAPI.getMailserverUsage(serverId);
      setUsage(res.data.data);
    } catch (error: any) {
      console.error('Error fetching usage:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch usage');
    }
  };

  useEffect(() => {
    if (activeTab === 'eventlogs') {
      fetchEventlogs();
    } else if (activeTab === 'usage') {
      fetchUsage();
    }
  }, [activeTab, eventlogsPage]);

  // Configuration handlers
  const handleSetLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cloudronAPI.setMailserverLocation(serverId, locationForm);
      toast.success('Mailserver location updated successfully!');
      setShowLocationModal(false);
      fetchConfigData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update location');
    }
  };

  const handleSetMaxEmailSize = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cloudronAPI.setMaxEmailSize(serverId, maxEmailSizeForm.size);
      toast.success('Max email size updated successfully!');
      setShowMaxEmailSizeModal(false);
      fetchConfigData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update max email size');
    }
  };

  const handleToggleSolr = async (enabled: boolean) => {
    try {
      await cloudronAPI.setSolrConfig(serverId, enabled);
      toast.success(`Solr ${enabled ? 'enabled' : 'disabled'} successfully!`);
      fetchConfigData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update Solr config');
    }
  };

  const handleToggleMailboxSharing = async (enabled: boolean) => {
    try {
      await cloudronAPI.setMailboxSharing(serverId, enabled);
      toast.success(`Mailbox sharing ${enabled ? 'enabled' : 'disabled'} successfully!`);
      fetchConfigData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update mailbox sharing');
    }
  };

  const handleToggleVirtualAllMail = async (enabled: boolean) => {
    try {
      await cloudronAPI.setVirtualAllMail(serverId, enabled);
      toast.success(`Virtual all mail ${enabled ? 'enabled' : 'disabled'} successfully!`);
      fetchConfigData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update virtual all mail');
    }
  };

  // Spam handlers
  const handleSetSpamAcl = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cloudronAPI.setSpamAcl(serverId, spamAclForm.blacklist);
      toast.success('Spam ACL updated successfully!');
      setShowSpamAclModal(false);
      fetchSpamData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update spam ACL');
    }
  };

  const handleSetSpamCustomConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cloudronAPI.setSpamCustomConfig(serverId, spamCustomConfigForm.config);
      toast.success('Spam custom config updated successfully!');
      setShowSpamCustomConfigModal(false);
      fetchSpamData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update spam custom config');
    }
  };

  const handleSetDnsblConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cloudronAPI.setDnsblConfig(serverId, dnsblConfigForm.zones);
      toast.success('DNSBL config updated successfully!');
      setShowDnsblConfigModal(false);
      fetchSpamData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update DNSBL config');
    }
  };

  const handleClearEventlogs = async () => {
    if (!confirm('Are you sure you want to clear all eventlogs?')) {
      return;
    }
    try {
      await cloudronAPI.clearMailserverEventlogs(serverId);
      toast.success('Eventlogs cleared successfully!');
      fetchEventlogs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to clear eventlogs');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
              {server?.domain}
            </Link>
            <span>/</span>
            <span className="text-gray-900">Mailserver</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mailserver Configuration</h1>
                <p className="text-sm text-gray-600 mt-1">{server?.serverUrl}</p>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab('config')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'config'
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Configuration
                    </button>
                    <button
                      onClick={() => setActiveTab('spam')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'spam'
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Spam Control
                    </button>
                    <button
                      onClick={() => setActiveTab('eventlogs')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'eventlogs'
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Event Logs
                    </button>
                    <button
                      onClick={() => setActiveTab('usage')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'usage'
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Usage
                    </button>
                  </nav>
                </div>

                <div className="p-6">
                  {/* Configuration Tab */}
                  {activeTab === 'config' && (
                    <div className="space-y-6">
                      {/* Location */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-bold text-gray-900">Mailserver Location</h3>
                          <button
                            onClick={() => {
                              setLocationForm({ domain: location?.domain || '', subdomain: location?.subdomain || '' });
                              setShowLocationModal(true);
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                          >
                            Update
                          </button>
                        </div>
                        {location && (
                          <p className="text-gray-700">
                            {location.subdomain}.{location.domain}
                          </p>
                        )}
                      </div>

                      {/* Max Email Size */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-bold text-gray-900">Max Email Size</h3>
                          <button
                            onClick={() => {
                              setMaxEmailSizeForm({ size: maxEmailSize?.size || 0 });
                              setShowMaxEmailSizeModal(true);
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                          >
                            Update
                          </button>
                        </div>
                        {maxEmailSize && (
                          <p className="text-gray-700">{formatBytes(maxEmailSize.size)}</p>
                        )}
                      </div>

                      {/* Toggle Configs */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Solr */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">Solr Search</h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleSolr(!solrConfig?.enabled)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                solrConfig?.enabled ? 'bg-purple-600' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  solrConfig?.enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                            <span className="text-sm text-gray-700">
                              {solrConfig?.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </div>

                        {/* Mailbox Sharing */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">Mailbox Sharing</h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleMailboxSharing(!mailboxSharing?.enabled)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                mailboxSharing?.enabled ? 'bg-purple-600' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  mailboxSharing?.enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                            <span className="text-sm text-gray-700">
                              {mailboxSharing?.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </div>

                        {/* Virtual All Mail */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">Virtual All Mail</h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleVirtualAllMail(!virtualAllMail?.enabled)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                virtualAllMail?.enabled ? 'bg-purple-600' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  virtualAllMail?.enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                            <span className="text-sm text-gray-700">
                              {virtualAllMail?.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Spam Control Tab */}
                  {activeTab === 'spam' && (
                    <div className="space-y-6">
                      {/* Spam ACL */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-bold text-gray-900">Spam ACL (Blacklist)</h3>
                          <button
                            onClick={() => {
                              setSpamAclForm({ blacklist: spamAcl?.blacklist || [], newEmail: '' });
                              setShowSpamAclModal(true);
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                          >
                            Manage
                          </button>
                        </div>
                        {spamAcl?.blacklist && spamAcl.blacklist.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {spamAcl.blacklist.map((email: string, index: number) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm"
                              >
                                {email}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No emails blacklisted</p>
                        )}
                      </div>

                      {/* Spam Custom Config */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-bold text-gray-900">Spam Custom Config</h3>
                          <button
                            onClick={() => {
                              setSpamCustomConfigForm({ config: spamCustomConfig?.config || '' });
                              setShowSpamCustomConfigModal(true);
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                          >
                            Edit
                          </button>
                        </div>
                        {spamCustomConfig?.config ? (
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {spamCustomConfig.config}
                          </pre>
                        ) : (
                          <p className="text-gray-500 text-sm">No custom config set</p>
                        )}
                      </div>

                      {/* DNSBL Config */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-bold text-gray-900">DNSBL Zones</h3>
                          <button
                            onClick={() => {
                              setDnsblConfigForm({ zones: dnsblConfig?.zones || [], newZone: '' });
                              setShowDnsblConfigModal(true);
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                          >
                            Manage
                          </button>
                        </div>
                        {dnsblConfig?.zones && dnsblConfig.zones.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {dnsblConfig.zones.map((zone: string, index: number) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                              >
                                {zone}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No DNSBL zones configured</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Event Logs Tab */}
                  {activeTab === 'eventlogs' && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Event Logs</h3>
                        <button
                          onClick={handleClearEventlogs}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          Clear Logs
                        </button>
                      </div>
                      {eventlogs.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No event logs available</p>
                      ) : (
                        <div className="space-y-2">
                          {eventlogs.map((log: any, index: number) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="text-sm text-gray-900 font-medium">{log.message}</p>
                                  <p className="text-xs text-gray-600 mt-1">{log.type}</p>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {new Date(log.createdAt).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Usage Tab */}
                  {activeTab === 'usage' && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Mailserver Usage</h3>
                      {usage ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(usage).map(([key, value]: [string, any]) => (
                            <div key={key} className="bg-gray-50 rounded-lg p-4">
                              <p className="text-sm text-gray-600 mb-1">{key}</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {typeof value === 'number' ? formatBytes(value) : String(value)}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-8">No usage data available</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Update Mailserver Location</h3>
            <form onSubmit={handleSetLocation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                <input
                  type="text"
                  value={locationForm.domain}
                  onChange={(e) => setLocationForm({ ...locationForm, domain: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-600 focus:border-purple-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain</label>
                <input
                  type="text"
                  value={locationForm.subdomain}
                  onChange={(e) => setLocationForm({ ...locationForm, subdomain: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-600 focus:border-purple-600"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Max Email Size Modal */}
      {showMaxEmailSizeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Update Max Email Size</h3>
            <form onSubmit={handleSetMaxEmailSize} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size (bytes)</label>
                <input
                  type="number"
                  value={maxEmailSizeForm.size}
                  onChange={(e) => setMaxEmailSizeForm({ size: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-600 focus:border-purple-600"
                  required
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Current: {formatBytes(maxEmailSizeForm.size)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setShowMaxEmailSizeModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spam ACL Modal */}
      {showSpamAclModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Manage Spam Blacklist</h3>
            <form onSubmit={handleSetSpamAcl} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Add Email</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={spamAclForm.newEmail}
                    onChange={(e) => setSpamAclForm({ ...spamAclForm, newEmail: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-600 focus:border-purple-600"
                    placeholder="spam@example.com"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (spamAclForm.newEmail && !spamAclForm.blacklist.includes(spamAclForm.newEmail)) {
                        setSpamAclForm({
                          ...spamAclForm,
                          blacklist: [...spamAclForm.blacklist, spamAclForm.newEmail],
                          newEmail: '',
                        });
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blacklisted Emails</label>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {spamAclForm.blacklist.map((email, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-900">{email}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSpamAclForm({
                            ...spamAclForm,
                            blacklist: spamAclForm.blacklist.filter((_, i) => i !== index),
                          });
                        }}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowSpamAclModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spam Custom Config Modal */}
      {showSpamCustomConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Spam Custom Config</h3>
            <form onSubmit={handleSetSpamCustomConfig} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Config</label>
                <textarea
                  value={spamCustomConfigForm.config}
                  onChange={(e) => setSpamCustomConfigForm({ config: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-600 focus:border-purple-600 font-mono text-sm"
                  rows={10}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowSpamCustomConfigModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DNSBL Config Modal */}
      {showDnsblConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Manage DNSBL Zones</h3>
            <form onSubmit={handleSetDnsblConfig} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Add Zone</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={dnsblConfigForm.newZone}
                    onChange={(e) => setDnsblConfigForm({ ...dnsblConfigForm, newZone: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-600 focus:border-purple-600"
                    placeholder="zen.spamhaus.org"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (dnsblConfigForm.newZone && !dnsblConfigForm.zones.includes(dnsblConfigForm.newZone)) {
                        setDnsblConfigForm({
                          ...dnsblConfigForm,
                          zones: [...dnsblConfigForm.zones, dnsblConfigForm.newZone],
                          newZone: '',
                        });
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DNSBL Zones</label>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {dnsblConfigForm.zones.map((zone, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-900">{zone}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setDnsblConfigForm({
                            ...dnsblConfigForm,
                            zones: dnsblConfigForm.zones.filter((_, i) => i !== index),
                          });
                        }}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowDnsblConfigModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
