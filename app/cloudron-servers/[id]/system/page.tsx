'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cloudronAPI } from '@/lib/api';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';

export default function SystemInfoPage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [server, setServer] = useState<any>(null);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [cpus, setCpus] = useState<any>(null);
  const [diskUsage, setDiskUsage] = useState<any>(null);
  const [blockDevices, setBlockDevices] = useState<any>(null);
  const [memory, setMemory] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'hardware' | 'storage' | 'logs'>('overview');
  const [loading, setLoading] = useState(true);
  const [showRebootModal, setShowRebootModal] = useState(false);
  const [logUnit, setLogUnit] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

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
      const [serverRes, systemInfoRes, cpusRes, memoryRes] = await Promise.allSettled([
        cloudronAPI.getServer(serverId),
        cloudronAPI.getSystemInfo(serverId),
        cloudronAPI.getSystemCpus(serverId),
        cloudronAPI.getSystemMemory(serverId),
      ]);

      if (serverRes.status === 'fulfilled') {
        setServer(serverRes.value.data.data);
      }
      if (systemInfoRes.status === 'fulfilled') {
        setSystemInfo(systemInfoRes.value.data);
      }
      if (cpusRes.status === 'fulfilled') {
        setCpus(cpusRes.value.data);
      }
      if (memoryRes.status === 'fulfilled') {
        setMemory(memoryRes.value.data);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageData = async () => {
    try {
      const [diskUsageRes, blockDevicesRes] = await Promise.allSettled([
        cloudronAPI.getSystemDiskUsage(serverId),
        cloudronAPI.getSystemBlockDevices(serverId),
      ]);

      if (diskUsageRes.status === 'fulfilled') {
        setDiskUsage(diskUsageRes.value.data);
      }
      if (blockDevicesRes.status === 'fulfilled') {
        setBlockDevices(blockDevicesRes.value.data);
      }
    } catch (error: any) {
      console.error('Error fetching storage data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch storage data');
    }
  };

  const handleRefreshDiskUsage = async () => {
    try {
      await cloudronAPI.updateSystemDiskUsage(serverId);
      toast.success('Disk usage refresh initiated!');
      setTimeout(() => {
        fetchStorageData();
      }, 3000);
    } catch (error: any) {
      console.error('Error refreshing disk usage:', error);
      toast.error(error.response?.data?.message || 'Failed to refresh disk usage');
    }
  };

  const handleReboot = async () => {
    try {
      await cloudronAPI.rebootSystem(serverId);
      toast.success('Server reboot initiated!');
      setShowRebootModal(false);
    } catch (error: any) {
      console.error('Error rebooting server:', error);
      toast.error(error.response?.data?.message || 'Failed to reboot server');
    }
  };

  const handleFetchLogs = async () => {
    if (!logUnit.trim()) {
      toast.error('Please enter a unit name');
      return;
    }

    try {
      setLoadingLogs(true);
      const response = await cloudronAPI.getSystemLogs(serverId, logUnit, 100, 'json');
      setLogs(response.data || []);
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  useEffect(() => {
    if (activeTab === 'storage' && !diskUsage && !blockDevices) {
      fetchStorageData();
    }
  }, [activeTab]);

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
              {server?.domain || 'Server'}
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">System Info</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {/* Server Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">System Information</h1>
                    <p className="text-sm text-gray-600 mt-1">{server?.domain}</p>
                  </div>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => setShowRebootModal(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium"
                    >
                      Reboot Server
                    </button>
                  )}
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
                      onClick={() => setActiveTab('hardware')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'hardware'
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Hardware
                    </button>
                    <button
                      onClick={() => setActiveTab('storage')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'storage'
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Storage
                    </button>
                    <button
                      onClick={() => setActiveTab('logs')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'logs'
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Logs
                    </button>
                  </nav>
                </div>

                <div className="p-6">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">General Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <label className="text-sm text-gray-600">System Vendor</label>
                            <p className="text-base font-medium text-gray-900">{systemInfo?.sysVendor || 'N/A'}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <label className="text-sm text-gray-600">Product Name</label>
                            <p className="text-base font-medium text-gray-900">{systemInfo?.productName || 'N/A'}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <label className="text-sm text-gray-600">Uptime</label>
                            <p className="text-base font-medium text-gray-900">
                              {systemInfo?.uptimeSecs ? formatUptime(systemInfo.uptimeSecs) : 'N/A'}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <label className="text-sm text-gray-600">Reboot Required</label>
                            <p className="text-base font-medium">
                              <span
                                className={`inline-block px-3 py-1 text-sm rounded-full ${
                                  systemInfo?.rebootRequired
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {systemInfo?.rebootRequired ? 'Yes' : 'No'}
                              </span>
                            </p>
                          </div>
                          {systemInfo?.activationTime && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <label className="text-sm text-gray-600">Activation Time</label>
                              <p className="text-base font-medium text-gray-900">
                                {new Date(systemInfo.activationTime).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {memory && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-4">Memory</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-blue-50 rounded-lg p-4">
                              <label className="text-sm text-blue-600">Total Memory</label>
                              <p className="text-2xl font-bold text-blue-900">{formatBytes(memory.memory)}</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4">
                              <label className="text-sm text-purple-600">Swap</label>
                              <p className="text-2xl font-bold text-purple-900">{formatBytes(memory.swap)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hardware Tab */}
                  {activeTab === 'hardware' && (
                    <div className="space-y-6">
                      {cpus && cpus.cpus && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-4">CPUs ({cpus.cpus.length})</h3>
                          <div className="space-y-3">
                            {cpus.cpus.map((cpu: any, index: number) => (
                              <div key={index} className="bg-gray-50 rounded-lg p-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <label className="text-xs text-gray-600">Model</label>
                                    <p className="text-sm font-medium text-gray-900">{cpu.model || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-600">Speed</label>
                                    <p className="text-sm font-medium text-gray-900">{cpu.speed ? `${cpu.speed} MHz` : 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-600">User Time</label>
                                    <p className="text-sm font-medium text-gray-900">{cpu.times?.user || 0}</p>
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-600">System Time</label>
                                    <p className="text-sm font-medium text-gray-900">{cpu.times?.sys || 0}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {memory && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-4">Memory Details</h3>
                          <div className="bg-gray-50 rounded-lg p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="text-sm text-gray-600 mb-2 block">Total RAM</label>
                                <p className="text-3xl font-bold text-gray-900">{formatBytes(memory.memory)}</p>
                              </div>
                              <div>
                                <label className="text-sm text-gray-600 mb-2 block">Total Swap</label>
                                <p className="text-3xl font-bold text-gray-900">{formatBytes(memory.swap)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Storage Tab */}
                  {activeTab === 'storage' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900">Storage Information</h3>
                        <button
                          onClick={handleRefreshDiskUsage}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                        >
                          Refresh Disk Usage
                        </button>
                      </div>

                      {diskUsage && diskUsage.usage && (
                        <div>
                          <div className="mb-2 text-sm text-gray-600">
                            Last updated: {new Date(diskUsage.usage.ts).toLocaleString()}
                          </div>
                          {diskUsage.usage.filesystems && Object.keys(diskUsage.usage.filesystems).length > 0 ? (
                            <div className="space-y-4">
                              {Object.entries(diskUsage.usage.filesystems).map(([path, fs]: [string, any]) => (
                                <div key={path} className="bg-gray-50 rounded-lg p-4">
                                  <h4 className="font-bold text-gray-900 mb-3">{path}</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <label className="text-xs text-gray-600">Total</label>
                                      <p className="font-medium text-gray-900">{formatBytes(fs.size)}</p>
                                    </div>
                                    <div>
                                      <label className="text-xs text-gray-600">Used</label>
                                      <p className="font-medium text-gray-900">{formatBytes(fs.used)}</p>
                                    </div>
                                    <div>
                                      <label className="text-xs text-gray-600">Available</label>
                                      <p className="font-medium text-gray-900">{formatBytes(fs.available)}</p>
                                    </div>
                                    <div>
                                      <label className="text-xs text-gray-600">Usage</label>
                                      <p className="font-medium text-gray-900">{fs.usedPercent}%</p>
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full ${
                                          fs.usedPercent > 90
                                            ? 'bg-red-600'
                                            : fs.usedPercent > 75
                                            ? 'bg-yellow-600'
                                            : 'bg-green-600'
                                        }`}
                                        style={{ width: `${fs.usedPercent}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-center py-8">No filesystem data available</p>
                          )}
                        </div>
                      )}

                      {blockDevices && blockDevices.devices && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-4">Block Devices</h3>
                          <div className="space-y-3">
                            {blockDevices.devices.map((device: any, index: number) => (
                              <div key={index} className="bg-gray-50 rounded-lg p-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <label className="text-xs text-gray-600">Name</label>
                                    <p className="font-medium text-gray-900">{device.name || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-600">Type</label>
                                    <p className="font-medium text-gray-900">{device.type || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-600">Size</label>
                                    <p className="font-medium text-gray-900">{device.size || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-600">Mount Point</label>
                                    <p className="font-medium text-gray-900">{device.mountpoint || '-'}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!diskUsage && !blockDevices && (
                        <div className="text-center py-8 text-gray-500">Loading storage information...</div>
                      )}
                    </div>
                  )}

                  {/* Logs Tab */}
                  {activeTab === 'logs' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">System Logs</h3>
                        <div className="flex gap-2 mb-4">
                          <input
                            type="text"
                            placeholder="Enter unit name (e.g., box, nginx, docker)"
                            value={logUnit}
                            onChange={(e) => setLogUnit(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          <button
                            onClick={handleFetchLogs}
                            disabled={loadingLogs}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
                          >
                            {loadingLogs ? 'Loading...' : 'Fetch Logs'}
                          </button>
                        </div>

                        {logs.length > 0 ? (
                          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs max-h-96 overflow-auto">
                            {logs.map((log: any, index: number) => (
                              <div key={index} className="py-1">
                                <span className="text-gray-500">{log.timestamp || log.ts || ''}</span>{' '}
                                <span className="text-blue-400">{log.unit || ''}</span>{' '}
                                <span>{log.message || JSON.stringify(log)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                            Enter a unit name and click "Fetch Logs" to view system logs
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Reboot Confirmation Modal */}
      {showRebootModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Server Reboot</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to reboot this server? This will temporarily interrupt all services running on the
              server.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRebootModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReboot}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Reboot Server
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
