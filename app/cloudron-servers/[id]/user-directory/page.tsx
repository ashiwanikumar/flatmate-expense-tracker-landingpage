'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cloudronAPI } from '@/lib/api';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';

export default function UserDirectoryPage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [server, setServer] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [lockUserProfiles, setLockUserProfiles] = useState(false);
  const [mandatory2FA, setMandatory2FA] = useState(false);

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
      const [serverRes, configRes] = await Promise.allSettled([
        cloudronAPI.getServer(serverId),
        cloudronAPI.getUserDirectoryProfileConfig(serverId),
      ]);

      if (serverRes.status === 'fulfilled') {
        setServer(serverRes.value.data.data);
      }

      if (configRes.status === 'fulfilled') {
        const configData = configRes.value.data.data;
        setConfig(configData);
        setLockUserProfiles(configData.lockUserProfiles || false);
        setMandatory2FA(configData.mandatory2FA || false);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await cloudronAPI.setUserDirectoryProfileConfig(serverId, {
        lockUserProfiles,
        mandatory2FA,
      });
      toast.success('User directory settings updated successfully!');
      fetchData();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
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
            <span className="text-gray-900 font-medium">User Directory</span>
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Directory Settings</h1>
                    <p className="text-sm text-gray-600 mt-1">{server?.domain}</p>
                  </div>
                  <Link
                    href={`/cloudron-servers/${serverId}`}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                  >
                    Back to Server
                  </Link>
                </div>
              </div>

              {/* Settings Card */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Profile Configuration</h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Configure security and profile settings for all users in the user directory.
                    </p>
                  </div>

                  {/* Lock User Profiles */}
                  <div className="border-b border-gray-200 pb-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={lockUserProfiles}
                            onChange={(e) => setLockUserProfiles(e.target.checked)}
                            className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <span className="ml-3">
                            <span className="text-base font-semibold text-gray-900 block">
                              Lock User Profiles
                            </span>
                            <span className="text-sm text-gray-600">
                              Prevent users from making changes to their profiles. When enabled, users cannot modify their display name, email, or other profile information.
                            </span>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Mandatory 2FA */}
                  <div className="pb-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mandatory2FA}
                            onChange={(e) => setMandatory2FA(e.target.checked)}
                            className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <span className="ml-3">
                            <span className="text-base font-semibold text-gray-900 block">
                              Mandatory Two-Factor Authentication
                            </span>
                            <span className="text-sm text-gray-600">
                              Require all users to enable two-factor authentication (2FA) for enhanced security. Users without 2FA enabled will be prompted to set it up on their next login.
                            </span>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setLockUserProfiles(config?.lockUserProfiles || false);
                          setMandatory2FA(config?.mandatory2FA || false);
                          toast.success('Changes discarded');
                        }}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                        disabled={saving}
                      >
                        Reset
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Saving...
                          </span>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">About User Directory Settings</h3>
                    <p className="text-sm text-blue-800">
                      These settings apply to all users in your Cloudron user directory. Changes take effect immediately and will be applied on users' next login or session refresh.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
