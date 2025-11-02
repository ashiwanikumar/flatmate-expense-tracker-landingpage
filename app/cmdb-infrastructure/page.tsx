'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cmdbInfrastructureAPI, otpAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Footer from '@/components/Footer';
import LoadingModal from '@/components/LoadingModal';

interface Resource {
  _id: string;
  name: string;
  category: string;
  description?: string;
  url?: string;
  ipAddress?: string;
  port?: number;
  username?: string;
  password?: string;
  apiKey?: string;
  environment: string;
  status: string;
  tags?: string[];
  notes?: string;
  accessInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

const AUTHORIZED_EMAILS = [
  'ashvanikumar109@gmail.com',
  'themdk01@gmail.com',
  'info@corp.netraga.com',
];

const CATEGORIES = [
  { value: 'server', label: 'Server', color: 'bg-blue-100 text-blue-800' },
  { value: 'mail_server', label: 'Mail Server', color: 'bg-purple-100 text-purple-800' },
  { value: 'monitoring', label: 'Monitoring', color: 'bg-green-100 text-green-800' },
  { value: 'database', label: 'Database', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'devops', label: 'DevOps', color: 'bg-orange-100 text-orange-800' },
  { value: 'network', label: 'Network', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'cloud_service', label: 'Cloud Service', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' },
];

const ENVIRONMENTS = ['production', 'staging', 'development', 'testing'];
const STATUSES = ['active', 'inactive', 'maintenance'];

export default function CmdbInfrastructurePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterEnvironment, setFilterEnvironment] = useState('');
  const [saving, setSaving] = useState(false);

