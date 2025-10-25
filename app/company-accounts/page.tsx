'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { companyAccountAPI, campaignTemplateAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Footer from '@/components/Footer';
import moment from 'moment-timezone';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function CompanyAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    apiUrl: '',
    email: '',
    password: '',
    campaignPrefix: 'WU',
    timezone: 'Asia/Dubai',
    defaultBatchPattern: '1500,1600,1700,1800,1900,2000',
    notificationEmails: [] as string[],
  });
  const [testingId, setTestingId] = useState<string | null>(null);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [timezoneSearch, setTimezoneSearch] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; accountId: string | null }>({
    open: false,
    accountId: null,
  });
  const [deleteTemplateModal, setDeleteTemplateModal] = useState<{ open: boolean; templateId: string | null }>({
    open: false,
    templateId: null,
  });

  // Conferbot templates state
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [selectedCompanyForTemplates, setSelectedCompanyForTemplates] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateFormData, setTemplateFormData] = useState({
    templateName: '',
    isDefault: false,
    fromName: 'Anna from Conferbot',
    subject: '',
    htmlTemplate: '',
    replyTo: '',
    cc: [] as string[],
    bcc: [] as string[],
    templateVariables: [] as Array<{key: string, defaultValue: string, description: string}>,
    emailAccounts: [] as Array<{id: string, useAlias: boolean, selectedAlias: string}>,
    emailSendingConfig: {
      minutesBetweenEmails: 5,
      emailsPerHour: 12,
    },
    tag: '',
  });

  // Get all timezones and format them with GMT offset
  const timezones = moment.tz.names();

  const formatTimezone = (tz: string) => {
    const offset = moment.tz(tz).utcOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset >= 0 ? '+' : '-';
    const formattedOffset = `GMT${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    return `${tz} (${formattedOffset})`;
  };

  const filteredTimezones = timezoneSearch
    ? timezones.filter(tz =>
        tz.toLowerCase().includes(timezoneSearch.toLowerCase()) ||
        formatTimezone(tz).toLowerCase().includes(timezoneSearch.toLowerCase())
      )
    : timezones;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await companyAccountAPI.getAll();
      setAccounts(response.data.data);
    } catch (error: any) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to load company accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyName || !formData.apiUrl || !formData.email || !formData.password) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const payload = {
        ...formData,
        defaultBatchPattern: formData.defaultBatchPattern.split(',').map(Number),
        notificationEmails: formData.notificationEmails,
      };

      if (editingAccount) {
        await companyAccountAPI.update(editingAccount._id, payload);
        toast.success('Company account updated successfully');
      } else {
        await companyAccountAPI.create(payload);
        toast.success('Company account created successfully');
      }

      setShowForm(false);
      setEditingAccount(null);
      resetForm();
      fetchAccounts();
    } catch (error: any) {
      console.error('Error saving account:', error);
      toast.error(error.response?.data?.message || 'Failed to save company account');
    }
  };

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setFormData({
      companyName: account.companyName,
      apiUrl: account.apiUrl,
      email: account.email,
      password: '',
      campaignPrefix: account.campaignPrefix,
      timezone: account.timezone,
      defaultBatchPattern: account.defaultBatchPattern.join(','),
      notificationEmails: account.notificationEmails || [],
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteModal.accountId) return;

    try {
      await companyAccountAPI.delete(deleteModal.accountId);
      toast.success('Company account deleted successfully');
      setDeleteModal({ open: false, accountId: null });
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    setShowConnectionModal(true);
    setConnectionStatus('testing');
    setConnectionMessage('');

    try {
      const response = await companyAccountAPI.testConnection(id);
      if (response.data.success) {
        setConnectionStatus('success');
        setConnectionMessage('Connection successful!');
        // Auto close modal after 2 seconds
        setTimeout(() => {
          setShowConnectionModal(false);
          setTestingId(null);
        }, 2000);
      } else {
        setConnectionStatus('error');
        const errorMsg = response.data.message || 'Connection failed';
        const url = response.data.data?.url;
        setConnectionMessage(url ? `${errorMsg}\nURL: ${url}` : errorMsg);
      }
    } catch (error: any) {
      setConnectionStatus('error');
      setConnectionMessage(error.response?.data?.message || 'Connection test failed');
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      apiUrl: '',
      email: '',
      password: '',
      campaignPrefix: 'WU',
      timezone: 'Asia/Dubai',
      defaultBatchPattern: '1500,1600,1700,1800,1900,2000',
      notificationEmails: [],
    });
    setTimezoneSearch('');
    setNewEmail('');
    setEmailError('');
  };

  const handleAddEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!newEmail.trim()) {
      setEmailError('Please enter an email address');
      return;
    }

    if (!emailRegex.test(newEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (formData.notificationEmails.includes(newEmail)) {
      setEmailError('This email is already added');
      return;
    }

    if (formData.notificationEmails.length >= 10) {
      setEmailError('Maximum 10 emails allowed');
      return;
    }

    setFormData({
      ...formData,
      notificationEmails: [...formData.notificationEmails, newEmail],
    });
    setNewEmail('');
    setEmailError('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setFormData({
      ...formData,
      notificationEmails: formData.notificationEmails.filter(email => email !== emailToRemove),
    });
  };

  const fetchTemplates = async (companyAccountId: string) => {
    setLoadingTemplates(true);
    try {
      const response = await campaignTemplateAPI.getAll(companyAccountId);
      setTemplates(response.data.data);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleManageTemplates = async (account: any) => {
    setSelectedCompanyForTemplates(account);
    setShowTemplatesModal(true);
    await fetchTemplates(account._id);
  };

  const handleCreateNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateFormData({
      templateName: '',
      isDefault: templates.length === 0, // First template is default
      fromName: 'Anna from Conferbot',
      subject: '',
      htmlTemplate: '',
      replyTo: '',
      cc: [],
      bcc: [],
      templateVariables: [],
      emailAccounts: [],
      emailSendingConfig: {
        minutesBetweenEmails: 5,
        emailsPerHour: 12,
      },
      tag: '',
    });
    setShowTemplateForm(true);
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setTemplateFormData({
      templateName: template.templateName,
      isDefault: template.isDefault,
      fromName: template.fromName,
      subject: template.subject,
      htmlTemplate: template.htmlTemplate,
      replyTo: template.replyTo || '',
      cc: template.cc || [],
      bcc: template.bcc || [],
      templateVariables: template.templateVariables || [],
      emailAccounts: template.emailAccounts || [],
      emailSendingConfig: template.emailSendingConfig || {
        minutesBetweenEmails: 5,
        emailsPerHour: 12,
      },
      tag: template.tag || '',
    });
    setShowTemplateForm(true);
  };

  const handleSaveTemplate = async () => {
    if (!selectedCompanyForTemplates) return;

    // Validation
    if (!templateFormData.templateName || !templateFormData.subject || !templateFormData.htmlTemplate) {
      toast.error('Template name, subject, and HTML template are required');
      return;
    }

    if (templateFormData.emailAccounts.length === 0) {
      toast.error('At least one email account is required');
      return;
    }

    try {
      if (editingTemplate) {
        await campaignTemplateAPI.update(editingTemplate._id, templateFormData);
        toast.success('Template updated successfully');
      } else {
        await campaignTemplateAPI.create(selectedCompanyForTemplates._id, templateFormData);
        toast.success('Template created successfully');
      }
      setShowTemplateForm(false);
      await fetchTemplates(selectedCompanyForTemplates._id);
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(error.response?.data?.message || 'Failed to save template');
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteTemplateModal.templateId) return;

    try {
      await campaignTemplateAPI.delete(deleteTemplateModal.templateId);
      toast.success('Template deleted successfully');
      setDeleteTemplateModal({ open: false, templateId: null });
      await fetchTemplates(selectedCompanyForTemplates._id);
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error(error.response?.data?.message || 'Failed to delete template');
    }
  };

  const handleSetDefaultTemplate = async (templateId: string) => {
    try {
      await campaignTemplateAPI.setDefault(templateId);
      toast.success('Default template updated');
      await fetchTemplates(selectedCompanyForTemplates._id);
    } catch (error: any) {
      console.error('Error setting default template:', error);
      toast.error(error.response?.data?.message || 'Failed to set default template');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
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
              className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              Campaigns
            </Link>
            <Link
              href="/company-accounts"
              className="px-3 py-4 text-sm font-medium text-purple-600 border-b-2 border-purple-600"
            >
              Company Accounts
            </Link>
            <Link
              href="/calendar"
              className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              📅 Calendar
            </Link>
            <Link
              href="/activity-logs"
              className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Activity Logs
              </span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-grow px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* AWS Configuration Info */}
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">AWS Configuration Required for CSV Uploads</h3>
              <p className="text-sm text-blue-800 mb-3">
                To enable CSV file uploads and storage for each company, the following AWS credentials must be configured in the backend .env file:
              </p>
              <div className="bg-white rounded-lg p-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-start">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mr-3 mt-0.5">1</span>
                    <div>
                      <p className="font-semibold text-gray-900">AWS S3 Configuration</p>
                      <ul className="text-gray-700 mt-1 ml-4 list-disc space-y-1">
                        <li><code className="text-xs bg-gray-100 px-2 py-0.5 rounded">AWS_BUCKET_NAME</code> - S3 bucket name</li>
                        <li><code className="text-xs bg-gray-100 px-2 py-0.5 rounded">AWS_BUCKET_REGION</code> - AWS region (e.g., ap-south-1)</li>
                        <li><code className="text-xs bg-gray-100 px-2 py-0.5 rounded">AWS_ACCESS_KEY_ID</code> - IAM user access key</li>
                        <li><code className="text-xs bg-gray-100 px-2 py-0.5 rounded">AWS_SECRET_KEY</code> - IAM user secret key</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mr-3 mt-0.5">2</span>
                    <div>
                      <p className="font-semibold text-gray-900">AWS CloudFront Configuration (for secure URLs)</p>
                      <ul className="text-gray-700 mt-1 ml-4 list-disc space-y-1">
                        <li><code className="text-xs bg-gray-100 px-2 py-0.5 rounded">CLOUDFRONT_DOMAIN</code> - CloudFront distribution domain</li>
                        <li><code className="text-xs bg-gray-100 px-2 py-0.5 rounded">CLOUDFRONT_DISTRIBUTION_ID</code> - Distribution ID</li>
                        <li><code className="text-xs bg-gray-100 px-2 py-0.5 rounded">CLOUDFRONT_KEY_PAIR_ID</code> - Key pair ID for signing</li>
                        <li><code className="text-xs bg-gray-100 px-2 py-0.5 rounded">CLOUDFRONT_PRIVATE_KEY</code> - Private key for signed URLs</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    <strong>Note:</strong> These credentials enable secure file storage and time-limited access URLs.
                    CSV files are uploaded to S3 and accessed via CloudFront signed URLs that expire after 15 minutes for security.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Company Accounts</h2>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingAccount(null);
              resetForm();
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
          >
            + Add Company Account
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingAccount ? 'Edit Company Account' : 'Add New Company Account'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingAccount(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-white"
                  placeholder="e.g., ConFerbot, SendGrid"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API URL *</label>
                <input
                  type="url"
                  value={formData.apiUrl}
                  onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-white"
                  placeholder="http://localhost:8000/api/v1"
                />
                <p className="mt-1 text-xs text-gray-500">Enter full API URL including version (e.g., /api/v1)</p>
              </div>

              <div className="md:col-span-2">
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-sm font-medium text-gray-700">
                      Enter account login credentials
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-white"
                  placeholder="api@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password * {editingAccount && <span className="text-xs text-gray-500">(leave empty to keep current)</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingAccount}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-white"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Prefix</label>
                <input
                  type="text"
                  value={formData.campaignPrefix}
                  onChange={(e) => setFormData({ ...formData, campaignPrefix: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-white"
                  placeholder="WU"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search timezone..."
                    value={timezoneSearch}
                    onChange={(e) => setTimezoneSearch(e.target.value)}
                    onFocus={() => setTimezoneSearch('')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-white"
                  />
                  {timezoneSearch && (
                    <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white border border-gray-300 rounded-lg shadow-lg">
                      {filteredTimezones.slice(0, 50).map((tz) => (
                        <button
                          key={tz}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, timezone: tz });
                            setTimezoneSearch('');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-purple-50 text-sm text-gray-900 border-b border-gray-100 last:border-b-0"
                        >
                          {formatTimezone(tz)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-2 px-4 py-2 bg-gray-50 rounded border border-gray-200">
                  <p className="text-xs text-gray-500">Selected:</p>
                  <p className="text-sm font-medium text-gray-900">{formatTimezone(formData.timezone)}</p>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Emails
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Add email addresses to receive campaign notifications. Maximum 10 emails allowed.
                </p>

                <div className="flex gap-2 mb-3">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => {
                        setNewEmail(e.target.value);
                        setEmailError('');
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddEmail();
                        }
                      }}
                      placeholder="Enter email address"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-white"
                      disabled={formData.notificationEmails.length >= 10}
                    />
                    {emailError && (
                      <p className="mt-1 text-xs text-red-600">{emailError}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEmail}
                    disabled={formData.notificationEmails.length >= 10}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Add Email
                  </button>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-600">
                    {formData.notificationEmails.length}/10 emails added
                  </p>
                </div>

                {formData.notificationEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {formData.notificationEmails.map((email, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-sm"
                      >
                        <span>{email}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(email)}
                          className="ml-1 hover:bg-purple-200 rounded-full p-0.5 transition"
                          title="Remove email"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Batch Pattern (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.defaultBatchPattern}
                  onChange={(e) => setFormData({ ...formData, defaultBatchPattern: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 bg-white"
                  placeholder="1500,1600,1700,1800,1900,2000"
                />
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
                >
                  {editingAccount ? 'Update Account' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAccount(null);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {accounts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No company accounts found.</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Add Your First Company Account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {accounts.map((account) => (
              <div key={account._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{account.companyName}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          account.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {account.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">API URL</p>
                        <p className="text-sm font-medium text-gray-900 break-all">{account.apiUrl}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="text-sm font-medium text-gray-900">{account.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Campaign Prefix</p>
                        <p className="text-sm font-medium text-gray-900">{account.campaignPrefix}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Timezone</p>
                        <p className="text-sm font-medium text-gray-900">{account.timezone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Batch Pattern</p>
                        <p className="text-sm font-medium text-gray-900">
                          {account.defaultBatchPattern.join(', ')}
                        </p>
                      </div>
                    </div>

                    {account.notificationEmails && account.notificationEmails.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Notification Emails</p>
                        <div className="flex flex-wrap gap-2">
                          {account.notificationEmails.map((email: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"
                            >
                              {email}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {account.lastSyncedAt && (
                      <p className="text-xs text-gray-500 mt-3">
                        Last synced: {new Date(account.lastSyncedAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    <button
                      onClick={() => handleManageTemplates(account)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-sm rounded-lg hover:from-purple-200 hover:to-blue-200 transition font-medium"
                    >
                      📋 Manage Templates
                    </button>
                    <button
                      onClick={() => handleTestConnection(account._id)}
                      disabled={testingId === account._id}
                      className="px-4 py-2 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition disabled:opacity-50"
                    >
                      {testingId === account._id ? 'Testing...' : 'Test Connection'}
                    </button>
                    <button
                      onClick={() => handleEdit(account)}
                      className="px-4 py-2 bg-purple-100 text-purple-700 text-sm rounded-lg hover:bg-purple-200 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteModal({ open: true, accountId: account._id })}
                      className="px-4 py-2 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Templates Management Modal - Now renders properly! */}
        {showTemplatesModal && selectedCompanyForTemplates && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="border-b border-gray-200 p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Conferbot Templates - {selectedCompanyForTemplates.companyName}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Create and manage multiple email campaign templates
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowTemplatesModal(false);
                      setShowTemplateForm(false);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {!showTemplateForm ? (
                  /* Templates List View */
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Saved Templates</h3>
                      <button
                        onClick={handleCreateNewTemplate}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition font-medium"
                      >
                        + Create New Template
                      </button>
                    </div>

                    {loadingTemplates ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading templates...</p>
                      </div>
                    ) : templates.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 mb-4">No templates found</p>
                        <button
                          onClick={handleCreateNewTemplate}
                          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                        >
                          Create Your First Template
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map((template) => (
                          <div key={template._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-lg font-semibold text-gray-900">{template.templateName}</h4>
                                  {template.isDefault && (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                      Default
                                    </span>
                                  )}
                                  {template.tag && (
                                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                                      {template.tag}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                              </div>
                            </div>

                            <div className="space-y-2 text-sm mb-4">
                              <div className="flex justify-between">
                                <span className="text-gray-600">From:</span>
                                <span className="font-medium text-gray-900">{template.fromName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Email Accounts:</span>
                                <span className="font-medium text-gray-900">{template.emailAccounts?.length || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Variables:</span>
                                <span className="font-medium text-gray-900">{template.templateVariables?.length || 0}</span>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-3 border-t border-gray-200">
                              {!template.isDefault && (
                                <button
                                  onClick={() => handleSetDefaultTemplate(template._id)}
                                  className="flex-1 px-3 py-2 bg-green-50 text-green-700 text-sm rounded-lg hover:bg-green-100 transition font-medium"
                                >
                                  Set as Default
                                </button>
                              )}
                              <button
                                onClick={() => handleEditTemplate(template)}
                                className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100 transition font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleteTemplateModal({ open: true, templateId: template._id })}
                                className="px-3 py-2 bg-red-50 text-red-700 text-sm rounded-lg hover:bg-red-100 transition font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Template Form View - Note: This is a large form scrollable within the modal */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {editingTemplate ? 'Edit Template' : 'Create New Template'}
                      </h3>
                      <button
                        onClick={() => setShowTemplateForm(false)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        ← Back to Templates
                      </button>
                    </div>

                    {/* Template Name & Default */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Template Name *</label>
                          <input
                            type="text"
                            value={templateFormData.templateName}
                            onChange={(e) => setTemplateFormData({...templateFormData, templateName: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900"
                            placeholder="e.g., Cold Outreach Template"
                          />
                        </div>
                        <div className="flex items-center">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={templateFormData.isDefault}
                              onChange={(e) => setTemplateFormData({...templateFormData, isDefault: e.target.checked})}
                              className="rounded text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Set as default template</span>
                          </label>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label htmlFor="tag" className="block text-sm font-medium text-gray-700 mb-2">
                          Tag (Optional)
                        </label>
                        <input
                          type="text"
                          id="tag"
                          name="tag"
                          value={templateFormData.tag || ''}
                          onChange={(e) => setTemplateFormData({...templateFormData, tag: e.target.value})}
                          placeholder="e.g., test, production, client-name"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900"
                        />
                        <p className="mt-1 text-sm text-gray-500">Add a tag to categorize this template</p>
                      </div>
                    </div>

                    {/* Campaign Settings */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Campaign Settings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">From Name *</label>
                          <input
                            type="text"
                            value={templateFormData.fromName}
                            onChange={(e) => setTemplateFormData({...templateFormData, fromName: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900"
                            placeholder="Anna from Conferbot"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                          <input
                            type="text"
                            value={templateFormData.subject}
                            onChange={(e) => setTemplateFormData({...templateFormData, subject: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900"
                            placeholder="Email subject line"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">HTML Template ID *</label>
                          <input
                            type="text"
                            value={templateFormData.htmlTemplate}
                            onChange={(e) => setTemplateFormData({...templateFormData, htmlTemplate: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900"
                            placeholder="675f6480744324008c6535ac"
                          />
                          <p className="text-xs text-gray-500 mt-1">Conferbot template ID</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Reply-To Email</label>
                          <input
                            type="email"
                            value={templateFormData.replyTo}
                            onChange={(e) => setTemplateFormData({...templateFormData, replyTo: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900"
                            placeholder="reply@example.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email Sending Config */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Email Sending Configuration</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Minutes Between Emails</label>
                          <input
                            type="number"
                            value={templateFormData.emailSendingConfig.minutesBetweenEmails}
                            onChange={(e) => setTemplateFormData({
                              ...templateFormData,
                              emailSendingConfig: {
                                ...templateFormData.emailSendingConfig,
                                minutesBetweenEmails: Number(e.target.value)
                              }
                            })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Emails Per Hour</label>
                          <input
                            type="number"
                            value={templateFormData.emailSendingConfig.emailsPerHour}
                            onChange={(e) => setTemplateFormData({
                              ...templateFormData,
                              emailSendingConfig: {
                                ...templateFormData.emailSendingConfig,
                                emailsPerHour: Number(e.target.value)
                              }
                            })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900"
                            min="1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Template Variables */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-md font-semibold text-gray-900">Template Variables</h4>
                        <button
                          onClick={() => setTemplateFormData({
                            ...templateFormData,
                            templateVariables: [
                              ...templateFormData.templateVariables,
                              {key: '', defaultValue: '', description: ''}
                            ]
                          })}
                          className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                        >
                          + Add Variable
                        </button>
                      </div>
                      {templateFormData.templateVariables.length === 0 ? (
                        <p className="text-gray-500 text-center py-4 text-sm">No variables added</p>
                      ) : (
                        <div className="space-y-2">
                          {templateFormData.templateVariables.map((variable, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 rounded-lg">
                              <div className="col-span-3">
                                <input
                                  type="text"
                                  value={variable.key}
                                  onChange={(e) => {
                                    const newVars = [...templateFormData.templateVariables];
                                    newVars[index].key = e.target.value;
                                    setTemplateFormData({...templateFormData, templateVariables: newVars});
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                                  placeholder="Key"
                                />
                              </div>
                              <div className="col-span-3">
                                <input
                                  type="text"
                                  value={variable.defaultValue}
                                  onChange={(e) => {
                                    const newVars = [...templateFormData.templateVariables];
                                    newVars[index].defaultValue = e.target.value;
                                    setTemplateFormData({...templateFormData, templateVariables: newVars});
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                                  placeholder="Value"
                                />
                              </div>
                              <div className="col-span-5">
                                <input
                                  type="text"
                                  value={variable.description}
                                  onChange={(e) => {
                                    const newVars = [...templateFormData.templateVariables];
                                    newVars[index].description = e.target.value;
                                    setTemplateFormData({...templateFormData, templateVariables: newVars});
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                                  placeholder="Description"
                                />
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <button
                                  onClick={() => {
                                    const newVars = templateFormData.templateVariables.filter((_, i) => i !== index);
                                    setTemplateFormData({...templateFormData, templateVariables: newVars});
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Email Accounts */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-md font-semibold text-gray-900">Email Sending Accounts *</h4>
                        <button
                          onClick={() => setTemplateFormData({
                            ...templateFormData,
                            emailAccounts: [
                              ...templateFormData.emailAccounts,
                              {id: '', useAlias: false, selectedAlias: ''}
                            ]
                          })}
                          className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                        >
                          + Add Account
                        </button>
                      </div>
                      {templateFormData.emailAccounts.length === 0 ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-yellow-800 text-sm">⚠️ At least one email account is required</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {templateFormData.emailAccounts.map((account, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 rounded-lg">
                              <div className="col-span-5">
                                <input
                                  type="text"
                                  value={account.id}
                                  onChange={(e) => {
                                    const newAccounts = [...templateFormData.emailAccounts];
                                    newAccounts[index].id = e.target.value;
                                    setTemplateFormData({...templateFormData, emailAccounts: newAccounts});
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                                  placeholder="Email account ID"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="flex items-center gap-1">
                                  <input
                                    type="checkbox"
                                    checked={account.useAlias}
                                    onChange={(e) => {
                                      const newAccounts = [...templateFormData.emailAccounts];
                                      newAccounts[index].useAlias = e.target.checked;
                                      setTemplateFormData({...templateFormData, emailAccounts: newAccounts});
                                    }}
                                    className="rounded text-purple-600 focus:ring-purple-500"
                                  />
                                  <span className="text-xs text-gray-700">Alias</span>
                                </label>
                              </div>
                              <div className="col-span-4">
                                <input
                                  type="text"
                                  value={account.selectedAlias}
                                  onChange={(e) => {
                                    const newAccounts = [...templateFormData.emailAccounts];
                                    newAccounts[index].selectedAlias = e.target.value;
                                    setTemplateFormData({...templateFormData, emailAccounts: newAccounts});
                                  }}
                                  disabled={!account.useAlias}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                  placeholder="Alias email"
                                />
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <button
                                  onClick={() => {
                                    const newAccounts = templateFormData.emailAccounts.filter((_, i) => i !== index);
                                    setTemplateFormData({...templateFormData, emailAccounts: newAccounts});
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleSaveTemplate}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
                      >
                        {editingTemplate ? 'Update Template' : 'Save Template'}
                      </button>
                      <button
                        onClick={() => setShowTemplateForm(false)}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Delete Company Account Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteModal.open}
        title="Confirm Delete"
        message="Are you sure you want to delete this company account?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ open: false, accountId: null })}
        confirmText="OK"
        cancelText="Cancel"
        confirmButtonClass="bg-blue-600 hover:bg-blue-700"
      />

      {/* Delete Template Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteTemplateModal.open}
        title="Confirm Delete"
        message="Are you sure you want to delete this template?"
        onConfirm={handleDeleteTemplate}
        onCancel={() => setDeleteTemplateModal({ open: false, templateId: null })}
        confirmText="OK"
        cancelText="Cancel"
        confirmButtonClass="bg-blue-600 hover:bg-blue-700"
      />

      {/* Connection Test Modal */}
      {showConnectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            {connectionStatus === 'testing' && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Testing Connection...</h3>
                <p className="text-gray-600">Please wait while we verify the connection</p>
              </div>
            )}

            {connectionStatus === 'success' && (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Connection Successful!</h3>
                <p className="text-gray-600">{connectionMessage}</p>
              </div>
            )}

            {connectionStatus === 'error' && (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                  <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Connection Failed</h3>
                <p className="text-gray-600 whitespace-pre-line">{connectionMessage}</p>
                <button
                  onClick={() => {
                    setShowConnectionModal(false);
                    setTestingId(null);
                  }}
                  className="mt-6 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
