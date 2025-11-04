'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cloudronAPI } from '@/lib/api';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';

export default function CloudronBrandingPage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [server, setServer] = useState<any>(null);
  const [cloudronName, setCloudronName] = useState('');
  const [cloudronFooter, setCloudronFooter] = useState('');
  const [cloudronStatus, setCloudronStatus] = useState<any>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      const [serverRes, nameRes, footerRes, statusRes] = await Promise.allSettled([
        cloudronAPI.getServer(serverId),
        cloudronAPI.getCloudronName(serverId),
        cloudronAPI.getCloudronFooter(serverId),
        cloudronAPI.getCloudronStatus(serverId),
      ]);

      if (serverRes.status === 'fulfilled') {
        setServer(serverRes.value.data.data);
      }
      if (nameRes.status === 'fulfilled') {
        setCloudronName(nameRes.value.data.data.name || '');
      }
      if (footerRes.status === 'fulfilled') {
        setCloudronFooter(footerRes.value.data.data.footer || '');
      }
      if (statusRes.status === 'fulfilled') {
        setCloudronStatus(statusRes.value.data.data);
      }

      // Load avatar and background images
      try {
        const avatarRes = await cloudronAPI.getCloudronAvatar(serverId);
        const avatarUrl = URL.createObjectURL(avatarRes.data);
        setAvatarPreview(avatarUrl);
      } catch (error) {
        console.log('No avatar set');
      }

      try {
        const backgroundRes = await cloudronAPI.getCloudronBackground(serverId);
        const backgroundUrl = URL.createObjectURL(backgroundRes.data);
        setBackgroundPreview(backgroundUrl);
      } catch (error) {
        console.log('No background set');
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackgroundFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveName = async () => {
    if (!cloudronName.trim() || cloudronName.length < 1 || cloudronName.length > 64) {
      toast.error('Name must be between 1 and 64 characters');
      return;
    }

    try {
      setSaving(true);
      await cloudronAPI.setCloudronName(serverId, cloudronName);
      toast.success('Cloudron name updated successfully!');
    } catch (error: any) {
      console.error('Error updating name:', error);
      toast.error(error.response?.data?.message || 'Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFooter = async () => {
    if (!cloudronFooter.trim()) {
      toast.error('Footer cannot be empty');
      return;
    }

    try {
      setSaving(true);
      await cloudronAPI.setCloudronFooter(serverId, cloudronFooter);
      toast.success('Cloudron footer updated successfully!');
    } catch (error: any) {
      console.error('Error updating footer:', error);
      toast.error(error.response?.data?.message || 'Failed to update footer');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAvatar = async () => {
    if (!avatarFile) {
      toast.error('Please select an avatar image');
      return;
    }

    try {
      setSaving(true);
      await cloudronAPI.setCloudronAvatar(serverId, avatarFile);
      toast.success('Cloudron avatar updated successfully!');
      setAvatarFile(null);
    } catch (error: any) {
      console.error('Error updating avatar:', error);
      toast.error(error.response?.data?.message || 'Failed to update avatar');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBackground = async () => {
    try {
      setSaving(true);
      await cloudronAPI.setCloudronBackground(serverId, backgroundFile);
      toast.success(backgroundFile ? 'Background updated successfully!' : 'Background cleared successfully!');
      setBackgroundFile(null);
    } catch (error: any) {
      console.error('Error updating background:', error);
      toast.error(error.response?.data?.message || 'Failed to update background');
    } finally {
      setSaving(false);
    }
  };

  const handleClearBackground = async () => {
    try {
      setSaving(true);
      await cloudronAPI.setCloudronBackground(serverId, null);
      setBackgroundPreview(null);
      setBackgroundFile(null);
      toast.success('Background cleared successfully!');
    } catch (error: any) {
      console.error('Error clearing background:', error);
      toast.error(error.response?.data?.message || 'Failed to clear background');
    } finally {
      setSaving(false);
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
            <Link href={`/cloudron-servers/${serverId}`} className="hover:text-purple-600">
              {server?.domain || 'Server'}
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Branding</span>
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cloudron Branding</h1>
                    <p className="text-sm text-gray-600 mt-1">Customize the appearance of your Cloudron</p>
                  </div>
                  {cloudronStatus && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Version</p>
                      <p className="text-lg font-bold text-gray-900">{cloudronStatus.version}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cloudron Name */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Cloudron Name</h2>
                <p className="text-sm text-gray-600 mb-4">
                  The Cloudron name is used in Email templates, Dashboard header and the Login pages.
                </p>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={cloudronName}
                    onChange={(e) => setCloudronName(e.target.value)}
                    placeholder="Enter Cloudron name (1-64 characters)"
                    maxLength={64}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Name'}
                  </button>
                </div>
              </div>

              {/* Cloudron Avatar */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Cloudron Avatar (Icon)</h2>
                <p className="text-sm text-gray-600 mb-4">
                  The Cloudron avatar (icon) is used in Email templates, Dashboard header and the Login pages.
                </p>
                <div className="flex gap-6 items-start">
                  <div>
                    {avatarPreview && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Current Avatar:</p>
                        <img
                          src={avatarPreview}
                          alt="Cloudron Avatar"
                          className="w-32 h-32 rounded-lg border-2 border-gray-300 object-cover"
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                  </div>
                  <button
                    onClick={handleSaveAvatar}
                    disabled={!avatarFile || saving}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Uploading...' : 'Upload Avatar'}
                  </button>
                </div>
              </div>

              {/* Cloudron Background */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Cloudron Background Image</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Set a background image for the Cloudron login and dashboard pages. Leave empty to use the default background.
                </p>
                <div className="space-y-4">
                  {backgroundPreview && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Current Background:</p>
                      <img
                        src={backgroundPreview}
                        alt="Cloudron Background"
                        className="w-full max-w-2xl h-48 rounded-lg border-2 border-gray-300 object-cover"
                      />
                    </div>
                  )}
                  <div className="flex gap-4 items-start">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBackgroundChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveBackground}
                        disabled={!backgroundFile || saving}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Uploading...' : 'Upload Background'}
                      </button>
                      {backgroundPreview && (
                        <button
                          onClick={handleClearBackground}
                          disabled={saving}
                          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Clear Background
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cloudron Footer */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Cloudron Footer</h2>
                <p className="text-sm text-gray-600 mb-4">
                  The Cloudron Footer is used in the Dashboard and Login pages. You can use markdown and template variables:
                </p>
                <ul className="text-sm text-gray-600 mb-4 ml-4 list-disc">
                  <li><code className="bg-gray-100 px-1 rounded">%YEAR%</code> - the current year</li>
                  <li><code className="bg-gray-100 px-1 rounded">%VERSION%</code> - current Cloudron version</li>
                </ul>
                <div className="space-y-4">
                  <textarea
                    value={cloudronFooter}
                    onChange={(e) => setCloudronFooter(e.target.value)}
                    placeholder="Enter footer text (markdown supported)"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                  <button
                    onClick={handleSaveFooter}
                    disabled={saving}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Footer'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
