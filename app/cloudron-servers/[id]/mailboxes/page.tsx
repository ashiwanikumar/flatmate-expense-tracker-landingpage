'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cloudronAPI } from '@/lib/api';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';
import Footer from '@/components/Footer';

export default function MailboxesPage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [server, setServer] = useState<any>(null);
  const [domains, setDomains] = useState<any[]>([]);
  const [mailboxes, setMailboxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingMailbox, setAddingMailbox] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [mailboxToDelete, setMailboxToDelete] = useState<{id: string, name: string, domain: string} | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [mailboxForm, setMailboxForm] = useState({
    name: '',
    domain: '',
    ownerType: 'user',
    ownerId: '',
    active: true,
    enablePop3: true,
    storageQuota: 5000000000, // 5GB
    messagesQuota: 0,
    aliases: [] as string[],
    aliasInput: '',
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
      const [serverRes, domainsRes, mailboxesRes] = await Promise.all([
        cloudronAPI.getServer(serverId),
        cloudronAPI.getDomains(serverId),
        cloudronAPI.getMailboxes(serverId),
      ]);
      setServer(serverRes.data.data);
      setDomains(domainsRes.data.data || []);
      setMailboxes(mailboxesRes.data.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMailbox = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mailboxForm.name || !mailboxForm.domain) {
      toast.error('Name and domain are required');
      return;
    }

    setAddingMailbox(true);
    try {
      const payload = {
        name: mailboxForm.name,
        domain: mailboxForm.domain,
        ownerType: mailboxForm.ownerType,
        ownerId: mailboxForm.ownerId || undefined,
        active: mailboxForm.active,
        enablePop3: mailboxForm.enablePop3,
        storageQuota: mailboxForm.storageQuota,
        messagesQuota: mailboxForm.messagesQuota,
        aliases: mailboxForm.aliases.length > 0 ? mailboxForm.aliases : undefined,
      };

      await cloudronAPI.createMailbox(serverId, payload);
      toast.success('Mailbox created successfully!');
      setShowAddModal(false);
      resetMailboxForm();
      fetchData();
    } catch (error: any) {
      console.error('Error creating mailbox:', error);
      toast.error(error.response?.data?.message || 'Failed to create mailbox');
    } finally {
      setAddingMailbox(false);
    }
  };

  const openDeleteModal = (mailboxId: string, mailboxName: string, domain: string) => {
    setMailboxToDelete({ id: mailboxId, name: mailboxName, domain });
    setShowDeleteModal(true);
    setDeleteConfirmText('');
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setMailboxToDelete(null);
    setDeleteConfirmText('');
  };

  const handleDeleteMailbox = async () => {
    if (!mailboxToDelete) return;

    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setDeleting(true);
    try {
      await cloudronAPI.deleteMailbox(serverId, mailboxToDelete.id, mailboxToDelete.domain);
      toast.success('Mailbox deleted successfully!');
      closeDeleteModal();
      fetchData();
    } catch (error: any) {
      console.error('Error deleting mailbox:', error);
      toast.error(error.response?.data?.message || 'Failed to delete mailbox');
    } finally {
      setDeleting(false);
    }
  };

  const resetMailboxForm = () => {
    setMailboxForm({
      name: '',
      domain: '',
      ownerType: 'user',
      ownerId: '',
      active: true,
      enablePop3: true,
      storageQuota: 5000000000,
      messagesQuota: 0,
      aliases: [],
      aliasInput: '',
    });
  };

  const addAlias = () => {
    if (mailboxForm.aliasInput.trim()) {
      setMailboxForm({
        ...mailboxForm,
        aliases: [...mailboxForm.aliases, mailboxForm.aliasInput.trim()],
        aliasInput: '',
      });
    }
  };

  const removeAlias = (index: number) => {
    setMailboxForm({
      ...mailboxForm,
      aliases: mailboxForm.aliases.filter((_, i) => i !== index),
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} />
      <NavigationMenu />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <Link href="/cloudron-servers" className="hover:text-purple-600">
                Cloudron Servers
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">{server?.domain || 'Mailboxes'}</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mailboxes</h1>
                <p className="mt-2 text-sm text-gray-600">Manage email mailboxes for {server?.domain}</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
              >
                Create Mailbox
              </button>
            </div>
          </div>

          {/* Mailboxes List */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : mailboxes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Mailboxes</h3>
              <p className="text-gray-500 mb-4">Create your first mailbox to get started</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
              >
                Create Mailbox
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mailboxes.map((mailbox, index) => (
                <div key={mailbox.id || `${mailbox.name}-${mailbox.domain}-${index}`} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {mailbox.name}@{mailbox.domain}
                      </h3>
                      <span
                        className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                          mailbox.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {mailbox.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Mailbox Details */}
                  <div className="space-y-2 text-sm mb-4">
                    {mailbox.ownerType && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium text-gray-900 capitalize">{mailbox.ownerType}</span>
                      </div>
                    )}
                    {mailbox.storageQuota && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Storage:</span>
                        <span className="font-medium text-gray-900">{formatBytes(mailbox.storageQuota)}</span>
                      </div>
                    )}
                    {mailbox.enablePop3 !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">POP3:</span>
                        <span className="font-medium text-gray-900">{mailbox.enablePop3 ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    )}
                    {mailbox.aliases && mailbox.aliases.length > 0 && (
                      <div>
                        <span className="text-gray-600 block mb-1">Aliases:</span>
                        <div className="space-y-1">
                          {mailbox.aliases.slice(0, 2).map((alias: string, idx: number) => (
                            <span key={`${mailbox.id}-alias-${idx}`} className="block text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                              {alias}
                            </span>
                          ))}
                          {mailbox.aliases.length > 2 && (
                            <span className="text-xs text-gray-500">+{mailbox.aliases.length - 2} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => openDeleteModal(mailbox.id, mailbox.name, mailbox.domain)}
                    className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    Delete Mailbox
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Mailbox Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">Create Mailbox</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddMailbox} className="px-6 py-5">
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mailbox Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={mailboxForm.name}
                    onChange={(e) => setMailboxForm({ ...mailboxForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="sales, support, info, etc."
                  />
                </div>

                {/* Domain */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domain <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={mailboxForm.domain}
                    onChange={(e) => setMailboxForm({ ...mailboxForm, domain: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select Domain</option>
                    {domains.map((domain) => (
                      <option key={domain.domain} value={domain.domain}>
                        {domain.domain}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Owner Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Owner Type</label>
                  <select
                    value={mailboxForm.ownerType}
                    onChange={(e) => setMailboxForm({ ...mailboxForm, ownerType: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  >
                    <option value="user">User</option>
                    <option value="group">Group</option>
                  </select>
                </div>

                {/* Owner ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Owner ID (Optional)</label>
                  <input
                    type="text"
                    value={mailboxForm.ownerId}
                    onChange={(e) => setMailboxForm({ ...mailboxForm, ownerId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="Leave empty to auto-assign"
                  />
                  <p className="mt-1 text-xs text-gray-500">If not provided, will use the first available user</p>
                </div>

                {/* Storage Quota */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Storage Quota (GB)</label>
                  <input
                    type="number"
                    value={mailboxForm.storageQuota / 1000000000}
                    onChange={(e) =>
                      setMailboxForm({ ...mailboxForm, storageQuota: parseFloat(e.target.value) * 1000000000 })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    step="0.1"
                    min="0.1"
                  />
                </div>

                {/* Messages Quota */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Messages Quota (0 = unlimited)</label>
                  <input
                    type="number"
                    value={mailboxForm.messagesQuota}
                    onChange={(e) => setMailboxForm({ ...mailboxForm, messagesQuota: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    min="0"
                  />
                </div>

                {/* Aliases */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Aliases</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={mailboxForm.aliasInput}
                      onChange={(e) => setMailboxForm({ ...mailboxForm, aliasInput: e.target.value })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addAlias();
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      placeholder="alias@domain.com"
                    />
                    <button
                      type="button"
                      onClick={addAlias}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Add
                    </button>
                  </div>
                  {mailboxForm.aliases.length > 0 && (
                    <div className="space-y-2">
                      {mailboxForm.aliases.map((alias, index) => (
                        <div key={index} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded">
                          <span className="text-sm text-blue-700">{alias}</span>
                          <button
                            type="button"
                            onClick={() => removeAlias(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="active"
                      checked={mailboxForm.active}
                      onChange={(e) => setMailboxForm({ ...mailboxForm, active: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                      Active mailbox
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enablePop3"
                      checked={mailboxForm.enablePop3}
                      onChange={(e) => setMailboxForm({ ...mailboxForm, enablePop3: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="enablePop3" className="ml-2 text-sm text-gray-700">
                      Enable POP3 access
                    </label>
                  </div>
                </div>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={addingMailbox}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMailbox}
                disabled={addingMailbox}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-medium"
              >
                {addingMailbox ? 'Creating...' : 'Create Mailbox'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && mailboxToDelete && (
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
                  {mailboxToDelete.name}@{mailboxToDelete.domain}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  This action cannot be undone. All emails in this mailbox will be permanently deleted.
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
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white text-gray-900 text-base font-medium"
                  placeholder="Type DELETE"
                  autoFocus
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMailbox}
                disabled={deleting || deleteConfirmText !== 'DELETE'}
                className={`px-5 py-2.5 rounded-lg transition font-medium ${
                  deleteConfirmText === 'DELETE' && !deleting
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
      <Footer />
    </div>
  );
}
