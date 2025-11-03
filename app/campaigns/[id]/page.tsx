'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { campaignAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';

export default function CampaignDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newScheduledDate, setNewScheduledDate] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    setUser(JSON.parse(userData));
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

  const handleCancelCampaign = async () => {
    if (!confirm('Are you sure you want to cancel this campaign? This action cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    setActionMessage('Cancelling campaign...');

    try {
      await campaignAPI.cancel(id);
      toast.success('Campaign cancelled successfully');
      await fetchCampaign();
    } catch (error: any) {
      console.error('Error cancelling campaign:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel campaign');
    } finally {
      setActionLoading(false);
      setActionMessage('');
    }
  };

  const handlePauseCampaign = async () => {
    setActionLoading(true);
    setActionMessage('Pausing campaign...');

    try {
      await campaignAPI.pause(id);
      toast.success('Campaign paused successfully');
      await fetchCampaign();
    } catch (error: any) {
      console.error('Error pausing campaign:', error);
      toast.error(error.response?.data?.message || 'Failed to pause campaign');
    } finally {
      setActionLoading(false);
      setActionMessage('');
    }
  };

  const handleResumeCampaign = async () => {
    setActionLoading(true);
    setActionMessage('Resuming campaign...');

    try {
      await campaignAPI.resume(id);
      toast.success('Campaign resumed successfully');
      await fetchCampaign();
    } catch (error: any) {
      console.error('Error resuming campaign:', error);
      toast.error(error.response?.data?.message || 'Failed to resume campaign');
    } finally {
      setActionLoading(false);
      setActionMessage('');
    }
  };

  const handleRescheduleCampaign = async () => {
    if (!newScheduledDate) {
      toast.error('Please select a new date');
      return;
    }

    setActionLoading(true);
    setActionMessage('Rescheduling campaign...');

    try {
      await campaignAPI.reschedule(id, { scheduledDate: newScheduledDate });
      toast.success('Campaign rescheduled successfully');
      setShowRescheduleModal(false);
      setNewScheduledDate('');
      await fetchCampaign();
    } catch (error: any) {
      console.error('Error rescheduling campaign:', error);
      toast.error(error.response?.data?.message || 'Failed to reschedule campaign');
    } finally {
      setActionLoading(false);
      setActionMessage('');
    }
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
      case 'paused':
        return 'bg-orange-100 text-orange-800';
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
          <p className="mt-4 text-white font-semibold">Loading campaign details...</p>
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
      <Header user={user} />
      <NavigationMenu />

      {/* Main Content */}
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 w-full">
        <div className="mb-4 sm:mb-6">
          <Link href="/campaigns" className="text-purple-600 hover:text-purple-700 flex items-center gap-2 text-sm sm:text-base">
            ← Back to campaigns
          </Link>
        </div>

        {/* Campaign Header */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0 mb-4">
            <div className="w-full sm:w-auto">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">{campaign.campaignName}</h2>
              <p className="text-sm sm:text-base text-gray-600">Created by {campaign.createdBy?.name}</p>
            </div>
            <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${getStatusColor(campaign.status)}`}>
              {campaign.status}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 pt-4 border-t border-gray-200">
            {/* Pause button - only for scheduled campaigns */}
            {campaign.status === 'scheduled' && (
              <button
                onClick={handlePauseCampaign}
                className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
              >
                Pause Campaign
              </button>
            )}

            {/* Resume button - only for paused campaigns */}
            {campaign.status === 'paused' && (
              <button
                onClick={handleResumeCampaign}
                className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                Resume Campaign
              </button>
            )}

            {/* Reschedule button - for scheduled or paused campaigns */}
            {(campaign.status === 'scheduled' || campaign.status === 'paused') && (
              <button
                onClick={() => setShowRescheduleModal(true)}
                className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Reschedule
              </button>
            )}

            {/* Cancel button - for scheduled or paused campaigns */}
            {(campaign.status === 'scheduled' || campaign.status === 'paused') && (
              <button
                onClick={handleCancelCampaign}
                className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Cancel Campaign
              </button>
            )}
          </div>
        </div>

        {/* Campaign Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Batch Size</p>
            <p className="text-2xl sm:text-3xl font-bold text-purple-600">{campaign.batchSize.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Emails Sent</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">{campaign.emailsSent || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Failed</p>
            <p className="text-2xl sm:text-3xl font-bold text-red-600">{campaign.emailsFailed || 0}</p>
          </div>
        </div>

        {/* Campaign Details */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Campaign Details</h3>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-xs sm:text-sm text-gray-600">CSV File:</span>
              <span className="text-sm sm:text-base font-medium break-all">{campaign.csvFile?.originalName || 'N/A'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-xs sm:text-sm text-gray-600">Company Account:</span>
              <span className="text-sm sm:text-base font-medium break-all">{campaign.companyAccount?.companyName || 'N/A'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-xs sm:text-sm text-gray-600">Scheduled Date:</span>
              <span className="text-sm sm:text-base font-medium">{campaign.scheduledDate ? new Date(campaign.scheduledDate).toLocaleString() : 'N/A'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-xs sm:text-sm text-gray-600">Created At:</span>
              <span className="text-sm sm:text-base font-medium">{campaign.createdAt ? new Date(campaign.createdAt).toLocaleString() : 'N/A'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-xs sm:text-sm text-gray-600">Batch Range:</span>
              <span className="text-sm sm:text-base font-medium">{campaign.startIndex !== undefined && campaign.endIndex !== undefined ? `${campaign.startIndex} - ${campaign.endIndex}` : 'N/A'}</span>
            </div>
            {campaign.conFerbotCampaignId && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="text-xs sm:text-sm text-gray-600">Conferbot Campaign ID:</span>
                <span className="text-xs sm:text-sm font-medium font-mono break-all">{campaign.conFerbotCampaignId}</span>
              </div>
            )}
            {campaign.batchFilePath && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="text-xs sm:text-sm text-gray-600">Batch File:</span>
                <span className="text-xs sm:text-sm font-medium break-all">{campaign.batchFilePath.split('/').pop()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Campaign Logs */}
        {campaign.logs && campaign.logs.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 sm:p-5 md:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Campaign Logs</h3>
            <div className="space-y-2 sm:space-y-3">
              {campaign.logs.map((log: any, index: number) => (
                <div key={index} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-1 sm:mt-2 flex-shrink-0 ${
                    log.level === 'success' ? 'bg-green-500' :
                    log.level === 'error' ? 'bg-red-500' :
                    log.level === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-900 break-words">{log.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading Modal */}
        {actionLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 sm:p-8 max-w-md w-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  Processing...
                </h3>
                <p className="text-sm sm:text-base text-gray-600">{actionMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Reschedule Modal */}
        {showRescheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 sm:p-8 max-w-md w-full">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                Reschedule Campaign
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                Select a new date and time for this campaign
              </p>

              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  New Scheduled Date
                </label>
                <input
                  type="datetime-local"
                  value={newScheduledDate}
                  onChange={(e) => setNewScheduledDate(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={handleRescheduleCampaign}
                  disabled={!newScheduledDate}
                  className="w-full sm:flex-1 px-4 py-2 text-sm sm:text-base bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Reschedule
                </button>
                <button
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setNewScheduledDate('');
                  }}
                  className="w-full sm:flex-1 px-4 py-2 text-sm sm:text-base bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
