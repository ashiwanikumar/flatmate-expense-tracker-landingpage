'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cloudronAPI } from '@/lib/api';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';
import Footer from '@/components/Footer';

export default function ServicesPage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [server, setServer] = useState<any>(null);
  const [services, setServices] = useState<string[]>([]);
  const [platformStatus, setPlatformStatus] = useState<any>(null);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [serviceDetails, setServiceDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'logs' | 'graphs'>('overview');

  // Configuration modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configForm, setConfigForm] = useState({
    memoryLimit: 0,
    recoveryMode: false
  });

  // Logs state
  const [logs, setLogs] = useState<any>(null);
  const [logsLines, setLogsLines] = useState(100);
  const [logsFormat, setLogsFormat] = useState('json');

  // Graphs state
  const [graphs, setGraphs] = useState<any>(null);
  const [graphsMinutes, setGraphsMinutes] = useState(60);

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

  useEffect(() => {
    if (selectedService) {
      fetchServiceDetails();
    }
  }, [selectedService]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [serverRes, servicesRes, platformRes, systemRes] = await Promise.allSettled([
        cloudronAPI.getServer(serverId),
        cloudronAPI.listServices(serverId),
        cloudronAPI.getPlatformStatus(serverId),
        cloudronAPI.getSystemInfo(serverId)
      ]);

      if (serverRes.status === 'fulfilled') {
        setServer(serverRes.value.data.data);
      }
      if (servicesRes.status === 'fulfilled') {
        setServices(servicesRes.value.data.data.services || []);
      }
      if (platformRes.status === 'fulfilled') {
        setPlatformStatus(platformRes.value.data.data);
      }
      if (systemRes.status === 'fulfilled') {
        setSystemInfo(systemRes.value.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceDetails = async () => {
    if (!selectedService) return;

    try {
      const response = await cloudronAPI.getService(serverId, selectedService);
      setServiceDetails(response.data.data);

      // Set form defaults
      setConfigForm({
        memoryLimit: response.data.data.memoryLimit || response.data.data.defaultMemoryLimit || 536870912,
        recoveryMode: response.data.data.recoveryMode || false
      });
    } catch (error: any) {
      console.error('Error fetching service details:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch service details');
    }
  };

  const handleServiceSelect = (service: string) => {
    setSelectedService(service);
    setActiveTab('overview');
    setLogs(null);
    setGraphs(null);
  };

  const handleConfigureService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    try {
      await cloudronAPI.configureService(serverId, selectedService, configForm);
      toast.success('Service configured successfully!');
      setShowConfigModal(false);
      fetchServiceDetails();
    } catch (error: any) {
      console.error('Error configuring service:', error);
      toast.error(error.response?.data?.message || 'Failed to configure service');
    }
  };

  const handleRestartService = async () => {
    if (!selectedService) return;

    if (!confirm(`Are you sure you want to restart the ${selectedService} service? This may cause temporary service interruption.`)) {
      return;
    }

    try {
      await cloudronAPI.restartService(serverId, selectedService);
      toast.success(`Service ${selectedService} restart initiated!`);
      setTimeout(() => fetchServiceDetails(), 2000);
    } catch (error: any) {
      console.error('Error restarting service:', error);
      toast.error(error.response?.data?.message || 'Failed to restart service');
    }
  };

  const handleRebuildService = async () => {
    if (!selectedService) return;

    if (!confirm(`Are you sure you want to rebuild the ${selectedService} service? This operation may take several minutes.`)) {
      return;
    }

    try {
      await cloudronAPI.rebuildService(serverId, selectedService);
      toast.success(`Service ${selectedService} rebuild initiated!`);
      setTimeout(() => fetchServiceDetails(), 2000);
    } catch (error: any) {
      console.error('Error rebuilding service:', error);
      toast.error(error.response?.data?.message || 'Failed to rebuild service');
    }
  };

  const fetchServiceLogs = async () => {
    if (!selectedService) return;

    try {
      const response = await cloudronAPI.getServiceLogs(serverId, selectedService, logsLines, logsFormat);
      setLogs(response.data.data);
      toast.success('Logs fetched successfully!');
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch logs');
    }
  };

  const fetchServiceGraphs = async () => {
    if (!selectedService) return;

    try {
      const response = await cloudronAPI.getServiceGraphs(serverId, selectedService, graphsMinutes);
      setGraphs(response.data.data);
      toast.success('Graphs fetched successfully!');
    } catch (error: any) {
      console.error('Error fetching graphs:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch graphs');
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} />
      <NavigationMenu />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link href="/cloudron-servers" className="hover:text-purple-600">Servers</Link>
            <span>/</span>
            <Link href={`/cloudron-servers/${serverId}`} className="hover:text-purple-600">{server?.domain || 'Server'}</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Services</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {/* Header Section */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Services Management</h1>
                    <p className="text-sm text-gray-600 mt-1">Manage Cloudron services for {server?.domain}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={fetchData}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium text-sm"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Platform Status & System Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Platform Status */}
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Platform Status</h3>
                    <p className={`text-2xl font-bold ${platformStatus?.message === 'Ready' ? 'text-green-600' : 'text-orange-600'}`}>
                      {platformStatus?.message || 'Unknown'}
                    </p>
                  </div>

                  {/* System Info */}
                  {systemInfo && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">System Information</h3>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {systemInfo.version && (
                          <div>
                            <span className="text-gray-600">Version:</span>
                            <span className="ml-1 font-medium">{systemInfo.version}</span>
                          </div>
                        )}
                        {systemInfo.memory && (
                          <div>
                            <span className="text-gray-600">Memory:</span>
                            <span className="ml-1 font-medium">{formatBytes(systemInfo.memory)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Services List */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Available Services ({services.length})</h2>

                    {services.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No services found</p>
                    ) : (
                      <div className="space-y-2">
                        {services.map((service) => (
                          <button
                            key={service}
                            onClick={() => handleServiceSelect(service)}
                            className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                              selectedService === service
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                                : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium capitalize">{service}</span>
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Details */}
                <div className="lg:col-span-2">
                  {!selectedService ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                      <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Service</h3>
                      <p className="text-gray-500">Choose a service from the list to view details and manage it</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm">
                      {/* Tabs */}
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
                            onClick={() => setActiveTab('details')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                              activeTab === 'details'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            Details
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
                          <button
                            onClick={() => setActiveTab('graphs')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                              activeTab === 'graphs'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            Graphs
                          </button>
                        </nav>
                      </div>

                      <div className="p-6">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && serviceDetails && (
                          <div className="space-y-6">
                            <div className="flex items-start justify-between">
                              <div>
                                <h2 className="text-2xl font-bold text-gray-900 capitalize">{selectedService}</h2>
                                <p className="text-sm text-gray-600 mt-1">Service Overview and Quick Actions</p>
                              </div>
                              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                serviceDetails.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {serviceDetails.status || 'unknown'}
                              </span>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              <div className="bg-blue-50 rounded-lg p-4">
                                <p className="text-xs text-blue-600 mb-1">Memory Used</p>
                                <p className="text-lg font-bold text-blue-900">{formatBytes(serviceDetails.memoryUsed || 0)}</p>
                                {serviceDetails.memoryPercent && (
                                  <p className="text-xs text-blue-600 mt-1">{serviceDetails.memoryPercent}%</p>
                                )}
                              </div>

                              <div className="bg-purple-50 rounded-lg p-4">
                                <p className="text-xs text-purple-600 mb-1">Memory Limit</p>
                                <p className="text-lg font-bold text-purple-900">
                                  {formatBytes(serviceDetails.memoryLimit || serviceDetails.defaultMemoryLimit || 0)}
                                </p>
                              </div>

                              {serviceDetails.healthcheck && (
                                <div className="bg-green-50 rounded-lg p-4">
                                  <p className="text-xs text-green-600 mb-1">Health Status</p>
                                  <p className="text-lg font-bold text-green-900">
                                    {serviceDetails.healthcheck.status ? 'Healthy' : 'Unhealthy'}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div>
                              <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <button
                                  onClick={() => setShowConfigModal(true)}
                                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                                >
                                  Configure Service
                                </button>
                                <button
                                  onClick={handleRestartService}
                                  className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
                                >
                                  Restart Service
                                </button>
                                <button
                                  onClick={handleRebuildService}
                                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                                >
                                  Rebuild Service
                                </button>
                              </div>
                            </div>

                            {/* Health Check Details */}
                            {serviceDetails.healthcheck && typeof serviceDetails.healthcheck === 'object' && (
                              <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Health Check Details</h3>
                                <div className="bg-gray-50 rounded-lg p-4">
                                  <pre className="text-xs overflow-auto">
                                    {JSON.stringify(serviceDetails.healthcheck, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Details Tab */}
                        {activeTab === 'details' && serviceDetails && (
                          <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Service Details</h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <pre className="text-xs overflow-auto whitespace-pre-wrap">
                                {JSON.stringify(serviceDetails, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Logs Tab */}
                        {activeTab === 'logs' && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-bold text-gray-900">Service Logs</h3>
                              <button
                                onClick={fetchServiceLogs}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                              >
                                Fetch Logs
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lines</label>
                                <input
                                  type="number"
                                  value={logsLines}
                                  onChange={(e) => setLogsLines(parseInt(e.target.value) || 100)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
                                  min="1"
                                  max="10000"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                                <select
                                  value={logsFormat}
                                  onChange={(e) => setLogsFormat(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
                                >
                                  <option value="json">JSON</option>
                                  <option value="short">Short</option>
                                </select>
                              </div>
                            </div>

                            {logs && (
                              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-auto max-h-96">
                                <pre className="text-xs whitespace-pre-wrap">{typeof logs === 'string' ? logs : JSON.stringify(logs, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Graphs Tab */}
                        {activeTab === 'graphs' && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-bold text-gray-900">Performance Graphs</h3>
                              <button
                                onClick={fetchServiceGraphs}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                              >
                                Load Graphs
                              </button>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Time Period (minutes)</label>
                              <input
                                type="number"
                                value={graphsMinutes}
                                onChange={(e) => setGraphsMinutes(parseInt(e.target.value) || 60)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
                                min="1"
                                max="1440"
                              />
                            </div>

                            {graphs && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-blue-50 rounded-lg p-4">
                                    <p className="text-sm font-medium text-blue-900">CPU Count</p>
                                    <p className="text-2xl font-bold text-blue-600">{graphs.cpuCount || 'N/A'}</p>
                                  </div>
                                  <div className="bg-green-50 rounded-lg p-4">
                                    <p className="text-sm font-medium text-green-900">Memory Data Points</p>
                                    <p className="text-2xl font-bold text-green-600">{graphs.memory?.length || 0}</p>
                                  </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Graph Data</h4>
                                  <pre className="text-xs overflow-auto max-h-64">
                                    {JSON.stringify(graphs, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
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

      {/* Configure Service Modal */}
      {showConfigModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Configure {selectedService}</h2>
                <p className="text-sm text-gray-600 mt-1">Update service configuration settings</p>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleConfigureService} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Memory Limit (bytes)
                </label>
                <input
                  type="number"
                  value={configForm.memoryLimit}
                  onChange={(e) => setConfigForm({ ...configForm, memoryLimit: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
                  required
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Current: {formatBytes(configForm.memoryLimit)}</p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="recoveryMode"
                  checked={configForm.recoveryMode}
                  onChange={(e) => setConfigForm({ ...configForm, recoveryMode: e.target.checked })}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-600 border-gray-300 rounded"
                />
                <label htmlFor="recoveryMode" className="ml-2 text-sm text-gray-700">
                  Enable Recovery Mode
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
