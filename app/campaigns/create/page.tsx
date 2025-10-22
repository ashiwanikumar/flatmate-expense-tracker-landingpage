'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { csvAPI, campaignAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Footer from '@/components/Footer';

export default function CreateCampaignPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const csvId = searchParams.get('csvId');

  const [csvFiles, setCsvFiles] = useState<any[]>([]);
  const [selectedCsv, setSelectedCsv] = useState(csvId || '');
  const [campaignPlan, setCampaignPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    batchSize: 1500,
    scheduledDate: '',
    campaignName: '',
  });
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchCsvFiles();
  }, []);

  useEffect(() => {
    if (selectedCsv) {
      calculatePlan();
    }
  }, [selectedCsv]);

  const fetchCsvFiles = async () => {
    try {
      const response = await csvAPI.getAll();
      setCsvFiles(response.data.data.filter((file: any) => file.status === 'active'));
    } catch (error) {
      toast.error('Failed to load CSV files');
    }
  };

  const calculatePlan = async () => {
    if (!selectedCsv) return;

    setCalculating(true);
    try {
      const response = await campaignAPI.calculatePlan({
        csvFileId: selectedCsv,
        batchPattern: [1500, 1600, 1700, 1800, 1900, 2000],
        startDate: new Date(),
      });
      setCampaignPlan(response.data.data);
    } catch (error) {
      toast.error('Failed to calculate campaign plan');
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCsv) {
      toast.error('Please select a CSV file');
      return;
    }

    if (!formData.scheduledDate) {
      toast.error('Please select a scheduled date');
      return;
    }

    setLoading(true);

    try {
      await campaignAPI.create({
        csvFileId: selectedCsv,
        batchSize: parseInt(formData.batchSize.toString()),
        scheduledDate: formData.scheduledDate,
        campaignName: formData.campaignName || undefined,
      });

      toast.success('Campaign created successfully!');
      router.push('/campaigns');
    } catch (error: any) {
      console.error('Create campaign error:', error);
      toast.error(error.response?.data?.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Campaign Manager
            </h1>
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
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/campaigns" className="text-purple-600 hover:text-purple-700 flex items-center gap-2">
            ← Back to campaigns
          </Link>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-8">Create New Campaign</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Details</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select CSV File *</label>
                <select
                  value={selectedCsv}
                  onChange={(e) => setSelectedCsv(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="">Choose a CSV file...</option>
                  {csvFiles.map((file) => (
                    <option key={file._id} value={file._id}>
                      {file.originalName} ({file.remainingCount.toLocaleString()} remaining)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Size *</label>
                <input
                  type="number"
                  value={formData.batchSize}
                  onChange={(e) => setFormData({ ...formData, batchSize: parseInt(e.target.value) })}
                  required
                  min="100"
                  max="5000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Number of emails to send (100-5000)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name (Optional)</label>
                <input
                  type="text"
                  value={formData.campaignName}
                  onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                  placeholder="Leave empty for auto-generated name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Format: WU{'{DD}{MM}{YYYY}'}</p>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedCsv}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Campaign...' : 'Create Campaign'}
              </button>
            </form>
          </div>

          {/* Campaign Plan Preview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Plan Preview</h3>

            {calculating ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Calculating plan...</p>
              </div>
            ) : campaignPlan ? (
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Overview</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Emails:</span>
                      <span className="font-semibold">{campaignPlan.csvFile.totalEmails.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Already Sent:</span>
                      <span className="font-semibold text-green-600">{campaignPlan.csvFile.sentCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining:</span>
                      <span className="font-semibold text-blue-600">{campaignPlan.csvFile.remainingCount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Plan Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Days:</span>
                      <span className="font-semibold">{campaignPlan.totalDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg. per Day:</span>
                      <span className="font-semibold">{campaignPlan.averagePerDay.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Upcoming Campaigns</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {campaignPlan.campaigns.slice(0, 7).map((camp: any) => (
                      <div key={camp.day} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                        <span className="text-gray-600">Day {camp.day}</span>
                        <span className="font-medium">{camp.campaignName}</span>
                        <span className="text-purple-600 font-semibold">{camp.batchSize.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Select a CSV file to see the campaign plan
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
