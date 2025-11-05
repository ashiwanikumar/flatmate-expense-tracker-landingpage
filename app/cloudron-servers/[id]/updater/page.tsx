'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cloudronAPI } from '@/lib/api';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';
import Footer from '@/components/Footer';

export default function CloudronUpdaterPage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [server, setServer] = useState<any>(null);
  const [updates, setUpdates] = useState<any>(null);
  const [schedule, setSchedule] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState('');

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
      const [serverRes, updatesRes, scheduleRes] = await Promise.allSettled([
        cloudronAPI.getServer(serverId),
        cloudronAPI.getPendingUpdates(serverId),
        cloudronAPI.getUpdateSchedule(serverId),
      ]);

      if (serverRes.status === 'fulfilled') {
        setServer(serverRes.value.data.data);
      }
      if (updatesRes.status === 'fulfilled') {
        setUpdates(updatesRes.value.data.data);
      }
      if (scheduleRes.status === 'fulfilled') {
        const pattern = scheduleRes.value.data.data.pattern;
        setSchedule(pattern);
        setScheduleForm(pattern);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckForUpdates = async () => {
    try {
      setChecking(true);
      const response = await cloudronAPI.checkForUpdates(serverId);
      setUpdates(response.data.data);
      toast.success('Updates checked successfully!');
    } catch (error: any) {
      console.error('Error checking for updates:', error);
      toast.error(error.response?.data?.message || 'Failed to check for updates');
    } finally {
      setChecking(false);
    }
  };

  const handleUpdateCloudron = async (skipBackup: boolean = false) => {
    if (!confirm(`Are you sure you want to update Cloudron${skipBackup ? ' without backup' : ''}? This may take several minutes.`)) {
      return;
    }

    try {
      setUpdating(true);
      const response = await cloudronAPI.updateCloudron(serverId, skipBackup);
      toast.success(`Cloudron update started! Task ID: ${response.data.data.taskId}`);
      setTimeout(fetchData, 3000);
    } catch (error: any) {
      console.error('Error updating Cloudron:', error);
      toast.error(error.response?.data?.message || 'Failed to start update');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cloudronAPI.setUpdateSchedule(serverId, scheduleForm);
      toast.success('Update schedule saved successfully!');
      setSchedule(scheduleForm);
      setShowScheduleModal(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      toast.error(error.response?.data?.message || 'Failed to save schedule');
    }
  };

  const hasUpdates = updates?.updates && Object.keys(updates.updates).length > 0;
  const boxUpdate = updates?.updates?.box;
  const appUpdates = updates?.updates ? Object.entries(updates.updates).filter(([key]) => key !== 'box') : [];

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
            <span className="text-gray-900 font-medium">Updater</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Update Manager</h1>
                    <p className="text-sm text-gray-600 mt-1">{server?.domain}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCheckForUpdates}
                      disabled={checking}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {checking ? 'Checking...' : 'Check for Updates'}
                    </button>
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium"
                    >
                      Schedule
                    </button>
                  </div>
                </div>

                {/* Current Schedule */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Auto-update Schedule (Cron)</p>
                  <p className="text-lg font-mono font-bold text-gray-900">{schedule || 'Not configured'}</p>
                </div>
              </div>

              {/* Updates Available */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Available Updates</h2>

                {!hasUpdates ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-green-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500">Your system is up to date!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Cloudron Platform Update */}
                    {boxUpdate && (
                      <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-bold text-gray-900">Cloudron Platform</h3>
                              <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full font-medium">
                                Platform
                              </span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Current Version:</span> {boxUpdate.currentVersion || 'Unknown'}
                              </p>
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">New Version:</span> {boxUpdate.version || 'Unknown'}
                              </p>
                              {boxUpdate.changelog && (
                                <details className="mt-2">
                                  <summary className="text-sm text-purple-600 cursor-pointer hover:underline">
                                    View Changelog
                                  </summary>
                                  <div className="mt-2 text-sm text-gray-600 whitespace-pre-wrap bg-white p-3 rounded border">
                                    {boxUpdate.changelog}
                                  </div>
                                </details>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <button
                              onClick={() => handleUpdateCloudron(false)}
                              disabled={updating}
                              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              {updating ? 'Updating...' : 'Update Now'}
                            </button>
                            <button
                              onClick={() => handleUpdateCloudron(true)}
                              disabled={updating}
                              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              Skip Backup
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* App Updates */}
                    {appUpdates.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">App Updates ({appUpdates.length})</h3>
                        <div className="space-y-3">
                          {appUpdates.map(([appId, updateInfo]: [string, any]) => (
                            <div key={appId} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-bold text-gray-900">{updateInfo.manifest?.title || appId}</h4>
                                    <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-medium">
                                      App
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm text-gray-700">
                                      <span className="font-medium">App ID:</span> {appId}
                                    </p>
                                    <p className="text-sm text-gray-700">
                                      <span className="font-medium">Current:</span> {updateInfo.currentVersion || 'Unknown'}
                                    </p>
                                    <p className="text-sm text-gray-700">
                                      <span className="font-medium">Available:</span> {updateInfo.version || 'Unknown'}
                                    </p>
                                    {updateInfo.changelog && (
                                      <details className="mt-2">
                                        <summary className="text-sm text-blue-600 cursor-pointer hover:underline">
                                          View Changelog
                                        </summary>
                                        <div className="mt-2 text-sm text-gray-600 whitespace-pre-wrap bg-white p-3 rounded border">
                                          {updateInfo.changelog}
                                        </div>
                                      </details>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Update Schedule</h2>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSaveSchedule} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cron Pattern
                  </label>
                  <input
                    type="text"
                    value={scheduleForm}
                    onChange={(e) => setScheduleForm(e.target.value)}
                    placeholder="00 00 1,3,5,23 * * *"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-gray-900"
                    required
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Format: second minute hour day month dayOfWeek
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Examples:</h4>
                  <ul className="text-sm text-blue-800 space-y-1 font-mono">
                    <li>00 00 1,3,5,23 * * * - At 1 AM, 3 AM, 5 AM, and 11 PM daily</li>
                    <li>00 00 2 * * * - At 2 AM daily</li>
                    <li>00 00 0 * * 0 - At midnight every Sunday</li>
                    <li>00 30 3 * * * - At 3:30 AM daily</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
                  >
                    Save Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
