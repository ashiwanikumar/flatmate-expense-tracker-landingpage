'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cloudronAPI } from '@/lib/api';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';

export default function CloudronProfilePage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [server, setServer] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'appearance'>('profile');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    email: '',
    fallbackEmail: '',
    displayName: '',
    password: ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 2FA state
  const [twoFASecret, setTwoFASecret] = useState<any>(null);
  const [totpToken, setTotpToken] = useState('');
  const [show2FASetup, setShow2FASetup] = useState(false);

  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Background image state
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);

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
      const [serverRes, profileRes] = await Promise.allSettled([
        cloudronAPI.getServer(serverId),
        cloudronAPI.getProfile(serverId)
      ]);

      if (serverRes.status === 'fulfilled') {
        setServer(serverRes.value.data.data);
      }

      if (profileRes.status === 'fulfilled') {
        const profileData = profileRes.value.data.data;
        setProfile(profileData);
        setProfileForm({
          email: profileData.email || '',
          fallbackEmail: profileData.fallbackEmail || '',
          displayName: profileData.displayName || '',
          password: ''
        });
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cloudronAPI.updateProfile(serverId, profileForm);
      toast.success('Profile updated successfully!');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      await cloudronAPI.updatePassword(serverId, {
        password: passwordForm.password,
        newPassword: passwordForm.newPassword
      });
      toast.success('Password updated successfully!');
      setPasswordForm({ password: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    }
  };

  const handleSet2FASecret = async () => {
    try {
      const response = await cloudronAPI.set2FASecret(serverId);
      setTwoFASecret(response.data.data);
      setShow2FASetup(true);
      toast.success('2FA secret generated! Scan the QR code with your authenticator app.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate 2FA secret');
    }
  };

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cloudronAPI.enable2FA(serverId, totpToken);
      toast.success('2FA enabled successfully!');
      setShow2FASetup(false);
      setTwoFASecret(null);
      setTotpToken('');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to enable 2FA');
    }
  };

  const handleDisable2FA = async () => {
    const password = prompt('Enter your password to disable 2FA:');
    if (!password) return;

    try {
      await cloudronAPI.disable2FA(serverId, password);
      toast.success('2FA disabled successfully!');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to disable 2FA');
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

  const handleUpdateAvatar = async () => {
    if (!avatarFile) {
      toast.error('Please select an avatar image');
      return;
    }

    try {
      await cloudronAPI.updateAvatar(serverId, avatarFile);
      toast.success('Avatar updated successfully!');
      setAvatarFile(null);
      setAvatarPreview(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update avatar');
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

  const handleUpdateBackground = async () => {
    if (!backgroundFile) {
      toast.error('Please select a background image');
      return;
    }

    try {
      await cloudronAPI.setBackgroundImage(serverId, backgroundFile);
      toast.success('Background image updated successfully!');
      setBackgroundFile(null);
      setBackgroundPreview(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update background image');
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
            <span className="text-gray-900">Profile</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {/* Page Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profile Settings</h1>
                <p className="text-sm text-gray-600 mt-1">Manage your Cloudron profile settings for {server?.domain}</p>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'profile'
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => setActiveTab('security')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'security'
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Security
                    </button>
                    <button
                      onClick={() => setActiveTab('appearance')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'appearance'
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Appearance
                    </button>
                  </nav>
                </div>

                <div className="p-6">
                  {/* Profile Tab */}
                  {activeTab === 'profile' && (
                    <div className="space-y-6">
                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fallback Email</label>
                          <input
                            type="email"
                            value={profileForm.fallbackEmail}
                            onChange={(e) => setProfileForm({ ...profileForm, fallbackEmail: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">Password reset emails will be sent to this address</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                          <input
                            type="text"
                            value={profileForm.displayName}
                            onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                          <input
                            type="password"
                            value={profileForm.password}
                            onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Required when changing fallback email"
                          />
                        </div>

                        <button
                          type="submit"
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
                        >
                          Update Profile
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Security Tab */}
                  {activeTab === 'security' && (
                    <div className="space-y-8">
                      {/* Change Password */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Change Password</h3>
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                            <input
                              type="password"
                              value={passwordForm.password}
                              onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input
                              type="password"
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                            <input
                              type="password"
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              required
                            />
                          </div>

                          <button
                            type="submit"
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
                          >
                            Update Password
                          </button>
                        </form>
                      </div>

                      {/* Two-Factor Authentication */}
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Two-Factor Authentication</h3>

                        {profile?.twoFactorAuthenticationEnabled ? (
                          <div>
                            <p className="text-sm text-green-600 mb-4">✓ 2FA is currently enabled</p>
                            <button
                              onClick={handleDisable2FA}
                              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                            >
                              Disable 2FA
                            </button>
                          </div>
                        ) : show2FASetup ? (
                          <div className="space-y-4">
                            {twoFASecret && (
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-700 mb-2">Scan this QR code with your authenticator app:</p>
                                <img src={twoFASecret.qrcode} alt="QR Code" className="w-64 h-64 mx-auto my-4" />
                                <p className="text-sm text-gray-700 mb-2">Or enter this secret manually:</p>
                                <code className="block bg-white p-2 rounded border text-sm">{twoFASecret.secret}</code>
                              </div>
                            )}

                            <form onSubmit={handleEnable2FA} className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">TOTP Token</label>
                                <input
                                  type="text"
                                  value={totpToken}
                                  onChange={(e) => setTotpToken(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  placeholder="Enter 6-digit code"
                                  required
                                />
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
                                >
                                  Enable 2FA
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShow2FASetup(false);
                                    setTwoFASecret(null);
                                    setTotpToken('');
                                  }}
                                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-gray-600 mb-4">Add an extra layer of security to your account</p>
                            <button
                              onClick={handleSet2FASecret}
                              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
                            >
                              Enable 2FA
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Appearance Tab */}
                  {activeTab === 'appearance' && (
                    <div className="space-y-8">
                      {/* Avatar */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Avatar</h3>
                        <div className="space-y-4">
                          {avatarPreview && (
                            <div className="flex items-center gap-4">
                              <img src={avatarPreview} alt="Avatar preview" className="w-24 h-24 rounded-full object-cover" />
                            </div>
                          )}
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                            />
                          </div>
                          {avatarFile && (
                            <button
                              onClick={handleUpdateAvatar}
                              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
                            >
                              Upload Avatar
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Background Image */}
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Dashboard Background Image</h3>
                        <div className="space-y-4">
                          {backgroundPreview && (
                            <div>
                              <img src={backgroundPreview} alt="Background preview" className="w-full max-w-md h-48 rounded-lg object-cover" />
                            </div>
                          )}
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleBackgroundChange}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                            />
                          </div>
                          {backgroundFile && (
                            <button
                              onClick={handleUpdateBackground}
                              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
                            >
                              Upload Background
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
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
