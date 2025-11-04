'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cloudronAPI } from '@/lib/api';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';
import Footer from '@/components/Footer';

export default function MailDomainManagementPage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.id as string;
  const domain = decodeURIComponent(params.domain as string);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'config' | 'mailboxes' | 'lists'>('config');

  // Mail domain configuration state
  const [mailDomain, setMailDomain] = useState<any>(null);
  const [mailDomainStatus, setMailDomainStatus] = useState<any>(null);

  // Mailboxes state
  const [mailboxes, setMailboxes] = useState<any[]>([]);
  const [showAddMailboxModal, setShowAddMailboxModal] = useState(false);
  const [showEditMailboxModal, setShowEditMailboxModal] = useState(false);
  const [showAliasesModal, setShowAliasesModal] = useState(false);
  const [selectedMailbox, setSelectedMailbox] = useState<any>(null);
  const [mailboxForm, setMailboxForm] = useState({
    name: '',
    ownerId: '',
    ownerType: 'user',
    active: true,
    storageQuota: 5000000000,
    messagesQuota: 0,
  });

  // Aliases state
  const [aliasesForm, setAliasesForm] = useState({
    aliases: [] as Array<{ name: string; domain: string }>,
  });
  const [newAlias, setNewAlias] = useState({ name: '', domain: '' });

  // Mail lists state
  const [mailLists, setMailLists] = useState<any[]>([]);
  const [showAddListModal, setShowAddListModal] = useState(false);
  const [showEditListModal, setShowEditListModal] = useState(false);
  const [selectedList, setSelectedList] = useState<any>(null);
  const [listForm, setListForm] = useState({
    name: '',
    membersOnly: false,
    active: true,
    members: [] as string[],
  });
  const [newMember, setNewMember] = useState('');

  // Config modals
  const [showCatchAllModal, setShowCatchAllModal] = useState(false);
  const [catchAllAddresses, setCatchAllAddresses] = useState<string[]>([]);
  const [newCatchAllAddress, setNewCatchAllAddress] = useState('');

  const [showRelayModal, setShowRelayModal] = useState(false);
  const [relayForm, setRelayForm] = useState({
    provider: '',
    host: '',
    port: 587,
    username: '',
    password: '',
    acceptSelfSignedCerts: false,
    forceFromAddress: false,
  });

  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureForm, setSignatureForm] = useState({
    text: '',
    html: '',
  });

  // Delete confirmation states
  const [showDeleteMailboxModal, setShowDeleteMailboxModal] = useState(false);
  const [showDeleteListModal, setShowDeleteListModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [mailboxToDelete, setMailboxToDelete] = useState<{name: string, deleteMails: boolean} | null>(null);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showTestMailModal, setShowTestMailModal] = useState(false);
  const [testMailAddress, setTestMailAddress] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    setUser(JSON.parse(userData));
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mailDomainRes, statusRes, mailboxesRes, listsRes] = await Promise.allSettled([
        cloudronAPI.getMailDomain(serverId, domain),
        cloudronAPI.getMailDomainStatus(serverId, domain),
        cloudronAPI.getMailboxesForDomain(serverId, domain),
        cloudronAPI.getMailLists(serverId, domain),
      ]);

      if (mailDomainRes.status === 'fulfilled') {
        setMailDomain(mailDomainRes.value.data.domain || mailDomainRes.value.data);
      }
      if (statusRes.status === 'fulfilled') {
        setMailDomainStatus(statusRes.value.data.status || statusRes.value.data);
      }
      if (mailboxesRes.status === 'fulfilled') {
        setMailboxes(mailboxesRes.value.data.data || []);
      }
      if (listsRes.status === 'fulfilled') {
        setMailLists(listsRes.value.data.lists || []);
      }
    } catch (error: any) {
      console.error('Error fetching mail data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch mail data');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableMailDomain = async (enabled: boolean) => {
    try {
      await cloudronAPI.enableMailDomain(serverId, domain, enabled);
      toast.success(`Mail domain ${enabled ? 'enabled' : 'disabled'} successfully!`);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${enabled ? 'enable' : 'disable'} mail domain`);
    }
  };

  const handleSetMailFromValidation = async (enabled: boolean) => {
    try {
      await cloudronAPI.setMailFromValidation(serverId, domain, enabled);
      toast.success('Mail from validation updated successfully!');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update mail from validation');
    }
  };

  const handleSetCatchAll = async () => {
    try {
      await cloudronAPI.setCatchAllAddresses(serverId, domain, catchAllAddresses);
      toast.success('Catch-all addresses updated successfully!');
      setShowCatchAllModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update catch-all addresses');
    }
  };

  const handleSetRelay = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cloudronAPI.setMailRelay(serverId, domain, relayForm);
      toast.success('Mail relay configured successfully!');
      setShowRelayModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to configure mail relay');
    }
  };

  const handleSetSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cloudronAPI.setMailSignature(serverId, domain, signatureForm);
      toast.success('Mail signature updated successfully!');
      setShowSignatureModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update mail signature');
    }
  };

  const handleSendTestMail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cloudronAPI.sendTestMail(serverId, domain, testMailAddress);
      toast.success('Test mail sent successfully!');
      setShowTestMailModal(false);
      setTestMailAddress('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send test mail');
    }
  };

  const handleAddMailbox = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cloudronAPI.addMailboxToDomain(serverId, domain, mailboxForm);
      toast.success('Mailbox added successfully!');
      setShowAddMailboxModal(false);
      setMailboxForm({
        name: '',
        ownerId: '',
        ownerType: 'user',
        active: true,
        storageQuota: 5000000000,
        messagesQuota: 0,
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add mailbox');
    }
  };

  const handleUpdateMailbox = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cloudronAPI.updateMailboxInDomain(serverId, domain, selectedMailbox.name, {
        ownerId: selectedMailbox.ownerId,
        ownerType: selectedMailbox.ownerType,
        active: selectedMailbox.active,
        enablePop3: selectedMailbox.enablePop3 ?? true,
        storageQuota: selectedMailbox.storageQuota || 0,
        messagesQuota: selectedMailbox.messagesQuota || 0,
      });
      toast.success('Mailbox updated successfully!');
      setShowEditMailboxModal(false);
      setSelectedMailbox(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update mailbox');
    }
  };

  const openDeleteMailboxModal = (mailboxName: string, deleteMails: boolean = false) => {
    setMailboxToDelete({ name: mailboxName, deleteMails });
    setShowDeleteMailboxModal(true);
    setDeleteConfirmText('');
  };

  const closeDeleteMailboxModal = () => {
    setShowDeleteMailboxModal(false);
    setMailboxToDelete(null);
    setDeleteConfirmText('');
  };

  const handleDeleteMailbox = async () => {
    if (!mailboxToDelete) return;

    if (deleteConfirmText.toUpperCase() !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setDeleting(true);
    try {
      await cloudronAPI.deleteMailboxFromDomain(serverId, domain, mailboxToDelete.name, mailboxToDelete.deleteMails);
      toast.success('Mailbox deleted successfully!');
      closeDeleteMailboxModal();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete mailbox');
    } finally {
      setDeleting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await cloudronAPI.setMailboxPassword(serverId, domain, selectedMailbox.name, passwordForm.password);
      toast.success('Mailbox password updated successfully!');
      setShowPasswordModal(false);
      setSelectedMailbox(null);
      setPasswordForm({ password: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    }
  };

  const handleSetAliases = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cloudronAPI.setMailboxAliases(serverId, domain, selectedMailbox.name, aliasesForm.aliases);
      toast.success('Aliases updated successfully!');
      setShowAliasesModal(false);
      setSelectedMailbox(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update aliases');
    }
  };

  const handleAddMailList = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cloudronAPI.addMailList(serverId, domain, listForm);
      toast.success('Mail list added successfully!');
      setShowAddListModal(false);
      setListForm({
        name: '',
        membersOnly: false,
        active: true,
        members: [],
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add mail list');
    }
  };

  const handleUpdateMailList = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cloudronAPI.updateMailList(serverId, domain, selectedList.name, {
        members: selectedList.members || [],
        membersOnly: selectedList.membersOnly,
        active: selectedList.active,
      });
      toast.success('Mail list updated successfully!');
      setShowEditListModal(false);
      setSelectedList(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update mail list');
    }
  };

  const openDeleteListModal = (listName: string) => {
    setListToDelete(listName);
    setShowDeleteListModal(true);
    setDeleteConfirmText('');
  };

  const closeDeleteListModal = () => {
    setShowDeleteListModal(false);
    setListToDelete(null);
    setDeleteConfirmText('');
  };

  const handleDeleteMailList = async () => {
    if (!listToDelete) return;

    if (deleteConfirmText.toUpperCase() !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setDeleting(true);
    try {
      await cloudronAPI.deleteMailList(serverId, domain, listToDelete);
      toast.success('Mail list deleted successfully!');
      closeDeleteListModal();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete mail list');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} />
      <NavigationMenu />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link href="/cloudron-servers" className="hover:text-purple-600">
              Servers
            </Link>
            <span>/</span>
            <Link href={`/cloudron-servers/${serverId}`} className="hover:text-purple-600">
              Server Detail
            </Link>
            <span>/</span>
            <span className="text-gray-900">Mail: {domain}</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Mail Configuration</h1>
                <p className="text-sm text-gray-600">Domain: {domain}</p>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab('config')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'config'
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Configuration
                    </button>
                    <button
                      onClick={() => setActiveTab('mailboxes')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'mailboxes'
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Mailboxes ({mailboxes.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('lists')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'lists'
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Mail Lists ({mailLists.length})
                    </button>
                  </nav>
                </div>

                <div className="p-6">
                  {/* Configuration Tab */}
                  {activeTab === 'config' && (
                    <div className="space-y-6">
                      {/* Quick Actions */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <button
                            onClick={() => setShowCatchAllModal(true)}
                            className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
                          >
                            <div className="text-blue-600 font-medium text-sm">Catch-All</div>
                            <div className="text-xs text-gray-600 mt-1">Configure catch-all addresses</div>
                          </button>
                          <button
                            onClick={() => setShowRelayModal(true)}
                            className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
                          >
                            <div className="text-green-600 font-medium text-sm">Mail Relay</div>
                            <div className="text-xs text-gray-600 mt-1">Configure mail relay</div>
                          </button>
                          <button
                            onClick={() => setShowSignatureModal(true)}
                            className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left"
                          >
                            <div className="text-purple-600 font-medium text-sm">Signature</div>
                            <div className="text-xs text-gray-600 mt-1">Set mail signature</div>
                          </button>
                          <button
                            onClick={() => setShowTestMailModal(true)}
                            className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left"
                          >
                            <div className="text-orange-600 font-medium text-sm">Send Test</div>
                            <div className="text-xs text-gray-600 mt-1">Send test mail</div>
                          </button>
                        </div>
                      </div>

                      {/* Domain Settings */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Domain Settings</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">Mail Domain Status</div>
                              <div className="text-sm text-gray-600">Enable or disable mail for this domain</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={mailDomain?.enabled || false}
                                onChange={(e) => handleEnableMailDomain(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">Mail From Validation</div>
                              <div className="text-sm text-gray-600">Validate sender addresses</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={mailDomain?.mailFromValidation || false}
                                onChange={(e) => handleSetMailFromValidation(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mailboxes Tab */}
                  {activeTab === 'mailboxes' && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Mailboxes</h3>
                        <button
                          onClick={() => setShowAddMailboxModal(true)}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
                        >
                          Add Mailbox
                        </button>
                      </div>
                      {mailboxes.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No mailboxes found</p>
                      ) : (
                        <div className="space-y-3">
                          {mailboxes.map((mailbox: any) => (
                            <div key={mailbox.name} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-bold text-gray-900">{mailbox.name}@{domain}</div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    Owner: {mailbox.ownerId} ({mailbox.ownerType})
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Storage: {mailbox.storageQuota ? `${(mailbox.storageQuota / 1000000000).toFixed(2)} GB` : 'Unlimited'} |
                                    Messages: {mailbox.messagesQuota || 'Unlimited'}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      mailbox.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {mailbox.active ? 'Active' : 'Inactive'}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setSelectedMailbox(mailbox);
                                      setShowAliasesModal(true);
                                    }}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                                  >
                                    Aliases
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedMailbox(mailbox);
                                      setShowEditMailboxModal(true);
                                    }}
                                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedMailbox(mailbox);
                                      setPasswordForm({ password: '', confirmPassword: '' });
                                      setShowPasswordModal(true);
                                    }}
                                    className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
                                  >
                                    Reset Password
                                  </button>
                                  <button
                                    onClick={() => openDeleteMailboxModal(mailbox.name, false)}
                                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mail Lists Tab */}
                  {activeTab === 'lists' && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Mail Lists</h3>
                        <button
                          onClick={() => setShowAddListModal(true)}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
                        >
                          Add Mail List
                        </button>
                      </div>
                      {mailLists.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No mail lists found</p>
                      ) : (
                        <div className="space-y-3">
                          {mailLists.map((list: any) => (
                            <div key={list.name} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-bold text-gray-900">{list.name}@{domain}</div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    Members: {list.members?.length || 0} |
                                    Members Only: {list.membersOnly ? 'Yes' : 'No'}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      list.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {list.active ? 'Active' : 'Inactive'}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setSelectedList(list);
                                      setShowEditListModal(true);
                                    }}
                                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => openDeleteListModal(list.name)}
                                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Catch-All Modal */}
      {showCatchAllModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Catch-All Addresses</h3>
              <button onClick={() => setShowCatchAllModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Address</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newCatchAllAddress}
                    onChange={(e) => setNewCatchAllAddress(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    placeholder="catchall@example.com"
                  />
                  <button
                    onClick={() => {
                      if (newCatchAllAddress && !catchAllAddresses.includes(newCatchAllAddress)) {
                        setCatchAllAddresses([...catchAllAddresses, newCatchAllAddress]);
                        setNewCatchAllAddress('');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {catchAllAddresses.map((addr, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">{addr}</span>
                    <button
                      onClick={() => setCatchAllAddresses(catchAllAddresses.filter((_, i) => i !== idx))}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowCatchAllModal(false)}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSetCatchAll}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mail Relay Modal */}
      {showRelayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Configure Mail Relay</h3>
              <button onClick={() => setShowRelayModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSetRelay} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Provider *</label>
                <select
                  value={relayForm.provider}
                  onChange={(e) => setRelayForm({ ...relayForm, provider: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                  required
                >
                  <option value="">Select Provider</option>
                  <option value="mailgun">Mailgun</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="smtp">Generic SMTP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Host</label>
                <input
                  type="text"
                  value={relayForm.host}
                  onChange={(e) => setRelayForm({ ...relayForm, host: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                  placeholder="smtp.example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
                <input
                  type="number"
                  value={relayForm.port}
                  onChange={(e) => setRelayForm({ ...relayForm, port: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={relayForm.username}
                  onChange={(e) => setRelayForm({ ...relayForm, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={relayForm.password}
                  onChange={(e) => setRelayForm({ ...relayForm, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={relayForm.acceptSelfSignedCerts}
                    onChange={(e) => setRelayForm({ ...relayForm, acceptSelfSignedCerts: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Accept Self-Signed Certificates</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={relayForm.forceFromAddress}
                    onChange={(e) => setRelayForm({ ...relayForm, forceFromAddress: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Force From Address</span>
                </label>
              </div>
            </form>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowRelayModal(false)}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSetRelay}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Mail Signature</h3>
              <button onClick={() => setShowSignatureModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSetSignature} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Text Signature *</label>
                <textarea
                  value={signatureForm.text}
                  onChange={(e) => setSignatureForm({ ...signatureForm, text: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                  rows={4}
                  required
                  placeholder="Best regards, Your Team"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">HTML Signature</label>
                <textarea
                  value={signatureForm.html}
                  onChange={(e) => setSignatureForm({ ...signatureForm, html: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm text-gray-900"
                  rows={6}
                  placeholder="<div>Best regards, <strong>Your Team</strong></div>"
                />
              </div>
            </form>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowSignatureModal(false)}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSetSignature}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Mail Modal */}
      {showTestMailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Send Test Mail</h3>
              <button onClick={() => setShowTestMailModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSendTestMail} className="px-6 py-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Email *</label>
              <input
                type="email"
                value={testMailAddress}
                onChange={(e) => setTestMailAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                placeholder="test@example.com"
                required
              />
            </form>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowTestMailModal(false)}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSendTestMail}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && selectedMailbox && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Reset Mailbox Password</h3>
              <button onClick={() => {
                setShowPasswordModal(false);
                setSelectedMailbox(null);
                setPasswordForm({ password: '', confirmPassword: '' });
              }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="px-6 py-5 space-y-4">
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Resetting password for: <strong>{selectedMailbox.name}@{domain}</strong>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password *</label>
                <input
                  type="password"
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900"
                  placeholder="Enter new password (min. 8 characters)"
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900"
                  placeholder="Confirm new password"
                  minLength={8}
                  required
                />
              </div>
              {passwordForm.password && passwordForm.confirmPassword && passwordForm.password !== passwordForm.confirmPassword && (
                <p className="text-sm text-red-600">Passwords do not match</p>
              )}
            </form>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedMailbox(null);
                  setPasswordForm({ password: '', confirmPassword: '' });
                }}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={!passwordForm.password || !passwordForm.confirmPassword || passwordForm.password !== passwordForm.confirmPassword}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Mailbox Modal */}
      {showAddMailboxModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Add Mailbox</h3>
              <button onClick={() => setShowAddMailboxModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddMailbox} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mailbox Name *</label>
                <input
                  type="text"
                  value={mailboxForm.name}
                  onChange={(e) => setMailboxForm({ ...mailboxForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                  placeholder="username"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Owner ID *</label>
                <input
                  type="text"
                  value={mailboxForm.ownerId}
                  onChange={(e) => setMailboxForm({ ...mailboxForm, ownerId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                  placeholder="Leave empty to use first available user"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Owner Type</label>
                <select
                  value={mailboxForm.ownerType}
                  onChange={(e) => setMailboxForm({ ...mailboxForm, ownerType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                >
                  <option value="user">User</option>
                  <option value="group">Group</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Storage Quota (GB)</label>
                <input
                  type="number"
                  value={(mailboxForm.storageQuota / 1000000000).toFixed(2)}
                  onChange={(e) => setMailboxForm({ ...mailboxForm, storageQuota: parseFloat(e.target.value) * 1000000000 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                  step="0.01"
                />
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={mailboxForm.active}
                    onChange={(e) => setMailboxForm({ ...mailboxForm, active: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </form>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAddMailboxModal(false)}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMailbox}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mailbox Modal */}
      {showEditMailboxModal && selectedMailbox && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Edit Mailbox: {selectedMailbox.name}</h3>
              <button onClick={() => setShowEditMailboxModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpdateMailbox} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Storage Quota (GB)</label>
                <input
                  type="number"
                  value={((selectedMailbox.storageQuota || 0) / 1000000000).toFixed(2)}
                  onChange={(e) => setSelectedMailbox({ ...selectedMailbox, storageQuota: parseFloat(e.target.value) * 1000000000 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                  step="0.01"
                />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedMailbox.active}
                    onChange={(e) => setSelectedMailbox({ ...selectedMailbox, active: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedMailbox.enablePop3}
                    onChange={(e) => setSelectedMailbox({ ...selectedMailbox, enablePop3: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Enable POP3</span>
                </label>
              </div>
            </form>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowEditMailboxModal(false)}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateMailbox}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aliases Modal */}
      {showAliasesModal && selectedMailbox && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Aliases: {selectedMailbox.name}</h3>
              <button onClick={() => setShowAliasesModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSetAliases} className="px-6 py-5">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Alias</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAlias.name}
                    onChange={(e) => setNewAlias({ ...newAlias, name: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                    placeholder="alias"
                  />
                  <input
                    type="text"
                    value={newAlias.domain}
                    onChange={(e) => setNewAlias({ ...newAlias, domain: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                    placeholder="domain.com"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newAlias.name && newAlias.domain) {
                        setAliasesForm({
                          aliases: [...aliasesForm.aliases, { ...newAlias }],
                        });
                        setNewAlias({ name: '', domain: '' });
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {aliasesForm.aliases.map((alias, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">{alias.name}@{alias.domain}</span>
                    <button
                      type="button"
                      onClick={() => setAliasesForm({
                        aliases: aliasesForm.aliases.filter((_, i) => i !== idx),
                      })}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </form>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAliasesModal(false)}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSetAliases}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Mail List Modal */}
      {showAddListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Add Mail List</h3>
              <button onClick={() => setShowAddListModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddMailList} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">List Name *</label>
                <input
                  type="text"
                  value={listForm.name}
                  onChange={(e) => setListForm({ ...listForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                  placeholder="listname"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Member</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newMember}
                    onChange={(e) => setNewMember(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                    placeholder="member@example.com"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newMember && !listForm.members.includes(newMember)) {
                        setListForm({ ...listForm, members: [...listForm.members, newMember] });
                        setNewMember('');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {listForm.members.map((member, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">{member}</span>
                    <button
                      type="button"
                      onClick={() => setListForm({ ...listForm, members: listForm.members.filter((_, i) => i !== idx) })}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={listForm.membersOnly}
                    onChange={(e) => setListForm({ ...listForm, membersOnly: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Members Only</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={listForm.active}
                    onChange={(e) => setListForm({ ...listForm, active: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </form>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAddListModal(false)}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMailList}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mail List Modal */}
      {showEditListModal && selectedList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Edit Mail List: {selectedList.name}</h3>
              <button onClick={() => setShowEditListModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpdateMailList} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Member</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newMember}
                    onChange={(e) => setNewMember(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900"
                    placeholder="member@example.com"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newMember && !selectedList.members.includes(newMember)) {
                        setSelectedList({ ...selectedList, members: [...(selectedList.members || []), newMember] });
                        setNewMember('');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {(selectedList.members || []).map((member: string, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">{member}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedList({
                        ...selectedList,
                        members: selectedList.members.filter((_: string, i: number) => i !== idx)
                      })}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedList.membersOnly}
                    onChange={(e) => setSelectedList({ ...selectedList, membersOnly: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Members Only</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedList.active}
                    onChange={(e) => setSelectedList({ ...selectedList, active: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </form>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowEditListModal(false)}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateMailList}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Mailbox Confirmation Modal */}
      {showDeleteMailboxModal && mailboxToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Delete Mailbox</h3>
            </div>

            <div className="px-6 py-5">
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to delete mailbox:
                </p>
                <p className="text-lg font-bold text-red-600 mb-4">
                  {mailboxToDelete.name}@{domain}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  This action cannot be undone.{mailboxToDelete.deleteMails ? ' All emails will be permanently deleted.' : ''}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="font-bold text-red-600">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  placeholder="Type DELETE"
                  autoFocus
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={closeDeleteMailboxModal}
                disabled={deleting}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMailbox}
                disabled={deleting || deleteConfirmText.toUpperCase() !== 'DELETE'}
                className={`px-5 py-2.5 rounded-lg transition font-medium ${
                  deleteConfirmText.toUpperCase() === 'DELETE' && !deleting
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {deleting ? 'Deleting...' : 'Delete Mailbox'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Mail List Confirmation Modal */}
      {showDeleteListModal && listToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Delete Mail List</h3>
            </div>

            <div className="px-6 py-5">
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to delete mail list:
                </p>
                <p className="text-lg font-bold text-red-600 mb-4">
                  {listToDelete}@{domain}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  This action cannot be undone. All list configuration and members will be permanently removed.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="font-bold text-red-600">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  placeholder="Type DELETE"
                  autoFocus
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={closeDeleteListModal}
                disabled={deleting}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMailList}
                disabled={deleting || deleteConfirmText.toUpperCase() !== 'DELETE'}
                className={`px-5 py-2.5 rounded-lg transition font-medium ${
                  deleteConfirmText.toUpperCase() === 'DELETE' && !deleting
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {deleting ? 'Deleting...' : 'Delete Mail List'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
