'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { campaignAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Footer from '@/components/Footer';

export default function CampaignDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const response = await campaignAPI.getOne(id);
      setCampaign(response.data.data);
    } catch (error: any) {
      console.error('Error fetching campaign:', error);
      toast.error('Failed to load campaign details');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading campaign details...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Campaign not found</p>
          <Link href="/campaigns" className="text-purple-600 hover:text-purple-700">
            ← Back to campaigns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      {/* Header */}
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

      {/* Navigation */}
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
              className="px-3 py-4 text-sm font-medium text-purple-600 border-b-2 border-purple-600"
            >
              Campaigns
            </Link>
            <Link
              href="/company-accounts"
              className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              Company Accounts
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-6">
          <Link href="/campaigns" className="text-purple-600 hover:text-purple-700 flex items-center gap-2">
            ← Back to campaigns
          </Link>
        </div>

        {/* Campaign Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{campaign.campaignName}</h2>
              <p className="text-gray-600">Created by {campaign.createdBy?.name}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(campaign.status)}`}>
              {campaign.status}
            </span>
          </div>
        </div>

        {/* Campaign Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Batch Size</p>
            <p className="text-3xl font-bold text-purple-600">{campaign.batchSize.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Emails Sent</p>
            <p className="text-3xl font-bold text-green-600">{campaign.emailsSent || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Failed</p>
            <p className="text-3xl font-bold text-red-600">{campaign.emailsFailed || 0}</p>
          </div>
        </div>

        {/* Campaign Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">CSV File:</span>
              <span className="font-medium">{campaign.csvFile?.originalName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Company Account:</span>
              <span className="font-medium">{campaign.companyAccount?.companyName || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Scheduled Date:</span>
              <span className="font-medium">{new Date(campaign.scheduledDate).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created At:</span>
              <span className="font-medium">{new Date(campaign.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Batch Range:</span>
              <span className="font-medium">{campaign.startIndex} - {campaign.endIndex}</span>
            </div>
            {campaign.conFerbotCampaignId && (
              <div className="flex justify-between">
                <span className="text-gray-600">Conferbot Campaign ID:</span>
                <span className="font-medium font-mono text-sm">{campaign.conFerbotCampaignId}</span>
              </div>
            )}
            {campaign.batchFilePath && (
              <div className="flex justify-between">
                <span className="text-gray-600">Batch File:</span>
                <span className="font-medium text-sm">{campaign.batchFilePath.split('/').pop()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Campaign Logs */}
        {campaign.logs && campaign.logs.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Logs</h3>
            <div className="space-y-3">
              {campaign.logs.map((log: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    log.level === 'success' ? 'bg-green-500' :
                    log.level === 'error' ? 'bg-red-500' :
                    log.level === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{log.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
