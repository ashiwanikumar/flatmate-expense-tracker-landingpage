'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cloudronAPI } from '@/lib/api';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';
import Footer from '@/components/Footer';

const DNS_PROVIDERS = [
  { value: 'route53', label: 'AWS Route53' },
  { value: 'cloudflare', label: 'Cloudflare' },
  { value: 'digitalocean', label: 'DigitalOcean' },
  { value: 'gandi', label: 'Gandi LiveDNS' },
  { value: 'godaddy', label: 'GoDaddy' },
  { value: 'gcdns', label: 'Google Cloud DNS' },
  { value: 'hetzner', label: 'Hetzner' },
  { value: 'linode', label: 'Linode' },
  { value: 'namecom', label: 'Name.com' },
  { value: 'namecheap', label: 'Namecheap' },
  { value: 'netcup', label: 'Netcup' },
  { value: 'ovh', label: 'OVH' },
  { value: 'vultr', label: 'Vultr' },
  { value: 'wildcard', label: 'Wildcard' },
  { value: 'manual', label: 'Manual' },
  { value: 'noop', label: 'No-op' },
];

export default function DomainsPage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [server, setServer] = useState<any>(null);
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<any>(null);
  const [addingDomain, setAddingDomain] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [domainForm, setDomainForm] = useState({
    domain: '',
    zoneName: '',
    provider: 'cloudflare',
    tlsProvider: 'letsencrypt-prod',
    wildcard: false,
    config: {} as any,
  });

  const [syncForm, setSyncForm] = useState({
    domain: '',
    type: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    setUser(JSON.parse(userData));
    fetchServerAndDomains();
  }, []);

  const fetchServerAndDomains = async () => {
    try {
      setLoading(true);
      const [serverRes, domainsRes] = await Promise.all([
        cloudronAPI.getServer(serverId),
        cloudronAPI.getDomains(serverId),
      ]);
      setServer(serverRes.data.data);
      setDomains(domainsRes.data.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!domainForm.domain || !domainForm.provider) {
      toast.error('Domain and provider are required');
      return;
    }

    setAddingDomain(true);
    try {
      const payload = {
        domain: domainForm.domain,
        zoneName: domainForm.zoneName || domainForm.domain,
        provider: domainForm.provider,
        tlsConfig: {
          provider: domainForm.tlsProvider,
          wildcard: domainForm.wildcard,
        },
        config: domainForm.config,
      };

      await cloudronAPI.addDomain(serverId, payload);
      toast.success('Domain added successfully!');
      setShowAddModal(false);
      resetDomainForm();
      fetchServerAndDomains();
    } catch (error: any) {
      console.error('Error adding domain:', error);
      toast.error(error.response?.data?.message || 'Failed to add domain');
    } finally {
      setAddingDomain(false);
    }
  };

  const handleDeleteDomain = async (domain: string) => {
    if (!confirm(`Are you sure you want to delete domain "${domain}"?`)) {
      return;
    }

    try {
      await cloudronAPI.deleteDomain(serverId, domain);
      toast.success('Domain deleted successfully!');
      fetchServerAndDomains();
    } catch (error: any) {
      console.error('Error deleting domain:', error);
      toast.error(error.response?.data?.message || 'Failed to delete domain');
    }
  };

  const handleSyncDns = async (e: React.FormEvent) => {
    e.preventDefault();

    setSyncing(true);
    try {
      const result = await cloudronAPI.syncDns(serverId, syncForm);
      toast.success(`DNS sync initiated! Task ID: ${result.data.data.taskId}`);
      setShowSyncModal(false);
      setSyncForm({ domain: '', type: '' });
    } catch (error: any) {
      console.error('Error syncing DNS:', error);
      toast.error(error.response?.data?.message || 'Failed to sync DNS');
    } finally {
      setSyncing(false);
    }
  };

  const resetDomainForm = () => {
    setDomainForm({
      domain: '',
      zoneName: '',
      provider: 'cloudflare',
      tlsProvider: 'letsencrypt-prod',
      wildcard: false,
      config: {},
    });
  };

  const renderConfigInput = () => {
    switch (domainForm.provider) {
      case 'cloudflare':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={domainForm.config.email || ''}
                onChange={(e) =>
                  setDomainForm({
                    ...domainForm,
                    config: { ...domainForm.config, email: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
              <input
                type="password"
                value={domainForm.config.apiKey || ''}
                onChange={(e) =>
                  setDomainForm({
                    ...domainForm,
                    config: { ...domainForm.config, apiKey: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="Cloudflare API Key"
              />
            </div>
          </div>
        );
      case 'route53':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Access Key ID</label>
              <input
                type="text"
                value={domainForm.config.accessKeyId || ''}
                onChange={(e) =>
                  setDomainForm({
                    ...domainForm,
                    config: { ...domainForm.config, accessKeyId: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="AWS Access Key ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secret Access Key</label>
              <input
                type="password"
                value={domainForm.config.secretAccessKey || ''}
                onChange={(e) =>
                  setDomainForm({
                    ...domainForm,
                    config: { ...domainForm.config, secretAccessKey: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="AWS Secret Access Key"
              />
            </div>
          </div>
        );
      case 'digitalocean':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API Token</label>
            <input
              type="password"
              value={domainForm.config.token || ''}
              onChange={(e) =>
                setDomainForm({
                  ...domainForm,
                  config: { ...domainForm.config, token: e.target.value },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="DigitalOcean API Token"
            />
          </div>
        );
      default:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API Token / Key</label>
            <textarea
              value={JSON.stringify(domainForm.config, null, 2)}
              onChange={(e) => {
                try {
                  setDomainForm({ ...domainForm, config: JSON.parse(e.target.value) });
                } catch (err) {
                  // Invalid JSON, ignore
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-mono text-sm"
              rows={4}
              placeholder='{"key": "value"}'
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} />
      <NavigationMenu />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <Link href="/cloudron-servers" className="hover:text-purple-600">
                Cloudron Servers
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">{server?.domain || 'Domains'}</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Domains</h1>
                <p className="mt-2 text-sm text-gray-600">Manage domains for {server?.domain}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSyncModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
                >
                  Sync DNS
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
                >
                  Add Domain
                </button>
              </div>
            </div>
          </div>

          {/* Domains List */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : domains.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Domains</h3>
              <p className="text-gray-500 mb-4">Add your first domain to get started</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
              >
                Add Domain
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {domains.map((domain) => (
                <div key={domain.domain} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{domain.domain}</h3>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          {domain.provider}
                        </span>
                        {domain.tlsConfig?.wildcard && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Wildcard
                          </span>
                        )}
                      </div>
                      {domain.zoneName && domain.zoneName !== domain.domain && (
                        <p className="text-sm text-gray-500 mb-2">Zone: {domain.zoneName}</p>
                      )}
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>TLS: {domain.tlsConfig?.provider || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/cloudron-servers/${serverId}/mail/${encodeURIComponent(domain.domain)}`}
                        className="px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors text-sm font-medium"
                        title="Mail Configuration"
                      >
                        Mail Config
                      </Link>
                      <button
                        onClick={() => handleDeleteDomain(domain.domain)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                        title="Delete Domain"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Domain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">Add Domain</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddDomain} className="px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domain <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={domainForm.domain}
                    onChange={(e) => setDomainForm({ ...domainForm, domain: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Zone Name</label>
                  <input
                    type="text"
                    value={domainForm.zoneName}
                    onChange={(e) => setDomainForm({ ...domainForm, zoneName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="Leave empty to use domain"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DNS Provider <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={domainForm.provider}
                    onChange={(e) => setDomainForm({ ...domainForm, provider: e.target.value, config: {} })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  >
                    {DNS_PROVIDERS.map((provider) => (
                      <option key={provider.value} value={provider.value}>
                        {provider.label}
                      </option>
                    ))}
                  </select>
                </div>

                {renderConfigInput()}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">TLS Provider</label>
                  <select
                    value={domainForm.tlsProvider}
                    onChange={(e) => setDomainForm({ ...domainForm, tlsProvider: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  >
                    <option value="letsencrypt-prod">Let's Encrypt (Production)</option>
                    <option value="letsencrypt-staging">Let's Encrypt (Staging)</option>
                    <option value="fallback">Fallback</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="wildcard"
                    checked={domainForm.wildcard}
                    onChange={(e) => setDomainForm({ ...domainForm, wildcard: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="wildcard" className="ml-2 text-sm text-gray-700">
                    Enable wildcard certificate
                  </label>
                </div>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={addingDomain}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDomain}
                disabled={addingDomain}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-medium"
              >
                {addingDomain ? 'Adding...' : 'Add Domain'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync DNS Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Sync DNS Records</h3>
            </div>

            <form onSubmit={handleSyncDns} className="px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Domain (Optional)</label>
                  <select
                    value={syncForm.domain}
                    onChange={(e) => setSyncForm({ ...syncForm, domain: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  >
                    <option value="">All Domains</option>
                    {domains.map((d) => (
                      <option key={d.domain} value={d.domain}>
                        {d.domain}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type (Optional)</label>
                  <select
                    value={syncForm.type}
                    onChange={(e) => setSyncForm({ ...syncForm, type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  >
                    <option value="">All Records</option>
                    <option value="mail">Mail Records Only</option>
                  </select>
                </div>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowSyncModal(false)}
                disabled={syncing}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSyncDns}
                disabled={syncing}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                {syncing ? 'Syncing...' : 'Sync DNS'}
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
