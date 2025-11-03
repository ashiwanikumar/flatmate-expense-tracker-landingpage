'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { cmdbInfrastructureAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Footer from '@/components/Footer';
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

export default function ViewCmdbInfrastructurePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [resource, setResource] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));
  }, [router]);

  useEffect(() => {
    if (id && user) {
      fetchResource();
    }
  }, [id, user]);

  const fetchResource = async () => {
    try {
      setLoading(true);
      const response = await cmdbInfrastructureAPI.getOne(id);
      setResource(response.data.data);
    } catch (error: any) {
      console.error('Error fetching resource:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch resource');
      router.push('/cmdb-infrastructure');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getCategoryLabel = (value: string) => {
    const category = CATEGORIES.find(cat => cat.value === value);
    return category ? category.label : value;
  };

  const getStatusBadge = (status: string) => {
    const statusColors: any = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getEnvironmentBadge = (environment: string) => {
    const envColors: any = {
      production: 'bg-red-100 text-red-800',
      staging: 'bg-blue-100 text-blue-800',
      development: 'bg-purple-100 text-purple-800',
      testing: 'bg-orange-100 text-orange-800',
    };
    return envColors[environment] || 'bg-gray-100 text-gray-800';
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading resource details...</p>
        </div>
      </div>
    );
  }

  if (!resource) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <NavigationMenu />

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 mb-20">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{resource.name}</h1>
              <p className="mt-1 text-sm text-gray-600">View CMDB Infrastructure Resource Details</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/cmdb-infrastructure"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back to List
              </Link>
              <Link
                href={`/cmdb-infrastructure/edit/${resource._id}`}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                Edit Resource
              </Link>
            </div>
          </div>
        </div>

        {/* View Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 space-y-6">
            {/* Metadata Section - Created and Updated */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Resource Metadata</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <p className="text-sm text-gray-900">{formatDate(resource.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Updated</label>
                  <p className="text-sm text-gray-900">{formatDate(resource.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Basic Information Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-sm text-gray-900">{resource.name || 'N/A'}</p>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <p className="text-sm text-gray-900">{getCategoryLabel(resource.category)}</p>
                </div>

                {/* Environment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEnvironmentBadge(resource.environment)}`}>
                    {resource.environment?.charAt(0).toUpperCase() + resource.environment?.slice(1)}
                  </span>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(resource.status)}`}>
                    {resource.status?.charAt(0).toUpperCase() + resource.status?.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Connection Details Section */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Connection Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  {resource.url ? (
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                      {resource.url}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500">Not provided</p>
                  )}
                </div>

                {/* Port */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                  <p className="text-sm text-gray-900">{resource.port || 'Not provided'}</p>
                </div>

                {/* Private IP Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Private IP Address</label>
                  <p className="text-sm text-gray-900">{resource.privateIpAddress || 'Not provided'}</p>
                </div>

                {/* Public IP Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Public IP Address</label>
                  <p className="text-sm text-gray-900">{resource.publicIpAddress || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Credentials Section */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Credentials</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <p className="text-sm text-gray-900">{resource.username || 'Not provided'}</p>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <p className="text-sm text-gray-500">{resource.password ? '••••••••' : 'Not provided'}</p>
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <p className="text-sm text-gray-500">{resource.apiKey ? '••••••••' : 'Not provided'}</p>
                </div>

                {/* Owner of Server */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner of Server</label>
                  <p className="text-sm text-gray-900">{resource.owner || 'Not provided'}</p>
                </div>

                {/* SSH Key */}
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">SSH Key</label>
                  <p className="text-sm text-gray-500">{resource.sshKey ? 'SSH key configured (encrypted)' : 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <div className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-200 min-h-[100px]">
                    {resource.description || 'No description provided'}
                  </div>
                </div>

                {/* Access Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Access Instructions</label>
                  <div className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-200 min-h-[100px]">
                    {resource.accessInstructions || 'No access instructions provided'}
                  </div>
                </div>
              </div>

              {/* Tags */}
              {resource.tags && resource.tags.length > 0 && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {resource.tags.map((tag: string, index: number) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {resource.notes && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <div className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {resource.notes}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            <Link
              href="/cmdb-infrastructure"
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to List
            </Link>
            <Link
              href={`/cmdb-infrastructure/edit/${resource._id}`}
              className="px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
            >
              Edit Resource
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
