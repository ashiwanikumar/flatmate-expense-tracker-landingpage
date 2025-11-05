'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cloudronAPI } from '@/lib/api';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';
import Footer from '@/components/Footer';

export default function ReverseProxyPage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [server, setServer] = useState<any>(null);
  const [trustedIps, setTrustedIps] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [renewingCerts, setRenewingCerts] = useState(false);
  const [rebuildNginx, setRebuildNginx] = useState(false);

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
      const [serverRes, trustedIpsRes] = await Promise.allSettled([
        cloudronAPI.getServer(serverId),
        cloudronAPI.getTrustedIps(serverId),
      ]);

      if (serverRes.status === 'fulfilled') {
        setServer(serverRes.value.data.data);
      }
      if (trustedIpsRes.status === 'fulfilled') {
        setTrustedIps(trustedIpsRes.value.data.data.trustedIps || '');
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTrustedIps = async () => {
    try {
      setSaving(true);
      await cloudronAPI.setTrustedIps(serverId, trustedIps);
      toast.success('Trusted IPs updated successfully!');
    } catch (error: any) {
      console.error('Error updating trusted IPs:', error);
      toast.error(error.response?.data?.message || 'Failed to update trusted IPs');
    } finally {
      setSaving(false);
    }
  };

  const handleRenewCerts = async () => {
    try {
      setRenewingCerts(true);
      const response = await cloudronAPI.renewCerts(serverId, rebuildNginx);
      toast.success(
        `Certificate renewal triggered successfully! Task ID: ${response.data.data.taskId}`
      );
    } catch (error: any) {
      console.error('Error renewing certificates:', error);
      toast.error(error.response?.data?.message || 'Failed to renew certificates');
    } finally {
      setRenewingCerts(false);
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
            <Link href="/cloudron-servers" className="hover:text-purple-600">
              Servers
            </Link>
            <span>/</span>
            <Link
              href={`/cloudron-servers/${serverId}`}
              className="hover:text-purple-600"
            >
              {server?.domain || serverId}
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Reverse Proxy</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      Reverse Proxy Configuration
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                      Manage nginx config and TLS certificates for {server?.domain}
                    </p>
                  </div>
                </div>
              </div>

              {/* Certificate Renewal Section */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      TLS Certificate Renewal
                    </h2>
                    <p className="text-sm text-gray-600">
                      Trigger manual renewal of Let's Encrypt certificates. Note that
                      certificates are automatically renewed by Cloudron, 1 month before
                      their expiry.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="rebuildNginx"
                      checked={rebuildNginx}
                      onChange={(e) => setRebuildNginx(e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="rebuildNginx"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Rebuild nginx configurations
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    When set, all the nginx configurations are regenerated.
                  </p>

                  <button
                    onClick={handleRenewCerts}
                    disabled={renewingCerts}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      renewingCerts
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                    }`}
                  >
                    {renewingCerts ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Renewing...
                      </span>
                    ) : (
                      'Renew Certificates'
                    )}
                  </button>
                </div>
              </div>

              {/* Trusted IPs Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Trusted IPs
                  </h2>
                  <p className="text-sm text-gray-600">
                    Configure the list of proxies in front of Cloudron. Cloudron will
                    trust the various reverse proxy headers like X-Forwarded-For when
                    requests originate from these proxy addresses.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trusted IP Addresses
                    </label>
                    <textarea
                      value={trustedIps}
                      onChange={(e) => setTrustedIps(e.target.value)}
                      rows={10}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent font-mono text-sm text-gray-900"
                      placeholder="# This is a IPv4 range&#10;5.75.0.0/16&#10;# This is an IPv6 address&#10;2604:a880:1:4a::2:7000"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Newline separated list of IP entries. Each entry is an IP address
                      or an IP address range in CIDR notation. Lines starting with # are
                      treated as comments.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveTrustedIps}
                      disabled={saving}
                      className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                        saving
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                      }`}
                    >
                      {saving ? (
                        <span className="flex items-center gap-2">
                          <svg
                            className="animate-spin h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Saving...
                        </span>
                      ) : (
                        'Save Trusted IPs'
                      )}
                    </button>
                    <button
                      onClick={() => setTrustedIps('')}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      About Reverse Proxy Settings
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        The Reverse Proxy manages the nginx config and TLS certificates
                        for your Cloudron server. Use these settings to:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Manually renew Let's Encrypt TLS certificates</li>
                        <li>
                          Configure trusted proxy IP addresses for proper header forwarding
                        </li>
                        <li>Rebuild nginx configurations when needed</li>
                      </ul>
                    </div>
                  </div>
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
