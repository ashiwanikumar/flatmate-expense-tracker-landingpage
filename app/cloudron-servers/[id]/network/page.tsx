'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cloudronAPI } from '@/lib/api';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';
import Footer from '@/components/Footer';

export default function NetworkConfigPage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [server, setServer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Network state
  const [blocklist, setBlocklist] = useState('');
  const [dynamicDns, setDynamicDns] = useState(false);
  const [ipv4Config, setIpv4Config] = useState<any>(null);
  const [ipv6Config, setIpv6Config] = useState<any>(null);
  const [ipv4Address, setIpv4Address] = useState('');
  const [ipv6Address, setIpv6Address] = useState('');

  // Edit mode states
  const [editingBlocklist, setEditingBlocklist] = useState(false);
  const [editingIpv4, setEditingIpv4] = useState(false);
  const [editingIpv6, setEditingIpv6] = useState(false);

  // Form states
  const [blocklistForm, setBlocklistForm] = useState('');
  const [ipv4Form, setIpv4Form] = useState({ provider: 'generic', ip: '' });
  const [ipv6Form, setIpv6Form] = useState({ provider: 'generic', ip: '' });

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
      const [serverRes, blocklistRes, dynamicDnsRes, ipv4ConfigRes, ipv6ConfigRes, ipv4AddrRes, ipv6AddrRes] = await Promise.allSettled([
        cloudronAPI.getServer(serverId),
        cloudronAPI.getBlocklist(serverId),
        cloudronAPI.getDynamicDns(serverId),
        cloudronAPI.getIpv4Config(serverId),
        cloudronAPI.getIpv6Config(serverId),
        cloudronAPI.getIpv4Address(serverId),
        cloudronAPI.getIpv6Address(serverId),
      ]);

      if (serverRes.status === 'fulfilled') {
        setServer(serverRes.value.data.data);
      }
      if (blocklistRes.status === 'fulfilled') {
        setBlocklist(blocklistRes.value.data.data.blocklist || '');
        setBlocklistForm(blocklistRes.value.data.data.blocklist || '');
      }
      if (dynamicDnsRes.status === 'fulfilled') {
        setDynamicDns(dynamicDnsRes.value.data.data.enabled || false);
      }
      if (ipv4ConfigRes.status === 'fulfilled') {
        setIpv4Config(ipv4ConfigRes.value.data.data);
        setIpv4Form({
          provider: ipv4ConfigRes.value.data.data.provider || 'generic',
          ip: ipv4ConfigRes.value.data.data.ip || ''
        });
      }
      if (ipv6ConfigRes.status === 'fulfilled') {
        setIpv6Config(ipv6ConfigRes.value.data.data);
        setIpv6Form({
          provider: ipv6ConfigRes.value.data.data.provider || 'generic',
          ip: ipv6ConfigRes.value.data.data.ip || ''
        });
      }
      if (ipv4AddrRes.status === 'fulfilled') {
        setIpv4Address(ipv4AddrRes.value.data.data.ip || 'N/A');
      }
      if (ipv6AddrRes.status === 'fulfilled') {
        setIpv6Address(ipv6AddrRes.value.data.data.ip || 'N/A');
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDynamicDns = async () => {
    try {
      await cloudronAPI.setDynamicDns(serverId, !dynamicDns);
      toast.success(`Dynamic DNS ${!dynamicDns ? 'enabled' : 'disabled'} successfully!`);
      setDynamicDns(!dynamicDns);
    } catch (error: any) {
      console.error('Error toggling dynamic DNS:', error);
      toast.error(error.response?.data?.message || 'Failed to update dynamic DNS');
    }
  };

  const handleSaveBlocklist = async () => {
    try {
      await cloudronAPI.setBlocklist(serverId, blocklistForm);
      toast.success('Blocklist updated successfully!');
      setBlocklist(blocklistForm);
      setEditingBlocklist(false);
    } catch (error: any) {
      console.error('Error saving blocklist:', error);
      toast.error(error.response?.data?.message || 'Failed to save blocklist');
    }
  };

  const handleSaveIpv4Config = async () => {
    try {
      await cloudronAPI.setIpv4Config(serverId, ipv4Form);
      toast.success('IPv4 configuration updated successfully!');
      setIpv4Config(ipv4Form);
      setEditingIpv4(false);
      // Refresh IP address
      const res = await cloudronAPI.getIpv4Address(serverId);
      setIpv4Address(res.data.data.ip || 'N/A');
    } catch (error: any) {
      console.error('Error saving IPv4 config:', error);
      toast.error(error.response?.data?.message || 'Failed to save IPv4 configuration');
    }
  };

  const handleSaveIpv6Config = async () => {
    try {
      await cloudronAPI.setIpv6Config(serverId, ipv6Form);
      toast.success('IPv6 configuration updated successfully!');
      setIpv6Config(ipv6Form);
      setEditingIpv6(false);
      // Refresh IP address
      const res = await cloudronAPI.getIpv6Address(serverId);
      setIpv6Address(res.data.data.ip || 'N/A');
    } catch (error: any) {
      console.error('Error saving IPv6 config:', error);
      toast.error(error.response?.data?.message || 'Failed to save IPv6 configuration');
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
            <span>/</span>
            <Link href={`/cloudron-servers/${serverId}`} className="hover:text-purple-600">
              {server?.domain || 'Server'}
            </Link>
            <span>/</span>
            <span className="text-purple-600 font-medium">Network Configuration</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {/* Server Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Network Configuration</h1>
                <p className="text-sm text-gray-600">{server?.domain} - {server?.serverUrl}</p>
              </div>

              {/* IP Addresses Card */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Current IP Addresses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 mb-1">IPv4 Address</p>
                    <p className="text-2xl font-bold text-blue-900 font-mono">{ipv4Address}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600 mb-1">IPv6 Address</p>
                    <p className="text-lg font-bold text-purple-900 font-mono break-all">{ipv6Address}</p>
                  </div>
                </div>
              </div>

              {/* Dynamic DNS Card */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Dynamic DNS</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Keep DNS records in sync when IP address changes dynamically (e.g., home networks)
                    </p>
                  </div>
                  <button
                    onClick={handleToggleDynamicDns}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      dynamicDns
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {dynamicDns ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>

              {/* IPv4 Configuration Card */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">IPv4 Configuration</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Configure how IPv4 address is determined for DNS A records
                    </p>
                  </div>
                  {!editingIpv4 && (
                    <button
                      onClick={() => setEditingIpv4(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {editingIpv4 ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                      <select
                        value={ipv4Form.provider}
                        onChange={(e) => setIpv4Form({ ...ipv4Form, provider: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
                      >
                        <option value="noop">Noop - Disable DNS record</option>
                        <option value="fixed">Fixed - Use static IP</option>
                        <option value="interface">Interface - Use IP from network interface</option>
                        <option value="generic">Generic - Auto-detect public IP</option>
                      </select>
                    </div>

                    {ipv4Form.provider === 'fixed' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">IP Address</label>
                        <input
                          type="text"
                          value={ipv4Form.ip}
                          onChange={(e) => setIpv4Form({ ...ipv4Form, ip: e.target.value })}
                          placeholder="e.g., 192.168.1.100"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveIpv4Config}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingIpv4(false);
                          setIpv4Form({
                            provider: ipv4Config?.provider || 'generic',
                            ip: ipv4Config?.ip || ''
                          });
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Provider: </span>
                      <span className="font-medium text-gray-900">{ipv4Config?.provider || 'N/A'}</span>
                    </div>
                    {ipv4Config?.provider === 'fixed' && ipv4Config?.ip && (
                      <div>
                        <span className="text-sm text-gray-600">IP Address: </span>
                        <span className="font-medium text-gray-900 font-mono">{ipv4Config.ip}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* IPv6 Configuration Card */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">IPv6 Configuration</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Configure how IPv6 address is determined for DNS AAAA records
                    </p>
                  </div>
                  {!editingIpv6 && (
                    <button
                      onClick={() => setEditingIpv6(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {editingIpv6 ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                      <select
                        value={ipv6Form.provider}
                        onChange={(e) => setIpv6Form({ ...ipv6Form, provider: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
                      >
                        <option value="noop">Noop - Disable DNS record</option>
                        <option value="fixed">Fixed - Use static IP</option>
                        <option value="interface">Interface - Use IP from network interface</option>
                        <option value="generic">Generic - Auto-detect public IP</option>
                      </select>
                    </div>

                    {ipv6Form.provider === 'fixed' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">IP Address</label>
                        <input
                          type="text"
                          value={ipv6Form.ip}
                          onChange={(e) => setIpv6Form({ ...ipv6Form, ip: e.target.value })}
                          placeholder="e.g., 2001:0db8:85a3::8a2e:0370:7334"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveIpv6Config}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingIpv6(false);
                          setIpv6Form({
                            provider: ipv6Config?.provider || 'generic',
                            ip: ipv6Config?.ip || ''
                          });
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Provider: </span>
                      <span className="font-medium text-gray-900">{ipv6Config?.provider || 'N/A'}</span>
                    </div>
                    {ipv6Config?.provider === 'fixed' && ipv6Config?.ip && (
                      <div>
                        <span className="text-sm text-gray-600">IP Address: </span>
                        <span className="font-medium text-gray-900 font-mono">{ipv6Config.ip}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* IP Blocklist Card */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">IP Address Blocklist</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Block requests from specific IP addresses or ranges (CIDR notation). Lines starting with # are comments.
                    </p>
                  </div>
                  {!editingBlocklist && (
                    <button
                      onClick={() => setEditingBlocklist(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {editingBlocklist ? (
                  <div>
                    <textarea
                      value={blocklistForm}
                      onChange={(e) => setBlocklistForm(e.target.value)}
                      placeholder="# IPv4 range&#10;5.75.0.0/16&#10;# IPv6 address&#10;2604:a880:1:4a::2:7000"
                      rows={10}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent font-mono text-sm text-gray-900"
                    />
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleSaveBlocklist}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingBlocklist(false);
                          setBlocklistForm(blocklist);
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {blocklist ? (
                      <pre className="bg-gray-50 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap break-all">
                        {blocklist}
                      </pre>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No blocklist configured</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
