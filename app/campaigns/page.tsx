'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { campaignAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Footer from '@/components/Footer';

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchCampaigns();
  }, [filter]);

  const fetchCampaigns = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await campaignAPI.getAll(params);
      setCampaigns(response.data.data);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleSelectCampaign = (campaignId: string) => {
    setSelectedCampaigns(prev =>
      prev.includes(campaignId)
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCampaigns.length === campaigns.length) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(campaigns.map(c => c._id));
    }
  };

  const handleDeleteSingle = async (campaignId: string, campaignName: string) => {
    if (!confirm(`Are you sure you want to delete "${campaignName}"?`)) {
      return;
    }

    setDeleting(true);
    try {
      await campaignAPI.delete(campaignId);
      toast.success('Campaign deleted successfully');
      fetchCampaigns();
      setSelectedCampaigns(prev => prev.filter(id => id !== campaignId));
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      toast.error(error.response?.data?.message || 'Failed to delete campaign');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCampaigns.length === 0) {
      toast.error('Please select campaigns to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedCampaigns.length} campaign(s)?`)) {
      return;
    }

    setDeleting(true);
    let successCount = 0;
    let failCount = 0;

    for (const campaignId of selectedCampaigns) {
      try {
        await campaignAPI.delete(campaignId);
        successCount++;
      } catch (error) {
        console.error(`Failed to delete campaign ${campaignId}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} campaign(s) deleted successfully`);
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} campaign(s)`);
    }

    setSelectedCampaigns([]);
    fetchCampaigns();
    setDeleting(false);
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
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading campaigns...</p>
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
            <Link
              href="/calendar"
              className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              📅 Calendar
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">All Campaigns</h2>
            {selectedCampaigns.length > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : `Delete Selected (${selectedCampaigns.length})`}
              </button>
            )}
          </div>
          <Link
            href="/campaigns/create"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
          >
            + Create Campaign
          </Link>
        </div>

        {/* Filters */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            {['all', 'scheduled', 'in_progress', 'completed', 'failed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>
          {campaigns.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCampaigns.length === campaigns.length}
                onChange={handleSelectAll}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              Select All
            </label>
          )}
        </div>

        {/* Campaigns List */}
        {campaigns.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No campaigns found.</p>
            <Link
              href="/campaigns/create"
              className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Create Your First Campaign
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {campaigns.map((campaign) => (
              <div key={campaign._id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedCampaigns.includes(campaign._id)}
                    onChange={() => handleSelectCampaign(campaign._id)}
                    className="mt-1 rounded text-purple-600 focus:ring-purple-500"
                  />

                  {/* Campaign Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{campaign.campaignName}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </div>

                    <div className="space-y-1 mb-4">
                      <p className="text-sm text-gray-600">
                        CSV: <span className="font-medium text-gray-900">{campaign.csvFile?.originalName || 'N/A'}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Company: <span className="font-medium text-gray-900">{campaign.companyAccount?.companyName || 'N/A'}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Batch Size</p>
                        <p className="text-lg font-semibold">{campaign.batchSize.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Emails Sent</p>
                        <p className="text-lg font-semibold text-green-600">{campaign.emailsSent || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Failed</p>
                        <p className="text-lg font-semibold text-red-600">{campaign.emailsFailed || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Scheduled Date</p>
                        <p className="text-sm font-semibold">{new Date(campaign.scheduledDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Created</p>
                        <p className="text-sm font-semibold">{new Date(campaign.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {campaign.conFerbotCampaignId && (
                      <p className="text-xs text-gray-500 mt-3">
                        Conferbot ID: {campaign.conFerbotCampaignId}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/campaigns/${campaign._id}`}
                      className="px-4 py-2 bg-purple-100 text-purple-700 text-sm rounded-lg hover:bg-purple-200 transition text-center"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleDeleteSingle(campaign._id, campaign.campaignName)}
                      disabled={deleting}
                      className="px-4 py-2 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