  // OTP state
  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Form state
  const [formData, setFormData] = useState<any>({
    name: '',
    category: 'server',
    description: '',
    url: '',
    ipAddress: '',
    port: '',
    username: '',
    password: '',
    apiKey: '',
    environment: 'production',
    status: 'active',
    tags: [],
    notes: '',
    accessInstructions: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchResources();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const fetchResources = async () => {
    try {
      const response = await cmdbInfrastructureAPI.getAll({
        category: filterCategory || undefined,
        environment: filterEnvironment || undefined,
        search: searchTerm || undefined,
      });
      setResources(response.data.data);
    } catch (error: any) {
      console.error('Error fetching resources:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/auth/login');
        return;
      }
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!otpEmail || !AUTHORIZED_EMAILS.includes(otpEmail.toLowerCase())) {
      toast.error('Please enter an authorized email address');
      return;
    }

    setOtpLoading(true);
    try {
      await otpAPI.sendOTP({ email: otpEmail });
      setOtpSent(true);
      setCountdown(300); // 5 minutes
      toast.success('OTP sent to your email!');
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/auth/login');
        return;
      }
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setOtpVerifying(true);
    try {
      await otpAPI.verifyOTP({ email: otpEmail, otp });
      setIsEditMode(true);
      setShowOTPModal(false);
      toast.success('Edit mode unlocked!');
      setOtp('');
      setOtpSent(false);
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/auth/login');
        return;
      }
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    setSaving(true);
    try {
      if (selectedResource) {
        await cmdbInfrastructureAPI.update(selectedResource._id, formData);
        toast.success('Resource updated successfully!');
      } else {
        await cmdbInfrastructureAPI.create(formData);
        toast.success('Resource created successfully!');
      }
      fetchResources();
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      await cmdbInfrastructureAPI.delete(id);
      toast.success('Resource deleted!');
      fetchResources();
    } catch (error: any) {
      toast.error('Failed to delete resource');
    }
  };

  const handleOpenModal = (resource?: Resource) => {
    if (resource) {
      setSelectedResource(resource);
      setFormData({
        name: resource.name,
        category: resource.category,
        description: resource.description || '',
        url: resource.url || '',
        ipAddress: resource.ipAddress || '',
        port: resource.port || '',
        username: resource.username || '',
        password: resource.password || '',
        apiKey: resource.apiKey || '',
        environment: resource.environment,
        status: resource.status,
        tags: resource.tags || [],
        notes: resource.notes || '',
        accessInstructions: resource.accessInstructions || '',
      });
    } else {
      setSelectedResource(null);
      setFormData({
        name: '',
        category: 'server',
        description: '',
        url: '',
        ipAddress: '',
        port: '',
        username: '',
        password: '',
        apiKey: '',
        environment: 'production',
        status: 'active',
        tags: [],
        notes: '',
        accessInstructions: '',
      });
    }
    setShowResourceModal(true);
  };

  const handleCloseModal = () => {
    setShowResourceModal(false);
    setSelectedResource(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleViewResource = (resource: Resource) => {
    router.push(`/cmdb-infrastructure/view/${resource._id}`);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedResource(null);
  };

  const getCategoryStyle = (category: string) => {
    return CATEGORIES.find((c) => c.value === category)?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgb(12, 190, 225)', boxShadow: 'rgb(12, 190, 225) 0px 0px 4px 0px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-4">
              <img src="/img/logo/netraga_logo.png" alt="Netraga Logo" className="h-10 w-10 sm:h-12 sm:w-12" />
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Campaign Manager
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b overflow-x-auto">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 sm:space-x-8 min-w-max sm:min-w-0">
            <Link
              href="/dashboard"
              className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Home</span>
            </Link>
            <Link
              href="/csv"
              className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
            >
              CSV Files
            </Link>
            <Link
              href="/campaigns"
              className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
            >
              Campaigns
            </Link>
            <Link
              href="/company-accounts"
              className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Company Accounts</span>
              <span className="sm:hidden">Accounts</span>
            </Link>
            <Link
              href="/calendar"
              className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
            >
              Calendar
            </Link>
            <Link
              href="/activity-logs"
              className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
            >
              <span className="flex items-center gap-1 sm:gap-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Activity Logs</span>
                <span className="sm:hidden">Logs</span>
              </span>
            </Link>
            <Link
              href="/cmdb-infrastructure"
              className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-purple-600 border-b-2 border-purple-600 whitespace-nowrap"
            >
              CMDB Infrastructure
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Page Header with Filters and Edit Controls */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">CMDB Infrastructure Workspace</h2>
              <p className="mt-1 text-sm text-gray-600">Manage your company's CMDB infrastructure resources</p>
            </div>
            <div className="flex items-center gap-3">
              {isEditMode ? (
                <>
                  <span className="px-3 py-1.5 bg-green-100 text-green-800 text-sm font-medium rounded-full flex items-center gap-2">
                    Edit Mode Active
                  </span>
                  <Link
                    href="/cmdb-infrastructure/add"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm inline-block"
                  >
                    Add Resource
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => setShowOTPModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm"
                >
                  Unlock Edit Mode
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={fetchResources}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500"
            />
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                fetchResources();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-medium"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <select
              value={filterEnvironment}
              onChange={(e) => {
                setFilterEnvironment(e.target.value);
                fetchResources();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-medium"
            >
              <option value="">All Environments</option>
              {ENVIRONMENTS.map((env) => (
                <option key={env} value={env}>
                  {env.charAt(0).toUpperCase() + env.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Resources */}
        <div>
        {resources.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">No resources found</h3>
            <p className="mt-3 text-base text-gray-700 font-medium">
              {isEditMode
                ? 'Get started by adding your first CMDB infrastructure resource'
                : 'Unlock edit mode to add resources'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <div
                key={resource._id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden group"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {resource.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {resource.description || 'No description'}
                      </p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getCategoryStyle(resource.category)}`}>
                      {CATEGORIES.find((c) => c.value === resource.category)?.label}
                    </span>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(resource.status)}`}>
                      {resource.status}
                    </span>
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {resource.environment}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    {resource.url && (
                      <div className="flex items-center text-gray-600">
                        <span className="text-xs mr-2">URL:</span>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 truncate"
                        >
                          {resource.url}
                        </a>
                      </div>
                    )}
                    {resource.ipAddress && (
                      <div className="flex items-center text-gray-600">
                        <span className="text-xs mr-2">IP:</span>
                        <span className="truncate">{resource.ipAddress}{resource.port ? `:${resource.port}` : ''}</span>
                      </div>
                    )}
                    {resource.username && (
                      <div className="flex items-center text-gray-600">
                        <span className="text-xs mr-2">User:</span>
                        <span className="truncate">{resource.username}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                    <button
                      onClick={() => handleViewResource(resource)}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      View
                    </button>
                    {isEditMode && (
                      <>
                        <Link
                          href={`/cmdb-infrastructure/edit/${resource._id}`}
                          className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium text-center"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(resource._id)}
                          className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OTP Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button
              onClick={() => {
                setShowOTPModal(false);
                setOtpSent(false);
                setOtp('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              X
            </button>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Unlock Edit Mode</h2>
              <p className="text-sm text-gray-600 mt-2">
                Enter your authorized email to receive an OTP
              </p>
            </div>

            {!otpSent ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Authorized Email
                  </label>
                  <select
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium bg-white"
                  >
                    <option value="" className="text-gray-500">Select your email</option>
                    {AUTHORIZED_EMAILS.map((email) => (
                      <option key={email} value={email} className="text-gray-900">
                        {email}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleSendOTP}
                  disabled={otpLoading || !otpEmail}
                  className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {otpLoading ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-900 font-bold">
                    OTP sent to <strong>{otpEmail}</strong>
                  </p>
                  <p className="text-xs text-green-700 font-semibold mt-1">
                    Valid for {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Enter 6-digit OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    placeholder="000000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-2xl tracking-widest font-mono text-gray-900 bg-white placeholder-gray-400"
                  />
                </div>

                <button
                  onClick={handleVerifyOTP}
                  disabled={otpVerifying || otp.length !== 6}
                  className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {otpVerifying ? 'Verifying...' : 'Verify OTP'}
                </button>

                <button
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                  }}
                  className="w-full px-4 py-2 text-sm text-gray-700 font-semibold hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  ← Change Email
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resource Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedResource ? 'Edit Resource' : 'Add New Resource'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                X
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-900 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium placeholder-gray-500"
                  placeholder="e.g., Production Mail Server"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium placeholder-gray-500 bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Environment *</label>
                <select
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium placeholder-gray-500 bg-white"
                >
                  {ENVIRONMENTS.map((env) => (
                    <option key={env} value={env}>
                      {env.charAt(0).toUpperCase() + env.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-900 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium placeholder-gray-500 bg-white"
                  placeholder="Brief description of this resource"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium placeholder-gray-500 bg-white"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">IP Address</label>
                <input
                  type="text"
                  value={formData.ipAddress}
                  onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium placeholder-gray-500 bg-white"
                  placeholder="192.168.1.1"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Port</label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium placeholder-gray-500 bg-white"
                  placeholder="8080"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium placeholder-gray-500 bg-white"
                  placeholder="admin"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-900 mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium placeholder-gray-500 bg-white"
                  placeholder="••••••••"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-900 mb-2">API Key</label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium placeholder-gray-500 bg-white"
                  placeholder="••••••••"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-900 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium placeholder-gray-500 bg-white"
                  placeholder="Additional notes or information"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrUpdate}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                {selectedResource ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
      <Footer />

      {/* Loading Modals */}
      <LoadingModal
        isOpen={saving}
        title={selectedResource ? 'Updating Resource...' : 'Creating Resource...'}
        subtitle={selectedResource ? 'Please wait while we update your CMDB infrastructure resource' : 'Please wait while we save your CMDB infrastructure resource'}
      />

      <LoadingModal
        isOpen={otpLoading}
        title="Sending OTP..."
        subtitle="Please wait while we send the verification code to your email"
      />

      <LoadingModal
        isOpen={otpVerifying}
        title="Verifying OTP..."
        subtitle="Please wait while we verify your code"
      />

      {/* View Modal */}
      {showViewModal && selectedResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">View Resource</h2>
              <button
                onClick={closeViewModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                X
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                <p className="text-gray-900 font-medium">{selectedResource.name}</p>
              </div>

              {/* Category, Environment, Status */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getCategoryStyle(selectedResource.category)}`}>
                    {selectedResource.category}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Environment</label>
                  <p className="text-gray-900 font-medium capitalize">{selectedResource.environment}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedResource.status)}`}>
                    {selectedResource.status}
                  </span>
                </div>
              </div>

              {/* Description */}
              {selectedResource.description && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900">{selectedResource.description}</p>
                </div>
              )}

              {/* URL */}
              {selectedResource.url && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">URL</label>
                  <a
                    href={selectedResource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline break-all"
                  >
                    {selectedResource.url}
                  </a>
                </div>
              )}

              {/* IP Address */}
              {selectedResource.ipAddress && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">IP Address</label>
                  <p className="text-gray-900 font-mono">{selectedResource.ipAddress}</p>
                </div>
              )}

              {/* Username */}
              {selectedResource.username && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
                  <p className="text-gray-900 font-medium">{selectedResource.username}</p>
                </div>
              )}

              {/* Access Instructions */}
              {selectedResource.accessInstructions && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Access Instructions</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedResource.accessInstructions}</p>
                </div>
              )}

              {/* Notes */}
              {selectedResource.notes && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Notes</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedResource.notes}</p>
                </div>
              )}

              {/* Tags */}
              {selectedResource.tags && selectedResource.tags.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedResource.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Created/Updated Info */}
              <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-semibold">Created:</span>{' '}
                  {new Date(selectedResource.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-semibold">Updated:</span>{' '}
                  {new Date(selectedResource.updatedAt).toLocaleDateString()}
                </div>
              </div>

              {/* Security Notice */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  Sensitive information (passwords, API keys) is hidden. Enable Edit Mode with OTP verification to view or modify sensitive data.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <button
                onClick={closeViewModal}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
