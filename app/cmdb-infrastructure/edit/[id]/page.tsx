'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { cmdbInfrastructureAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Footer from '@/components/Footer';
import LoadingModal from '@/components/LoadingModal';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';

const CATEGORIES = [
  { value: 'server', label: 'Server' },
  { value: 'mail_server', label: 'Mail Server' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'database', label: 'Database' },
  { value: 'devops', label: 'DevOps' },
  { value: 'network', label: 'Network' },
  { value: 'cloud_service', label: 'Cloud Service' },
  { value: 'other', label: 'Other' },
];

const ENVIRONMENTS = ['production', 'staging', 'development', 'testing'];
const STATUSES = ['active', 'inactive', 'maintenance'];

export default function EditCmdbInfrastructurePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [resource, setResource] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'server',
    description: '',
    url: '',
    privateIpAddress: '',
    publicIpAddress: '',
    port: '',
    username: '',
    password: '',
    apiKey: '',
    sshKey: null as File | null,
    environment: 'production',
    status: 'active',
    tags: '',
    notes: '',
    accessInstructions: '',
    owner: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));
    loadResource();
  }, [id, router]);

  const loadResource = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await cmdbInfrastructureAPI.getOne(id, true);
      const resourceData = response.data.data;
      setResource(resourceData);

      setFormData({
        name: resourceData.name || '',
        category: resourceData.category || 'server',
        description: resourceData.description || '',
        url: resourceData.url || '',
        privateIpAddress: resourceData.privateIpAddress || '',
        publicIpAddress: resourceData.publicIpAddress || '',
        port: resourceData.port?.toString() || '',
        username: resourceData.username || '',
        password: resourceData.password || '',
        apiKey: resourceData.apiKey || '',
        sshKey: null,
        environment: resourceData.environment || 'production',
        status: resourceData.status || 'active',
        tags: resourceData.tags?.join(', ') || '',
        notes: resourceData.notes || '',
        accessInstructions: resourceData.accessInstructions || '',
        owner: resourceData.owner || '',
      });
    } catch (error: any) {
      console.error('Error loading resource:', error);
      toast.error(error.response?.data?.message || 'Failed to load resource');
      router.push('/cmdb-infrastructure');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, sshKey: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Resource name is required');
      return;
    }

    setSaving(true);
    try {
      const dataToSend: any = {
        name: formData.name.trim(),
        category: formData.category,
        environment: formData.environment,
        status: formData.status,
      };

      if (formData.description.trim()) dataToSend.description = formData.description.trim();
      if (formData.url.trim()) dataToSend.url = formData.url.trim();
      if (formData.privateIpAddress.trim()) dataToSend.privateIpAddress = formData.privateIpAddress.trim();
      if (formData.publicIpAddress.trim()) dataToSend.publicIpAddress = formData.publicIpAddress.trim();
      if (formData.port) dataToSend.port = parseInt(formData.port);
      if (formData.username.trim()) dataToSend.username = formData.username.trim();
      if (formData.password.trim()) dataToSend.password = formData.password.trim();
      if (formData.apiKey.trim()) dataToSend.apiKey = formData.apiKey.trim();
      if (formData.owner.trim()) dataToSend.owner = formData.owner.trim();
      if (formData.notes.trim()) dataToSend.notes = formData.notes.trim();
      if (formData.accessInstructions.trim()) dataToSend.accessInstructions = formData.accessInstructions.trim();
      if (formData.tags.trim()) {
        dataToSend.tags = formData.tags.split(',').map(t => t.trim()).filter(t => t);
      }
      if (formData.sshKey) {
        // Read SSH key file content
        const reader = new FileReader();
        const sshKeyContent = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsText(formData.sshKey as File);
        });
        dataToSend.sshKey = sshKeyContent;
      }

      await cmdbInfrastructureAPI.update(id, dataToSend);
      toast.success('Resource updated successfully');
      router.push(`/cmdb-infrastructure/view/${id}`);
    } catch (error: any) {
      console.error('Error updating resource:', error);
      toast.error(error.response?.data?.message || 'Failed to update resource');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading resource...</p>
        </div>
      </div>
    );
  }

  if (!user || !resource) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Loading Modal */}
      <LoadingModal
        isOpen={saving}
        title="Updating CMDB Infrastructure Resource"
        subtitle="Please wait while we save your changes..."
      />

      <Header user={user} />
      <NavigationMenu />

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 mb-20">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit CMDB Infrastructure Resource</h1>
              <p className="mt-1 text-sm text-gray-600">Update resource information in your CMDB</p>
            </div>
            <Link
              href="/cmdb-infrastructure"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </div>

        {/* CMDB Metadata */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">CMDB Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Created By:</span>
              <span className="ml-2 text-blue-900">
                {resource.createdBy?.name || 'Unknown'} ({resource.createdBy?.email || 'N/A'})
              </span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Created At:</span>
              <span className="ml-2 text-blue-900">{formatDate(resource.createdAt)}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Last Updated By:</span>
              <span className="ml-2 text-blue-900">
                {resource.updatedBy?.name || resource.createdBy?.name || 'Unknown'}
                ({resource.updatedBy?.email || resource.createdBy?.email || 'N/A'})
              </span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Last Updated At:</span>
              <span className="ml-2 text-blue-900">{formatDate(resource.updatedAt)}</span>
            </div>
            {resource.lastVerified && (
              <div>
                <span className="text-blue-700 font-medium">Last Verified:</span>
                <span className="ml-2 text-blue-900">{formatDate(resource.lastVerified)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 space-y-6">
            {/* Basic Information Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Name - Required */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Production Mail Server"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white placeholder-gray-400"
                    required
                  />
                </div>

                {/* Category - Required */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                    required
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Environment - Required */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Environment <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="environment"
                    value={formData.environment}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                    required
                  >
                    {ENVIRONMENTS.map(env => (
                      <option key={env} value={env}>{env.charAt(0).toUpperCase() + env.slice(1)}</option>
                    ))}
                  </select>
                </div>

                {/* Status - Required */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                    required
                  >
                    {STATUSES.map(status => (
                      <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Connection Details Section */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Connection Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* URL - Optional */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white placeholder-gray-400"
                  />
                </div>

                {/* Port - Optional */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Port <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    name="port"
                    value={formData.port}
                    onChange={handleInputChange}
                    placeholder="8080"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white placeholder-gray-400"
                  />
                </div>

                {/* Private IP Address - Optional */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Private IP Address <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="privateIpAddress"
                    value={formData.privateIpAddress}
                    onChange={handleInputChange}
                    placeholder="192.168.1.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white placeholder-gray-400"
                  />
                </div>

                {/* Public IP Address - Optional */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Public IP Address <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="publicIpAddress"
                    value={formData.publicIpAddress}
                    onChange={handleInputChange}
                    placeholder="203.0.113.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Credentials Section */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Credentials</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Username - Optional */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="admin"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white placeholder-gray-400"
                  />
                </div>

                {/* Password - Optional */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white placeholder-gray-400"
                  />
                </div>

                {/* API Key - Optional */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="password"
                    name="apiKey"
                    value={formData.apiKey}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white placeholder-gray-400"
                  />
                </div>

                {/* Owner of Server - Optional */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Owner of Server <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="owner"
                    value={formData.owner}
                    onChange={handleInputChange}
                    placeholder="e.g., IT Team, John Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white placeholder-gray-400"
                  />
                </div>

                {/* SSH Key - Optional */}
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SSH Key <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="file"
                    accept=".pem,.key,.pub"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  {formData.sshKey && (
                    <p className="mt-2 text-sm text-gray-600">Selected: {formData.sshKey.name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Description - Optional */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-gray-400 text-xs">(Optional, max 3000 characters)</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of this resource"
                    maxLength={3000}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white placeholder-gray-400"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.description.length}/3000 characters
                  </p>
                </div>

                {/* Access Instructions - Optional */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Instructions <span className="text-gray-400 text-xs">(Optional, max 3000 characters)</span>
                  </label>
                  <textarea
                    name="accessInstructions"
                    value={formData.accessInstructions}
                    onChange={handleInputChange}
                    placeholder="How to access this resource..."
                    maxLength={3000}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white placeholder-gray-400"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.accessInstructions.length}/3000 characters
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <Link
              href="/cmdb-infrastructure"
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Updating...' : 'Update Resource'}
            </button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}
