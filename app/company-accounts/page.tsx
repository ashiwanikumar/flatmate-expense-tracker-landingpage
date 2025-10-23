'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { companyAccountAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Footer from '@/components/Footer';
import moment from 'moment-timezone';

export default function CompanyAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    apiUrl: '',
    email: '',
    password: '',
    campaignPrefix: 'WU',
    timezone: 'Asia/Dubai',
    defaultBatchPattern: '1500,1600,1700,1800,1900,2000',
  });
  const [testingId, setTestingId] = useState<string | null>(null);
  const [timezoneSearch, setTimezoneSearch] = useState('');

  // Get all timezones and format them with GMT offset
  const timezones = moment.tz.names();

  const formatTimezone = (tz: string) => {
    const offset = moment.tz(tz).utcOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset >= 0 ? '+' : '-';
    const formattedOffset = `GMT${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    return `${tz} (${formattedOffset})`;
  };

  const filteredTimezones = timezoneSearch
    ? timezones.filter(tz =>
        tz.toLowerCase().includes(timezoneSearch.toLowerCase()) ||
        formatTimezone(tz).toLowerCase().includes(timezoneSearch.toLowerCase())
      )
    : timezones;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await companyAccountAPI.getAll();
      setAccounts(response.data.data);
    } catch (error: any) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to load company accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyName || !formData.apiUrl || !formData.email || !formData.password) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const payload = {
        ...formData,
        defaultBatchPattern: formData.defaultBatchPattern.split(',').map(Number),
      };

      if (editingAccount) {
        await companyAccountAPI.update(editingAccount._id, payload);
        toast.success('Company account updated successfully');
      } else {
        await companyAccountAPI.create(payload);
        toast.success('Company account created successfully');
      }

      setShowForm(false);
      setEditingAccount(null);
      resetForm();
      fetchAccounts();
    } catch (error: any) {
      console.error('Error saving account:', error);
      toast.error(error.response?.data?.message || 'Failed to save company account');
    }
  };

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setFormData({
      companyName: account.companyName,
      apiUrl: account.apiUrl,
      email: account.email,
      password: '',
      campaignPrefix: account.campaignPrefix,
      timezone: account.timezone,
      defaultBatchPattern: account.defaultBatchPattern.join(','),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company account?')) return;

    try {
      await companyAccountAPI.delete(id);
      toast.success('Company account deleted successfully');
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      const response = await companyAccountAPI.testConnection(id);
      if (response.data.success) {
        toast.success('Connection successful!');
      } else {
        // Show detailed error with URL if available
        const errorMsg = response.data.message || 'Connection failed';
        const url = response.data.data?.url;
        toast.error(url ? `${errorMsg}\nURL: ${url}` : errorMsg, { duration: 6000 });
      }
    } catch (error: any) {
      toast.error('Connection test failed');
    } finally {
      setTestingId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      apiUrl: '',
      email: '',
      password: '',
      campaignPrefix: 'WU',
      timezone: 'Asia/Dubai',
      defaultBatchPattern: '1500,1600,1700,1800,1900,2000',
    });
    setTimezoneSearch('');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img src="/img/logo/netraga_logo.png" alt="Netraga Logo" className="h-12 w-12" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Campaign Manager
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href="/dashboard"
              className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              Dashboard
            </Link>
            <Link
              href="/csv"
              className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              CSV Files
            </Link>
            <Link
              href="/campaigns"
              className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              Campaigns
            </Link>
            <Link
              href="/company-accounts"
              className="px-3 py-4 text-sm font-medium text-purple-600 border-b-2 border-purple-600"
            >
              Company Accounts
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Company Accounts</h2>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingAccount(null);
              resetForm();
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
          >
            + Add Company Account
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingAccount ? 'Edit Company Account' : 'Add New Company Account'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingAccount(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-white"
                  placeholder="e.g., ConFerbot, SendGrid"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API URL *</label>
                <input
                  type="url"
                  value={formData.apiUrl}
                  onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-white"
                  placeholder="https://api.example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-white"
                  placeholder="api@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password * {editingAccount && <span className="text-xs text-gray-500">(leave empty to keep current)</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingAccount}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-white"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Prefix</label>
                <input
                  type="text"
                  value={formData.campaignPrefix}
                  onChange={(e) => setFormData({ ...formData, campaignPrefix: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-white"
                  placeholder="WU"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search timezone..."
                    value={timezoneSearch}
                    onChange={(e) => setTimezoneSearch(e.target.value)}
                    onFocus={() => setTimezoneSearch('')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-white"
                  />
                  {timezoneSearch && (
                    <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white border border-gray-300 rounded-lg shadow-lg">
                      {filteredTimezones.slice(0, 50).map((tz) => (
                        <button
                          key={tz}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, timezone: tz });
                            setTimezoneSearch('');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-purple-50 text-sm text-gray-900 border-b border-gray-100 last:border-b-0"
                        >
                          {formatTimezone(tz)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-2 px-4 py-2 bg-gray-50 rounded border border-gray-200">
                  <p className="text-xs text-gray-500">Selected:</p>
                  <p className="text-sm font-medium text-gray-900">{formatTimezone(formData.timezone)}</p>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Batch Pattern (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.defaultBatchPattern}
                  onChange={(e) => setFormData({ ...formData, defaultBatchPattern: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-white"
                  placeholder="1500,1600,1700,1800,1900,2000"
                />
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
                >
                  {editingAccount ? 'Update Account' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAccount(null);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {accounts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No company accounts found.</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Add Your First Company Account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {accounts.map((account) => (
              <div key={account._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{account.companyName}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          account.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {account.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">API URL</p>
                        <p className="text-sm font-medium text-gray-900 break-all">{account.apiUrl}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="text-sm font-medium text-gray-900">{account.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Campaign Prefix</p>
                        <p className="text-sm font-medium text-gray-900">{account.campaignPrefix}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Timezone</p>
                        <p className="text-sm font-medium text-gray-900">{account.timezone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Batch Pattern</p>
                        <p className="text-sm font-medium text-gray-900">
                          {account.defaultBatchPattern.join(', ')}
                        </p>
                      </div>
                    </div>

                    {account.lastSyncedAt && (
                      <p className="text-xs text-gray-500 mt-3">
                        Last synced: {new Date(account.lastSyncedAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    <button
                      onClick={() => handleTestConnection(account._id)}
                      disabled={testingId === account._id}
                      className="px-4 py-2 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition disabled:opacity-50"
                    >
                      {testingId === account._id ? 'Testing...' : 'Test Connection'}
                    </button>
                    <button
                      onClick={() => handleEdit(account)}
                      className="px-4 py-2 bg-purple-100 text-purple-700 text-sm rounded-lg hover:bg-purple-200 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(account._id)}
                      className="px-4 py-2 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
