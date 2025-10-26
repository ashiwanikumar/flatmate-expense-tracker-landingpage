'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { campaignAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Footer from '@/components/Footer';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingModal from '@/components/LoadingModal';

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [deleteSingleModal, setDeleteSingleModal] = useState<{ open: boolean; campaignId: string | null; campaignName: string }>({
    open: false,
    campaignId: null,
    campaignName: '',
  });
  const [deleteBulkModal, setDeleteBulkModal] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchCampaigns();
  }, [filter, currentPage, itemsPerPage]);

  const fetchCampaigns = async () => {
    try {
      // Show filtering modal if not initial load
      if (!loading) {
        setFiltering(true);
      }

      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (filter !== 'all') {
        params.status = filter;
      }
      const response = await campaignAPI.getAll(params);
      setCampaigns(response.data.data);
      setTotalItems(response.data.total || 0);
      setTotalPages(response.data.pages || 0);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
      setFiltering(false);
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

  const handleDeleteSingle = async () => {
    if (!deleteSingleModal.campaignId) return;

    setDeleting(true);
    try {
      await campaignAPI.delete(deleteSingleModal.campaignId);
      toast.success('Campaign deleted successfully');
      setDeleteSingleModal({ open: false, campaignId: null, campaignName: '' });
      fetchCampaigns();
      setSelectedCampaigns(prev => prev.filter(id => id !== deleteSingleModal.campaignId));
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      toast.error(error.response?.data?.message || 'Failed to delete campaign');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    setDeleteBulkModal(false);
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

  const handleBulkDeleteClick = () => {
    if (selectedCampaigns.length === 0) {
      toast.error('Please select campaigns to delete');
      return;
    }
    setDeleteBulkModal(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedCampaigns([]); // Clear selections when changing page
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset to first page when changing items per page
    setSelectedCampaigns([]); // Clear selections
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to first page when changing filter
    setSelectedCampaigns([]); // Clear selections
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgb(12, 190, 225)', boxShadow: 'rgb(12, 190, 225) 0px 0px 4px 0px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white font-semibold">Loading Campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
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
              className="px-2 sm:px-3 py-4 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
            >
              Dashboard
            </Link>
            <Link
              href="/csv"
              className="px-2 sm:px-3 py-4 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
            >
              CSV Files
            </Link>
            <Link
              href="/campaigns"
              className="px-2 sm:px-3 py-4 text-xs sm:text-sm font-medium text-purple-600 border-b-2 border-purple-600 whitespace-nowrap"
            >
              Campaigns
            </Link>
            <Link
              href="/company-accounts"
              className="px-2 sm:px-3 py-4 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Company Accounts</span>
              <span className="sm:hidden">Accounts</span>
            </Link>
            <Link
              href="/calendar"
              className="px-2 sm:px-3 py-4 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
            >
              📅 <span className="hidden sm:inline">Calendar</span>
            </Link>
            <Link
              href="/activity-logs"
              className="px-2 sm:px-3 py-4 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
            >
              <span className="flex items-center gap-1 sm:gap-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Activity Logs</span>
                <span className="sm:hidden">Logs</span>
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow px-4 sm:px-6 lg:px-8 py-4 sm:py-8 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">All Campaigns</h2>
            {selectedCampaigns.length > 0 && (
              <button
                onClick={handleBulkDeleteClick}
                disabled={deleting}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-red-600 text-white text-xs sm:text-sm rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : `Delete Selected (${selectedCampaigns.length})`}
              </button>
            )}
          </div>
          <Link
            href="/campaigns/create"
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm sm:text-base rounded-lg font-semibold hover:shadow-lg transition text-center"
          >
            + Create Campaign
          </Link>
        </div>

        {/* Filters and View Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto overflow-x-auto">
            {['all', 'scheduled', 'in_progress', 'completed', 'failed'].map((status) => (
              <button
                key={status}
                onClick={() => handleFilterChange(status)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                  filter === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition flex items-center justify-center gap-1 sm:gap-2 ${
                  viewMode === 'list'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                List
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition flex items-center justify-center gap-1 sm:gap-2 ${
                  viewMode === 'card'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Card
              </button>
            </div>

            {campaigns.length > 0 && (
              <label className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-gray-700 cursor-pointer bg-white sm:bg-transparent px-3 sm:px-0 py-2 sm:py-0 rounded-lg sm:rounded-none border sm:border-0 border-gray-300">
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
        </div>

        {/* Campaigns Display */}
        {campaigns.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 sm:p-12 text-center">
            <p className="text-sm sm:text-base text-gray-500 mb-4">No campaigns found.</p>
            <Link
              href="/campaigns/create"
              className="inline-block w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white text-sm sm:text-base rounded-lg hover:bg-purple-700 transition"
            >
              Create Your First Campaign
            </Link>
          </div>
        ) : viewMode === 'list' ? (
          /* List View */
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {campaigns.map((campaign) => (
              <div key={campaign._id} className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedCampaigns.includes(campaign._id)}
                    onChange={() => handleSelectCampaign(campaign._id)}
                    className="mt-1 rounded text-purple-600 focus:ring-purple-500"
                  />

                  {/* Campaign Details */}
                  <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">{campaign.campaignName}</h3>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)} w-fit`}>
                        {campaign.status}
                      </span>
                    </div>

                    <div className="space-y-1 mb-3 sm:mb-4">
                      <p className="text-xs sm:text-sm text-gray-600">
                        CSV: <span className="font-medium text-gray-900">{campaign.csvFile?.originalName || 'N/A'}</span>
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Company: <span className="font-medium text-gray-900">{campaign.companyAccount?.companyName || 'N/A'}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Batch Size</p>
                        <p className="text-base sm:text-lg font-semibold">{campaign.batchSize.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Emails Sent</p>
                        <p className="text-base sm:text-lg font-semibold text-green-600">{campaign.emailsSent || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Failed</p>
                        <p className="text-base sm:text-lg font-semibold text-red-600">{campaign.emailsFailed || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Scheduled Date</p>
                        <p className="text-xs sm:text-sm font-semibold">{new Date(campaign.scheduledDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Created</p>
                        <p className="text-xs sm:text-sm font-semibold">{new Date(campaign.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {campaign.conFerbotCampaignId && (
                      <p className="text-xs text-gray-500 mt-3">
                        Conferbot ID: {campaign.conFerbotCampaignId}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                    <Link
                      href={`/campaigns/${campaign._id}`}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-purple-100 text-purple-700 text-xs sm:text-sm rounded-lg hover:bg-purple-200 transition text-center"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => setDeleteSingleModal({ open: true, campaignId: campaign._id, campaignName: campaign.campaignName })}
                      disabled={deleting}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-100 text-red-700 text-xs sm:text-sm rounded-lg hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Card View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {campaigns.map((campaign) => (
              <div key={campaign._id} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden flex flex-col">
                {/* Checkbox */}
                <div className="p-3 sm:p-4 border-b flex items-center justify-between">
                  <input
                    type="checkbox"
                    checked={selectedCampaigns.includes(campaign._id)}
                    onChange={() => handleSelectCampaign(campaign._id)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-3 sm:p-4 flex-grow">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 truncate" title={campaign.campaignName}>
                    {campaign.campaignName}
                  </h3>

                  <div className="space-y-2 mb-3 sm:mb-4">
                    <div>
                      <p className="text-xs text-gray-500">CSV File</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate" title={campaign.csvFile?.originalName}>
                        {campaign.csvFile?.originalName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Company</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate" title={campaign.companyAccount?.companyName}>
                        {campaign.companyAccount?.companyName || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Batch Size</p>
                      <p className="text-sm sm:text-base font-semibold">{campaign.batchSize.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Sent</p>
                      <p className="text-sm sm:text-base font-semibold text-green-600">{campaign.emailsSent || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Failed</p>
                      <p className="text-sm sm:text-base font-semibold text-red-600">{campaign.emailsFailed || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Progress</p>
                      <p className="text-sm sm:text-base font-semibold text-purple-600">
                        {campaign.batchSize > 0 ? Math.round((campaign.emailsSent || 0) / campaign.batchSize * 100) : 0}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-gray-500">
                    <p>
                      <span className="font-medium">Scheduled:</span>{' '}
                      {new Date(campaign.scheduledDate).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-medium">Created:</span>{' '}
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-3 sm:p-4 bg-gray-50 border-t flex gap-2">
                  <Link
                    href={`/campaigns/${campaign._id}`}
                    className="flex-1 px-2 sm:px-3 py-2 bg-purple-100 text-purple-700 text-xs font-medium rounded-lg hover:bg-purple-200 transition text-center"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => setDeleteSingleModal({ open: true, campaignId: campaign._id, campaignName: campaign.campaignName })}
                    disabled={deleting}
                    className="flex-1 px-2 sm:px-3 py-2 bg-red-100 text-red-700 text-xs font-medium rounded-lg hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalItems > 0 && (
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 sm:p-4 rounded-lg shadow">
            {/* Items per page selector */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <span className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                className="w-full sm:w-auto px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-xs sm:text-sm text-gray-900 bg-white"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
              </select>
              <span className="text-xs sm:text-sm text-gray-600 text-center">
                Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
              </span>
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2 sm:px-4 py-2 bg-white border border-gray-300 text-gray-700 text-xs sm:text-sm rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </button>

              <div className="flex gap-1 overflow-x-auto max-w-[200px] sm:max-w-none">
                {/* First page - hide on mobile if not near start */}
                {currentPage > 3 && (
                  <>
                    <button
                      onClick={() => handlePageChange(1)}
                      className="hidden sm:block px-3 py-2 bg-white border border-gray-300 text-gray-700 text-xs sm:text-sm rounded-lg hover:bg-gray-50 transition"
                    >
                      1
                    </button>
                    {currentPage > 4 && <span className="hidden sm:block px-2 py-2 text-gray-500 text-xs sm:text-sm">...</span>}
                  </>
                )}

                {/* Pages around current page */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // On mobile, show only current page and adjacent pages
                    const isMobileRange = page === currentPage || page === currentPage - 1 || page === currentPage + 1;
                    // On desktop, show more pages
                    const isDesktopRange = page === currentPage || page === currentPage - 1 || page === currentPage + 1 || page === currentPage - 2 || page === currentPage + 2;
                    return isDesktopRange;
                  })
                  .map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-2 sm:px-3 py-2 rounded-lg transition text-xs sm:text-sm whitespace-nowrap ${
                        page === currentPage
                          ? 'bg-purple-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                {/* Last page - hide on mobile if not near end */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && <span className="hidden sm:block px-2 py-2 text-gray-500 text-xs sm:text-sm">...</span>}
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className="hidden sm:block px-3 py-2 bg-white border border-gray-300 text-gray-700 text-xs sm:text-sm rounded-lg hover:bg-gray-50 transition"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-2 sm:px-4 py-2 bg-white border border-gray-300 text-gray-700 text-xs sm:text-sm rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />

      {/* Delete Single Campaign Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteSingleModal.open}
        title="Confirm Delete"
        message={`Are you sure you want to delete "${deleteSingleModal.campaignName}"?`}
        onConfirm={handleDeleteSingle}
        onCancel={() => setDeleteSingleModal({ open: false, campaignId: null, campaignName: '' })}
        confirmText="OK"
        cancelText="Cancel"
        confirmButtonClass="bg-blue-600 hover:bg-blue-700"
      />

      {/* Delete Multiple Campaigns Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteBulkModal}
        title="Confirm Delete"
        message={`Are you sure you want to delete ${selectedCampaigns.length} campaign(s)?`}
        onConfirm={handleBulkDelete}
        onCancel={() => setDeleteBulkModal(false)}
        confirmText="OK"
        cancelText="Cancel"
        confirmButtonClass="bg-blue-600 hover:bg-blue-700"
      />

      {/* Filtering Loading Modal */}
      <LoadingModal
        isOpen={filtering}
        title="Loading Campaigns"
        subtitle="Filtering campaigns, please wait..."
      />
    </div>
  );
}
