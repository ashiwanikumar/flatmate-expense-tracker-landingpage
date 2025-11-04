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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Provision form state
  const [provisionForm, setProvisionForm] = useState({
    // Domain config
    domain: '',
    provider: 'manual',
    zoneName: '',
    config: {} as any,
    tlsProvider: 'letsencrypt-prod',
    wildcard: false,
    fallbackCertificate: '',

    // IPv4 config
    ipv4Provider: 'manual',
    ipv4Address: '',

    // IPv6 config
    ipv6Provider: 'manual',
    ipv6Address: ''
  });

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
      const serverRes = await cloudronAPI.getServer(serverId);
      setServer(serverRes.data.data);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch server data');
    } finally {
      setLoading(false);
    }
  };

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const provisionData = {
        domainConfig: {
          domain: provisionForm.domain,
          provider: provisionForm.provider,
          zoneName: provisionForm.zoneName || provisionForm.domain,
          config: provisionForm.config,
          tlsConfig: {
            provider: provisionForm.tlsProvider,
            wildcard: provisionForm.wildcard,
            ...(provisionForm.fallbackCertificate && {
              fallbackCertificate: provisionForm.fallbackCertificate
            })
          }
        },
        ipv4Config: {
          provider: provisionForm.ipv4Provider,
          ...(provisionForm.ipv4Address && { ip: provisionForm.ipv4Address })
        },
        ipv6Config: {
          provider: provisionForm.ipv6Provider,
          ...(provisionForm.ipv6Address && { ip: provisionForm.ipv6Address })
        }
      };

      await cloudronAPI.configureInitialDomain(serverId, provisionData);
      toast.success('Domain provisioned successfully!');
      router.push(`/cloudron-servers/${serverId}`);
    } catch (error: any) {
      console.error('Error provisioning domain:', error);
      toast.error(error.response?.data?.message || 'Failed to provision domain');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} />
      <NavigationMenu />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
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
            <span className="text-gray-900">Provision</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {/* Page Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Provision Initial Domain</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Configure the initial domain settings for your Cloudron server
                </p>
              </div>

              {/* Provision Form */}
              <form onSubmit={handleProvision} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                {/* Domain Configuration */}
                <div className="border-b pb-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Domain Configuration</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Domain <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={provisionForm.domain}
                        onChange={(e) => setProvisionForm({ ...provisionForm, domain: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="example.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">DNS Provider</label>
                      <select
                        value={provisionForm.provider}
                        onChange={(e) => setProvisionForm({ ...provisionForm, provider: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="manual">Manual</option>
                        <option value="route53">AWS Route53</option>
                        <option value="cloudflare">Cloudflare</option>
                        <option value="gandi">Gandi</option>
                        <option value="godaddy">GoDaddy</option>
                        <option value="digitalocean">DigitalOcean</option>
                        <option value="googleclouddns">Google Cloud DNS</option>
                        <option value="namecheap">Namecheap</option>
                        <option value="namecom">Name.com</option>
                        <option value="vultr">Vultr</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
                      <input
                        type="text"
                        value={provisionForm.zoneName}
                        onChange={(e) => setProvisionForm({ ...provisionForm, zoneName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Defaults to domain"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">TLS Provider</label>
                      <select
                        value={provisionForm.tlsProvider}
                        onChange={(e) => setProvisionForm({ ...provisionForm, tlsProvider: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="letsencrypt-prod">Let's Encrypt (Production)</option>
                        <option value="letsencrypt-staging">Let's Encrypt (Staging)</option>
                        <option value="zerossl-prod">ZeroSSL (Production)</option>
                        <option value="zerossl-staging">ZeroSSL (Staging)</option>
                        <option value="fallback">Fallback Certificate</option>
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="wildcard"
                        checked={provisionForm.wildcard}
                        onChange={(e) => setProvisionForm({ ...provisionForm, wildcard: e.target.checked })}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="wildcard" className="ml-2 block text-sm text-gray-700">
                        Use Wildcard Certificate
                      </label>
                    </div>

                    {provisionForm.tlsProvider === 'fallback' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fallback Certificate (PEM format)
                        </label>
                        <textarea
                          value={provisionForm.fallbackCertificate}
                          onChange={(e) => setProvisionForm({ ...provisionForm, fallbackCertificate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          rows={6}
                          placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* IPv4 Configuration */}
                <div className="border-b pb-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">IPv4 Configuration</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">IPv4 Provider</label>
                      <select
                        value={provisionForm.ipv4Provider}
                        onChange={(e) => setProvisionForm({ ...provisionForm, ipv4Provider: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="manual">Manual</option>
                        <option value="auto">Auto-detect</option>
                        <option value="netlink">Netlink</option>
                      </select>
                    </div>

                    {provisionForm.ipv4Provider === 'manual' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">IPv4 Address</label>
                        <input
                          type="text"
                          value={provisionForm.ipv4Address}
                          onChange={(e) => setProvisionForm({ ...provisionForm, ipv4Address: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="192.0.2.1"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* IPv6 Configuration */}
                <div className="pb-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">IPv6 Configuration</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">IPv6 Provider</label>
                      <select
                        value={provisionForm.ipv6Provider}
                        onChange={(e) => setProvisionForm({ ...provisionForm, ipv6Provider: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="manual">Manual</option>
                        <option value="auto">Auto-detect</option>
                        <option value="netlink">Netlink</option>
                      </select>
                    </div>

                    {provisionForm.ipv6Provider === 'manual' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">IPv6 Address</label>
                        <input
                          type="text"
                          value={provisionForm.ipv6Address}
                          onChange={(e) => setProvisionForm({ ...provisionForm, ipv6Address: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="2001:db8::1"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Provisioning...' : 'Provision Domain'}
                  </button>
                  <Link
                    href={`/cloudron-servers/${serverId}`}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </Link>
                </div>
              </form>

              {/* Info Box */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-blue-900 mb-2">ℹ️ Important Notes</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Provisioning sets up the initial domain configuration for your Cloudron server</li>
                  <li>Make sure DNS records are properly configured before provisioning</li>
                  <li>This operation may take several minutes to complete</li>
                  <li>Only administrators can perform this operation</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
