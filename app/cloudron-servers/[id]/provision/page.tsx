'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cloudronAPI } from '@/lib/api';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';

export default function CloudronProvisionPage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [server, setServer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'setup' | 'restore' | 'admin'>('setup');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Setup form state
  const [setupForm, setSetupForm] = useState({
    domainConfig: {
      provider: '',
      domain: '',
      zoneName: '',
      config: {},
      tlsConfig: {
        provider: 'letsencrypt-prod',
        wildcard: false
      }
    },
    ipv4Config: {},
    ipv6Config: {}
  });

  // Restore form state
  const [restoreForm, setRestoreForm] = useState({
    backupConfig: {
      provider: 'AWS',
      format: 'tar',
      password: ''
    },
    encryptedFilenames: true,
    remotePath: '',
    version: '1.0.0',
    ipv4Config: {},
    ipv6Config: {},
    skipDnsSetup: false
  });

  // Admin form state
  const [adminForm, setAdminForm] = useState({
    username: '',
    password: '',
    email: '',
    displayName: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    setUser(JSON.parse(userData));
    fetchServer();
  }, []);

  const fetchServer = async () => {
    try {
      setLoading(true);
      const response = await cloudronAPI.getServer(serverId);
      setServer(response.data.data);
    } catch (error: any) {
      console.error('Error fetching server:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch server');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      // Validate required fields
      if (!setupForm.domainConfig.provider || !setupForm.domainConfig.domain) {
        toast.error('Provider and domain are required');
        return;
      }

      await cloudronAPI.provisionSetup(serverId, setupForm);
      toast.success('Provision setup completed successfully!');

      // Reset form
      setSetupForm({
        domainConfig: {
          provider: '',
          domain: '',
          zoneName: '',
          config: {},
          tlsConfig: {
            provider: 'letsencrypt-prod',
            wildcard: false
          }
        },
        ipv4Config: {},
        ipv6Config: {}
      });
    } catch (error: any) {
      console.error('Error in provision setup:', error);
      toast.error(error.response?.data?.message || 'Failed to setup provision');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      // Validate required fields
      if (!restoreForm.backupConfig.provider || !restoreForm.remotePath) {
        toast.error('Backup provider and remote path are required');
        return;
      }

      await cloudronAPI.provisionRestore(serverId, restoreForm);
      toast.success('Provision restore initiated successfully!');

      // Reset form
      setRestoreForm({
        backupConfig: {
          provider: 'AWS',
          format: 'tar',
          password: ''
        },
        encryptedFilenames: true,
        remotePath: '',
        version: '1.0.0',
        ipv4Config: {},
        ipv6Config: {},
        skipDnsSetup: false
      });
    } catch (error: any) {
      console.error('Error in provision restore:', error);
      toast.error(error.response?.data?.message || 'Failed to restore from backup');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      // Validate required fields
      if (!adminForm.username || !adminForm.password || !adminForm.email) {
        toast.error('Username, password, and email are required');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(adminForm.email)) {
        toast.error('Invalid email format');
        return;
      }

      // Validate password strength
      if (adminForm.password.length < 8) {
        toast.error('Password must be at least 8 characters long');
        return;
      }

      await cloudronAPI.provisionCreateAdmin(serverId, adminForm);
      toast.success('Admin account created successfully!');

      // Reset form
      setAdminForm({
        username: '',
        password: '',
        email: '',
        displayName: ''
      });
    } catch (error: any) {
      console.error('Error creating admin:', error);
      toast.error(error.response?.data?.message || 'Failed to create admin account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} />
      <NavigationMenu />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link href="/cloudron-servers" className="hover:text-purple-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Servers
            </Link>
            {server && (
              <>
                <span>/</span>
                <Link href={`/cloudron-servers/${serverId}`} className="hover:text-purple-600">
                  {server.domain}
                </Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">Provision</span>
              </>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {/* Page Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Provision Management</h1>
                <p className="text-sm text-gray-600 mt-1">Configure and manage Cloudron server provision</p>
                {server && <p className="text-xs text-gray-500 mt-2">Server: {server.domain}</p>}
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab('setup')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'setup'
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Setup
                    </button>
                    <button
                      onClick={() => setActiveTab('restore')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'restore'
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => setActiveTab('admin')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'admin'
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Create Admin
                    </button>
                  </nav>
                </div>

                <div className="p-6">
                  {/* Setup Tab */}
                  {activeTab === 'setup' && (
                    <form onSubmit={handleSetupSubmit} className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Domain Configuration</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Provider <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={setupForm.domainConfig.provider}
                              onChange={(e) => setSetupForm({
                                ...setupForm,
                                domainConfig: { ...setupForm.domainConfig, provider: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                              placeholder="e.g., cloudflare, route53, gcp"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Domain <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={setupForm.domainConfig.domain}
                              onChange={(e) => setSetupForm({
                                ...setupForm,
                                domainConfig: { ...setupForm.domainConfig, domain: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                              placeholder="example.com"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Zone Name
                            </label>
                            <input
                              type="text"
                              value={setupForm.domainConfig.zoneName}
                              onChange={(e) => setSetupForm({
                                ...setupForm,
                                domainConfig: { ...setupForm.domainConfig, zoneName: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                              placeholder="Optional zone name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              TLS Provider
                            </label>
                            <select
                              value={setupForm.domainConfig.tlsConfig.provider}
                              onChange={(e) => setSetupForm({
                                ...setupForm,
                                domainConfig: {
                                  ...setupForm.domainConfig,
                                  tlsConfig: { ...setupForm.domainConfig.tlsConfig, provider: e.target.value }
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                            >
                              <option value="letsencrypt-prod">Let's Encrypt Production</option>
                              <option value="letsencrypt-staging">Let's Encrypt Staging</option>
                              <option value="zerossl-prod">ZeroSSL Production</option>
                            </select>
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={setupForm.domainConfig.tlsConfig.wildcard}
                              onChange={(e) => setSetupForm({
                                ...setupForm,
                                domainConfig: {
                                  ...setupForm.domainConfig,
                                  tlsConfig: { ...setupForm.domainConfig.tlsConfig, wildcard: e.target.checked }
                                }
                              })}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">Wildcard Certificate</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                          type="button"
                          onClick={() => router.back()}
                          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          disabled={submitting}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? 'Provisioning...' : 'Provision Setup'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Restore Tab */}
                  {activeTab === 'restore' && (
                    <form onSubmit={handleRestoreSubmit} className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Backup Configuration</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Backup Provider <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={restoreForm.backupConfig.provider}
                              onChange={(e) => setRestoreForm({
                                ...restoreForm,
                                backupConfig: { ...restoreForm.backupConfig, provider: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                              required
                            >
                              <option value="AWS">AWS S3</option>
                              <option value="GCP">Google Cloud Storage</option>
                              <option value="Azure">Azure Blob Storage</option>
                              <option value="filesystem">Local Filesystem</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Backup Format
                            </label>
                            <select
                              value={restoreForm.backupConfig.format}
                              onChange={(e) => setRestoreForm({
                                ...restoreForm,
                                backupConfig: { ...restoreForm.backupConfig, format: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                            >
                              <option value="tar">TAR</option>
                              <option value="tgz">TGZ</option>
                              <option value="rsync">Rsync</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Remote Path <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={restoreForm.remotePath}
                              onChange={(e) => setRestoreForm({ ...restoreForm, remotePath: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                              placeholder="s3://mybucket/backups/"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Backup Password
                            </label>
                            <input
                              type="password"
                              value={restoreForm.backupConfig.password}
                              onChange={(e) => setRestoreForm({
                                ...restoreForm,
                                backupConfig: { ...restoreForm.backupConfig, password: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                              placeholder="Enter backup password"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Version
                            </label>
                            <input
                              type="text"
                              value={restoreForm.version}
                              onChange={(e) => setRestoreForm({ ...restoreForm, version: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                              placeholder="1.0.0"
                            />
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={restoreForm.encryptedFilenames}
                              onChange={(e) => setRestoreForm({ ...restoreForm, encryptedFilenames: e.target.checked })}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">Encrypted Filenames</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={restoreForm.skipDnsSetup}
                              onChange={(e) => setRestoreForm({ ...restoreForm, skipDnsSetup: e.target.checked })}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">Skip DNS Setup</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                          type="button"
                          onClick={() => router.back()}
                          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          disabled={submitting}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? 'Restoring...' : 'Restore from Backup'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Create Admin Tab */}
                  {activeTab === 'admin' && (
                    <form onSubmit={handleAdminSubmit} className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Admin Account Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Username <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={adminForm.username}
                              onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                              placeholder="admin"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="email"
                              value={adminForm.email}
                              onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                              placeholder="admin@example.com"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Password <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="password"
                              value={adminForm.password}
                              onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                              placeholder="Minimum 8 characters"
                              minLength={8}
                              required
                            />
                            <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Display Name
                            </label>
                            <input
                              type="text"
                              value={adminForm.displayName}
                              onChange={(e) => setAdminForm({ ...adminForm, displayName: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                              placeholder="Administrator"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-blue-900">Important Information</h4>
                            <p className="text-sm text-blue-800 mt-1">
                              This will create the initial admin account for your Cloudron server. Make sure to use a strong password and keep the credentials secure.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                          type="button"
                          onClick={() => router.back()}
                          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          disabled={submitting}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? 'Creating...' : 'Create Admin Account'}
                        </button>
                      </div>
                    </form>
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
