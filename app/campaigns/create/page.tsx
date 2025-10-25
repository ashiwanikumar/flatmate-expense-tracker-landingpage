'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { csvAPI, campaignAPI, companyAccountAPI, campaignTemplateAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Footer from '@/components/Footer';
import LoadingModal from '@/components/LoadingModal';

function CreateCampaignForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const csvId = searchParams.get('csvId');

  const [csvFiles, setCsvFiles] = useState<any[]>([]);
  const [companyAccounts, setCompanyAccounts] = useState<any[]>([]);
  const [selectedCsv, setSelectedCsv] = useState(csvId || '');
  const [selectedCompanyAccounts, setSelectedCompanyAccounts] = useState<string[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [companyTemplates, setCompanyTemplates] = useState<Record<string, string[]>>({});
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [campaignPlan, setCampaignPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    batchSize: 1500,
    scheduledDate: '',
    campaignName: '',
    timeInterval: 24, // hours between campaigns
    emailLimit: '', // Optional: limit number of emails to use
  });
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [showAllCampaigns, setShowAllCampaigns] = useState(false);
  const [showCampaignsModal, setShowCampaignsModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchCsvFiles();
    fetchCompanyAccounts();
  }, []);

  useEffect(() => {
    if (selectedCsv) {
      calculatePlan();
    }
  }, [selectedCsv, formData.batchSize, formData.scheduledDate, formData.emailLimit]);

  useEffect(() => {
    if (selectedCompanyAccounts.length > 0) {
      fetchTemplates();
    } else {
      setTemplates([]);
      setCompanyTemplates({});
    }
  }, [selectedCompanyAccounts]);

  const fetchCsvFiles = async () => {
    try {
      const response = await csvAPI.getAll();
      setCsvFiles(response.data.data.filter((file: any) => file.status === 'active'));
    } catch (error) {
      toast.error('Failed to load CSV files');
    }
  };

  const fetchCompanyAccounts = async () => {
    try {
      const response = await companyAccountAPI.getAll();
      setCompanyAccounts(response.data.data.filter((acc: any) => acc.status === 'active'));
    } catch (error) {
      toast.error('Failed to load company accounts');
    }
  };

  const fetchTemplates = async () => {
    if (selectedCompanyAccounts.length === 0) return;

    setLoadingTemplates(true);
    try {
      const allTemplates: any[] = [];
      const templatesMap: Record<string, string[]> = {};

      // Fetch templates for each selected company account
      for (const companyId of selectedCompanyAccounts) {
        try {
          const response = await campaignTemplateAPI.getAll(companyId);
          const companyTemplatesList = response.data.data;

          // Store all templates
          allTemplates.push(...companyTemplatesList);

          // Auto-select default template for this company
          const defaultTemplate = companyTemplatesList.find((t: any) => t.isDefault);
          if (defaultTemplate) {
            templatesMap[companyId] = [defaultTemplate._id];
          } else {
            templatesMap[companyId] = [];
          }
        } catch (error) {
          console.error(`Error fetching templates for company ${companyId}:`, error);
          templatesMap[companyId] = [];
        }
      }

      setTemplates(allTemplates);
      setCompanyTemplates(templatesMap);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleCompanyAccountToggle = (companyId: string) => {
    setSelectedCompanyAccounts(prev => {
      if (prev.includes(companyId)) {
        // Remove company and its templates
        const newCompanyTemplates = { ...companyTemplates };
        delete newCompanyTemplates[companyId];
        setCompanyTemplates(newCompanyTemplates);
        return prev.filter(id => id !== companyId);
      } else {
        // Add company
        return [...prev, companyId];
      }
    });
  };

  const handleTemplateToggle = (companyId: string, templateId: string) => {
    setCompanyTemplates(prev => {
      const currentTemplates = prev[companyId] || [];
      return {
        ...prev,
        [companyId]: currentTemplates.includes(templateId)
          ? currentTemplates.filter(id => id !== templateId)
          : [...currentTemplates, templateId]
      };
    });
  };

  const calculatePlan = async () => {
    if (!selectedCsv || !formData.batchSize) return;

    setCalculating(true);
    try {
      const batchSize = parseInt(formData.batchSize.toString());
      const startDate = formData.scheduledDate ? new Date(formData.scheduledDate) : new Date();
      const emailLimit = formData.emailLimit ? parseInt(formData.emailLimit.toString()) : null;

      const response = await campaignAPI.calculatePlan({
        csvFileId: selectedCsv,
        batchPattern: [batchSize],
        startDate: startDate,
        emailLimit: emailLimit,
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

    if (selectedCompanyAccounts.length === 0) {
      toast.error('Please select at least one company account');
      return;
    }

    // Check if at least one company has templates selected
    const totalTemplatesSelected = Object.values(companyTemplates).reduce((sum, temps) => sum + temps.length, 0);
    if (totalTemplatesSelected === 0) {
      toast.error('Please select at least one template for each company');
      return;
    }

    if (!formData.scheduledDate) {
      toast.error('Please select a scheduled date');
      return;
    }

    if (!campaignPlan || !campaignPlan.campaigns || campaignPlan.campaigns.length === 0) {
      toast.error('No campaigns to create. Please check your batch size and CSV file.');
      return;
    }

    setLoading(true);

    try {
      let successCount = 0;
      let failCount = 0;

      // Calculate how many campaigns to create based on the plan
      const numberOfCampaigns = campaignPlan.campaigns.length;
      const baseDate = new Date(formData.scheduledDate);
      const intervalHours = parseInt(formData.timeInterval.toString());

      // Create campaigns for each company-template combination
      for (const companyId of selectedCompanyAccounts) {
        const templateIds = companyTemplates[companyId] || [];

        if (templateIds.length === 0) {
          console.warn(`No templates selected for company ${companyId}, skipping...`);
          continue;
        }

        // For each template in this company
        for (const templateId of templateIds) {
          // Create all campaigns in the plan for this company-template combo
          for (let i = 0; i < numberOfCampaigns; i++) {
            try {
              // Calculate scheduled date for each campaign with interval
              const campaignDate = new Date(baseDate);
              campaignDate.setHours(campaignDate.getHours() + (i * intervalHours));

              // Backend will handle suffix logic for duplicate names
              await campaignAPI.create({
                csvFileId: selectedCsv,
                companyAccountId: companyId,
                templateId: templateId,
                batchSize: parseInt(formData.batchSize.toString()),
                scheduledDate: campaignDate.toISOString(),
                campaignName: formData.campaignName || undefined,
              });
              successCount++;
            } catch (error) {
              console.error(`Failed to create campaign ${i + 1} for company ${companyId}, template ${templateId}:`, error);
              failCount++;
            }
          }
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} campaign${successCount > 1 ? 's' : ''} created successfully!`);
        if (failCount > 0) {
          toast.error(`${failCount} campaign${failCount > 1 ? 's' : ''} failed to create`);
        }
        router.push('/campaigns');
      } else {
        toast.error('Failed to create any campaigns');
      }
    } catch (error: any) {
      console.error('Create campaign error:', error);
      toast.error(error.response?.data?.message || 'Failed to create campaigns');
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
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
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
        <div className="px-4 sm:px-6 lg:px-8">
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
      <main className="flex-grow px-4 sm:px-6 lg:px-8 py-8 w-full">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-white"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Company Accounts * ({selectedCompanyAccounts.length} selected)
                </label>
                {companyAccounts.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      ⚠️ No company accounts found. Please create a company account first.
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-white">
                    <div className="space-y-2">
                      {companyAccounts.map((account) => (
                        <label
                          key={account._id}
                          className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCompanyAccounts.includes(account._id)}
                            onChange={() => handleCompanyAccountToggle(account._id)}
                            className="mt-1 rounded text-purple-600 focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{account.companyName}</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">{account.email}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Select one or more company accounts for sending emails</p>
              </div>

              {/* Template Selection - Grouped by Company */}
              {selectedCompanyAccounts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Templates * (
                    {Object.values(companyTemplates).reduce((sum, temps) => sum + temps.length, 0)} total selected)
                  </label>
                  {loadingTemplates ? (
                    <div className="text-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">Loading templates...</p>
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        ⚠️ No templates found for selected company accounts. Please create templates first.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                      <div className="max-h-96 overflow-y-auto">
                        {selectedCompanyAccounts.map((companyId) => {
                          const company = companyAccounts.find(acc => acc._id === companyId);
                          const companyTemplatesList = templates.filter(t => t.companyAccount === companyId);

                          return (
                            <div key={companyId} className="border-b border-gray-200 last:border-b-0">
                              <div className="bg-purple-50 px-4 py-2 sticky top-0 z-10">
                                <h4 className="font-semibold text-purple-900 text-sm">
                                  {company?.companyName} ({companyTemplates[companyId]?.length || 0} selected)
                                </h4>
                              </div>
                              <div className="p-3">
                                {companyTemplatesList.length === 0 ? (
                                  <p className="text-sm text-gray-500 italic">No templates available</p>
                                ) : (
                                  <div className="space-y-2">
                                    {companyTemplatesList.map((template) => (
                                      <label
                                        key={template._id}
                                        className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={companyTemplates[companyId]?.includes(template._id) || false}
                                          onChange={() => handleTemplateToggle(companyId, template._id)}
                                          className="mt-1 rounded text-purple-600 focus:ring-purple-500"
                                        />
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">{template.templateName}</span>
                                            {template.isDefault && (
                                              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                                Default
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-xs text-gray-600 mt-0.5">{template.subject}</p>
                                        </div>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Select templates for each company. Campaigns will be created for each company-template combination.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Size *</label>
                <input
                  type="number"
                  value={formData.batchSize}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 1500 : parseInt(e.target.value) || 1500;
                    setFormData({ ...formData, batchSize: value });
                  }}
                  required
                  min="1"
                  max="5000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">Number of emails to send (1-5000)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Limit Emails (Optional)</label>
                <input
                  type="number"
                  value={formData.emailLimit}
                  onChange={(e) => setFormData({ ...formData, emailLimit: e.target.value })}
                  placeholder="Leave empty to use all available emails"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {selectedCsv ? (
                    <>
                      Enter a number to use only that many emails from the CSV. Available: {csvFiles.find(f => f._id === selectedCsv)?.remainingCount?.toLocaleString() || 0} emails
                    </>
                  ) : (
                    'Leave empty to use all available emails, or enter a number to limit'
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-white"
                />
              </div>

              {/* Time Interval - Only show when multiple campaigns will be created */}
              {campaignPlan && campaignPlan.campaigns && campaignPlan.campaigns.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Interval Between Campaigns *
                  </label>
                  <select
                    value={formData.timeInterval}
                    onChange={(e) => setFormData({ ...formData, timeInterval: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-white"
                  >
                    <option value={1}>1 Hour</option>
                    <option value={6}>6 Hours</option>
                    <option value={12}>12 Hours</option>
                    <option value={24}>24 Hours (Recommended)</option>
                    <option value={48}>48 Hours (2 Days)</option>
                    <option value={72}>72 Hours (3 Days)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {campaignPlan.campaigns.length} campaigns will be created with {formData.timeInterval} hour{formData.timeInterval > 1 ? 's' : ''} gap between each
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name (Optional)</label>
                <input
                  type="text"
                  value={formData.campaignName}
                  onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                  placeholder="Leave empty for auto-generated name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">Format: WU{'{DD}{MM}{YYYY}'}</p>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedCsv || selectedCompanyAccounts.length === 0 || Object.values(companyTemplates).reduce((sum, temps) => sum + temps.length, 0) === 0}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(() => {
                  const totalTemplates = Object.values(companyTemplates).reduce((sum, temps) => sum + temps.length, 0);
                  const totalCampaigns = (campaignPlan?.campaigns?.length || 0) * totalTemplates;
                  return loading
                    ? `Creating ${totalCampaigns} Campaign${totalCampaigns > 1 ? 's' : ''}...`
                    : `Create ${totalCampaigns} Campaign${totalCampaigns > 1 ? 's' : ''}`;
                })()}
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
                      <span className="text-gray-700">Total Emails:</span>
                      <span className="font-semibold text-gray-900">{campaignPlan.csvFile.totalEmails.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Already Sent:</span>
                      <span className="font-semibold text-green-600">{campaignPlan.csvFile.sentCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Remaining:</span>
                      <span className="font-semibold text-blue-600">{campaignPlan.csvFile.remainingCount.toLocaleString()}</span>
                    </div>
                    {campaignPlan.csvFile.emailsToUse && campaignPlan.csvFile.emailsToUse < campaignPlan.csvFile.remainingCount && (
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="text-gray-700 font-medium">Using (Limited):</span>
                        <span className="font-semibold text-orange-600">
                          {campaignPlan.csvFile.emailsToUse.toLocaleString()} of {campaignPlan.csvFile.remainingCount.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Plan Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Total Days:</span>
                      <span className="font-semibold text-gray-900">{campaignPlan.totalDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Avg. per Day:</span>
                      <span className="font-semibold text-gray-900">{campaignPlan.averagePerDay.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-gray-900">Upcoming Campaigns</h4>
                    {campaignPlan.campaigns.length > 10 && (
                      <button
                        onClick={() => setShowCampaignsModal(true)}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        View All ({campaignPlan.campaigns.length})
                      </button>
                    )}
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-gray-700 font-semibold">Day</th>
                            <th className="px-4 py-2 text-left text-gray-700 font-semibold">Campaign</th>
                            <th className="px-4 py-2 text-right text-gray-700 font-semibold">Emails</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {(showAllCampaigns ? campaignPlan.campaigns : campaignPlan.campaigns.slice(0, 10)).map((camp: any, index: number) => (
                            <tr key={camp.day} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-2 text-gray-900">{camp.day}</td>
                              <td className="px-4 py-2 text-gray-700">{camp.campaignName}</td>
                              <td className="px-4 py-2 text-right text-purple-600 font-semibold">{camp.batchSize.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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

      {/* Loading Modal */}
      <LoadingModal
        isOpen={loading}
        title={`Creating ${(() => {
          const totalTemplates = Object.values(companyTemplates).reduce((sum, temps) => sum + temps.length, 0);
          const totalCampaigns = (campaignPlan?.campaigns?.length || 0) * totalTemplates;
          return `${totalCampaigns} Campaign${totalCampaigns > 1 ? 's' : ''}`;
        })()}`}
        subtitle={`For ${selectedCompanyAccounts.length} company account${selectedCompanyAccounts.length > 1 ? 's' : ''}. Please wait...`}
      />

      {/* All Campaigns Modal */}
      {showCampaignsModal && campaignPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">All Campaigns</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Total: {campaignPlan.campaigns.length} campaigns
                </p>
              </div>
              <button
                onClick={() => setShowCampaignsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Scrollable Table */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-700 font-semibold">Day</th>
                      <th className="px-4 py-3 text-left text-gray-700 font-semibold">Campaign Name</th>
                      <th className="px-4 py-3 text-right text-gray-700 font-semibold">Emails</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {campaignPlan.campaigns.map((camp: any, index: number) => (
                      <tr key={camp.day} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-gray-900 font-medium">{camp.day}</td>
                        <td className="px-4 py-3 text-gray-700">{camp.campaignName}</td>
                        <td className="px-4 py-3 text-right text-purple-600 font-semibold">
                          {camp.batchSize.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowCampaignsModal(false)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
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

export default function CreateCampaignPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgb(12, 190, 225)', boxShadow: 'rgb(12, 190, 225) 0px 0px 4px 0px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white font-semibold">Loading...</p>
        </div>
      </div>
    }>
      <CreateCampaignForm />
    </Suspense>
  );
}
