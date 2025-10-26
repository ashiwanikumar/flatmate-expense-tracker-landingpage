'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { campaignAPI, companyAccountAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Footer from '@/components/Footer';

export default function CalendarPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [campaignsRes, companiesRes] = await Promise.all([
        campaignAPI.getAll({ limit: 10000 }), // Fetch all campaigns
        companyAccountAPI.getAll()
      ]);
      setCampaigns(campaignsRes.data.data || []);
      setCompanies(companiesRes.data.data || []);
    } catch (error: any) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, firstDay, lastDay };
  };

  const getCampaignsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return campaigns.filter(campaign => {
      const scheduledDate = new Date(campaign.scheduledDate || campaign.createdAt);
      const campaignDateStr = scheduledDate.toISOString().split('T')[0];

      // Filter by company if selected
      if (selectedCompany !== 'all' && campaign.companyAccount?._id !== selectedCompany) {
        return false;
      }

      return campaignDateStr === dateStr;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'running':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'scheduled':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleCampaignClick = (campaign: any) => {
    setSelectedCampaign(campaign);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCampaign(null);
  };

  const handleDateClick = (date: Date) => {
    const dateCampaigns = getCampaignsForDate(date);
    if (dateCampaigns.length > 0) {
      setSelectedDate(date);
      setShowDateModal(true);
    }
  };

  const closeDateModal = () => {
    setShowDateModal(false);
    setSelectedDate(null);
  };

  const renderMonthView = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const weeks = [];
    let days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-32 bg-gray-50 border border-gray-200 p-2"></div>
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayCampaigns = getCampaignsForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <div
          key={day}
          className={`min-h-32 border border-gray-200 p-2 ${
            isToday ? 'bg-blue-50' : 'bg-white'
          } hover:bg-gray-50 transition`}
        >
          <div
            className={`text-sm font-semibold mb-2 ${isToday ? 'text-blue-600' : 'text-gray-700'} ${dayCampaigns.length > 0 ? 'cursor-pointer hover:underline' : ''}`}
            onClick={() => dayCampaigns.length > 0 && handleDateClick(date)}
          >
            {day}
            {isToday && <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">Today</span>}
            {dayCampaigns.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                {dayCampaigns.length}
              </span>
            )}
          </div>
          <div className="space-y-1">
            {dayCampaigns.slice(0, 3).map((campaign) => (
              <div
                key={campaign._id}
                onClick={() => handleCampaignClick(campaign)}
                className={`text-xs px-2 py-1 rounded border cursor-pointer truncate hover:opacity-80 transition ${getStatusColor(campaign.status)}`}
                title={`${campaign.campaignName} - ${campaign.companyAccount?.companyName || 'Unknown'}`}
              >
                <div className="font-medium truncate">{campaign.campaignName}</div>
                <div className="text-[10px] opacity-75">{campaign.companyAccount?.companyName}</div>
              </div>
            ))}
            {dayCampaigns.length > 3 && (
              <div className="text-xs text-gray-500 font-medium px-2">
                +{dayCampaigns.length - 3} more
              </div>
            )}
          </div>
        </div>
      );

      // Start a new week after Saturday
      if ((startingDayOfWeek + day) % 7 === 0) {
        weeks.push(
          <div key={`week-${weeks.length}`} className="grid grid-cols-7 gap-0">
            {days}
          </div>
        );
        days = [];
      }
    }

    // Add remaining days to the last week
    if (days.length > 0) {
      while (days.length < 7) {
        days.push(
          <div key={`empty-end-${days.length}`} className="min-h-32 bg-gray-50 border border-gray-200 p-2"></div>
        );
      }
      weeks.push(
        <div key={`week-${weeks.length}`} className="grid grid-cols-7 gap-0">
          {days}
        </div>
      );
    }

    return weeks;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgb(12, 190, 225)', boxShadow: 'rgb(12, 190, 225) 0px 0px 4px 0px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white font-semibold">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
      {/* Header with Navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Left side: Logo, Title, and Navigation */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <img src="/img/logo/netraga_logo.png" alt="Netraga Logo" className="h-10 w-10" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent whitespace-nowrap">
                  Campaign Manager
                </h1>
              </div>

              {/* Navigation */}
              <nav className="flex space-x-6">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-gray-600 hover:text-purple-600 transition"
                >
                  Dashboard
                </Link>
                <Link
                  href="/csv"
                  className="text-sm font-medium text-gray-600 hover:text-purple-600 transition"
                >
                  CSV Files
                </Link>
                <Link
                  href="/campaigns"
                  className="text-sm font-medium text-gray-600 hover:text-purple-600 transition"
                >
                  Campaigns
                </Link>
                <Link
                  href="/company-accounts"
                  className="text-sm font-medium text-gray-600 hover:text-purple-600 transition"
                >
                  Company Accounts
                </Link>
                <Link
                  href="/calendar"
                  className="text-sm font-medium text-purple-600 border-b-2 border-purple-600 pb-1"
                >
                  📅 Calendar
                </Link>
                <Link
                  href="/activity-logs"
                  className="text-sm font-medium text-gray-600 hover:text-purple-600 transition"
                >
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Activity Logs
                  </span>
                </Link>
              </nav>
            </div>

            {/* Right side: Logout button */}
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
              }}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex-grow p-8">
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Campaign Calendar
              </h1>
              <p className="text-gray-600 mt-1">Visualize and manage your campaigns</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Company Filter */}
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 bg-white font-medium"
              >
                <option value="all" className="text-gray-900">All Companies</option>
                {companies.map((company) => (
                  <option key={company._id} value={company._id} className="text-gray-900">
                    {company.companyName}
                  </option>
                ))}
              </select>

              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setView('month')}
                  className={`px-4 py-2 rounded text-sm font-medium transition ${
                    view === 'month'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setView('week')}
                  className={`px-4 py-2 rounded text-sm font-medium transition ${
                    view === 'week'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  disabled
                >
                  Week
                </button>
                <button
                  onClick={() => setView('day')}
                  className={`px-4 py-2 rounded text-sm font-medium transition ${
                    view === 'day'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  disabled
                >
                  Day
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status Legend */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-sm font-semibold text-gray-700">Status:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-200"></div>
              <span className="text-sm text-gray-600">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-100 border border-blue-200"></div>
              <span className="text-sm text-gray-600">Running</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-100 border border-purple-200"></div>
              <span className="text-sm text-gray-600">Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-200"></div>
              <span className="text-sm text-gray-600">Paused</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div>
              <span className="text-sm text-gray-600">Failed/Cancelled</span>
            </div>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={previousMonth}
                className="p-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition font-semibold flex items-center gap-2"
                title="Previous Month"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <h2 className="text-xl font-bold text-gray-900 px-4">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={nextMonth}
                className="p-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition font-semibold flex items-center gap-2"
                title="Next Month"
              >
                Next
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <button
              onClick={goToToday}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold shadow-md"
            >
              Today
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-0 bg-gray-100 border-b border-gray-200">
            {weekDays.map((day) => (
              <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="divide-y divide-gray-200">
            {renderMonthView()}
          </div>
        </div>
        </div>
      </div>

      <Footer />

      {/* Date Campaigns Modal */}
      {showDateModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {getCampaignsForDate(selectedDate).length} campaign{getCampaignsForDate(selectedDate).length !== 1 ? 's' : ''} scheduled
                </p>
              </div>
              <button
                onClick={closeDateModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="space-y-4">
                {getCampaignsForDate(selectedDate).map((campaign) => (
                  <div
                    key={campaign._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                    onClick={() => {
                      closeDateModal();
                      handleCampaignClick(campaign);
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{campaign.campaignName}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {campaign.companyAccount?.companyName || 'Unknown Company'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(campaign.status)}`}>
                        {campaign.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Batch Size</p>
                        <p className="font-semibold text-gray-900">{campaign.batchSize || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Emails Sent</p>
                        <p className="font-semibold text-green-600">{campaign.emailsSent || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Failed</p>
                        <p className="font-semibold text-red-600">{campaign.failed || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">CSV File</p>
                        <p className="font-semibold text-gray-900 truncate" title={campaign.csvFile?.originalName}>
                          {campaign.csvFile?.originalName || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {campaign.scheduledDate && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-600">
                          Scheduled: {new Date(campaign.scheduledDate).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t mt-6">
                <button
                  onClick={closeDateModal}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Details Modal */}
      {showModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedCampaign.campaignName}</h2>
                <p className="text-sm text-gray-600 mt-1">Campaign Details</p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Status Badge */}
              <div className="mb-6">
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedCampaign.status)}`}>
                  {selectedCampaign.status.toUpperCase()}
                </span>
              </div>

              {/* Campaign Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Company */}
                <div>
                  <label className="text-sm font-semibold text-gray-600">Company</label>
                  <p className="text-lg text-gray-900 mt-1">{selectedCampaign.companyAccount?.companyName || 'N/A'}</p>
                </div>

                {/* CSV File */}
                <div>
                  <label className="text-sm font-semibold text-gray-600">CSV File</label>
                  <p className="text-lg text-gray-900 mt-1">{selectedCampaign.csvFile?.originalName || 'N/A'}</p>
                </div>

                {/* Batch Size */}
                <div>
                  <label className="text-sm font-semibold text-gray-600">Batch Size</label>
                  <p className="text-lg text-gray-900 mt-1">{selectedCampaign.batchSize || 0}</p>
                </div>

                {/* Emails Sent */}
                <div>
                  <label className="text-sm font-semibold text-gray-600">Emails Sent</label>
                  <p className="text-lg text-green-600 font-semibold mt-1">{selectedCampaign.emailsSent || 0}</p>
                </div>

                {/* Failed */}
                <div>
                  <label className="text-sm font-semibold text-gray-600">Failed</label>
                  <p className="text-lg text-red-600 font-semibold mt-1">{selectedCampaign.failed || 0}</p>
                </div>

                {/* Scheduled Date */}
                <div>
                  <label className="text-sm font-semibold text-gray-600">Scheduled Date</label>
                  <p className="text-lg text-gray-900 mt-1">
                    {selectedCampaign.scheduledDate
                      ? new Date(selectedCampaign.scheduledDate).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>

                {/* Created Date */}
                <div>
                  <label className="text-sm font-semibold text-gray-600">Created</label>
                  <p className="text-lg text-gray-900 mt-1">
                    {new Date(selectedCampaign.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Conferbot ID */}
                {selectedCampaign.conFerbotId && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-600">Conferbot ID</label>
                    <p className="text-sm text-gray-700 mt-1 font-mono bg-gray-50 p-2 rounded">
                      {selectedCampaign.conFerbotId}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <a
                  href={`/campaigns/${selectedCampaign._id}`}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold text-center"
                >
                  View Full Details
                </a>
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
