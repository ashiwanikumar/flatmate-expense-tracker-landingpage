'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cloudronAPI } from '@/lib/api';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';
import Footer from '@/components/Footer';

// Mount type constants
const MOUNT_TYPES = [
  { value: 'cifs', label: 'CIFS (Windows Network Share)' },
  { value: 'filesystem', label: 'Filesystem' },
  { value: 'ext4', label: 'EXT4' },
  { value: 'mountpoint', label: 'Mountpoint' },
  { value: 'nfs', label: 'NFS (Network File System)' },
  { value: 'sshfs', label: 'SSHFS (SSH Filesystem)' },
  { value: 'xfs', label: 'XFS' },
];

export default function VolumesPage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [server, setServer] = useState<any>(null);
  const [volumes, setVolumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVolume, setSelectedVolume] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [volumeStatus, setVolumeStatus] = useState<any>(null);
  const [remounting, setRemounting] = useState<string | null>(null);

  // Form state for add volume
  const [volumeForm, setVolumeForm] = useState({
    name: '',
    mountType: 'cifs',
    mountOptions: {} as any,
  });

  // Form state for edit volume
  const [editForm, setEditForm] = useState({
    mountOptions: {} as any,
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
      const [serverRes, volumesRes] = await Promise.allSettled([
        cloudronAPI.getServer(serverId),
        cloudronAPI.listVolumes(serverId),
      ]);

      if (serverRes.status === 'fulfilled') {
        setServer(serverRes.value.data.data);
      }
      if (volumesRes.status === 'fulfilled') {
        setVolumes(volumesRes.value.data.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVolume = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cloudronAPI.addVolume(serverId, volumeForm);
      toast.success('Volume added successfully!');
      setShowAddModal(false);
      resetAddForm();
      fetchData();
    } catch (error: any) {
      console.error('Error adding volume:', error);
      toast.error(error.response?.data?.message || 'Failed to add volume');
    }
  };

  const handleEditVolume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVolume) return;

    try {
      await cloudronAPI.updateVolume(serverId, selectedVolume.id, editForm);
      toast.success('Volume updated successfully!');
      setShowEditModal(false);
      setSelectedVolume(null);
      fetchData();
    } catch (error: any) {
      console.error('Error updating volume:', error);
      toast.error(error.response?.data?.message || 'Failed to update volume');
    }
  };

  const handleDeleteVolume = async () => {
    if (!selectedVolume) return;

    try {
      await cloudronAPI.deleteVolume(serverId, selectedVolume.id);
      toast.success('Volume deleted successfully!');
      setShowDeleteModal(false);
      setSelectedVolume(null);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting volume:', error);
      toast.error(error.response?.data?.message || 'Failed to delete volume');
    }
  };

  const handleRemountVolume = async (volumeId: string) => {
    try {
      setRemounting(volumeId);
      await cloudronAPI.remountVolume(serverId, volumeId);
      toast.success('Volume remounting initiated!');
      setTimeout(() => fetchData(), 2000);
    } catch (error: any) {
      console.error('Error remounting volume:', error);
      toast.error(error.response?.data?.message || 'Failed to remount volume');
    } finally {
      setRemounting(null);
    }
  };

  const handleCheckStatus = async (volume: any) => {
    try {
      const response = await cloudronAPI.getVolumeStatus(serverId, volume.id);
      setVolumeStatus(response.data.data);
      setSelectedVolume(volume);
      setShowStatusModal(true);
    } catch (error: any) {
      console.error('Error checking volume status:', error);
      toast.error(error.response?.data?.message || 'Failed to check volume status');
    }
  };

  const openEditModal = (volume: any) => {
    setSelectedVolume(volume);
    setEditForm({
      mountOptions: { ...volume.mountOptions },
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (volume: any) => {
    setSelectedVolume(volume);
    setShowDeleteModal(true);
  };

  const resetAddForm = () => {
    setVolumeForm({
      name: '',
      mountType: 'cifs',
      mountOptions: {},
    });
  };

  const renderMountOptionsForm = (mountType: string, options: any, onChange: (options: any) => void, isEdit: boolean = false) => {
    switch (mountType) {
      case 'cifs':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Host *</label>
              <input
                type="text"
                required
                value={options.host || ''}
                onChange={(e) => onChange({ ...options, host: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remote Directory *</label>
              <input
                type="text"
                required
                value={options.remoteDir || ''}
                onChange={(e) => onChange({ ...options, remoteDir: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="/backup"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
              <input
                type="text"
                required
                value={options.username || ''}
                onChange={(e) => onChange({ ...options, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                required
                value={options.password || ''}
                onChange={(e) => onChange({ ...options, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={options.seal || false}
                onChange={(e) => onChange({ ...options, seal: e.target.checked })}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Enable SMB3 Encryption (Seal)</label>
            </div>
          </div>
        );

      case 'nfs':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Host *</label>
              <input
                type="text"
                required
                value={options.host || ''}
                onChange={(e) => onChange({ ...options, host: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="nfs.example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remote Directory *</label>
              <input
                type="text"
                required
                value={options.remoteDir || ''}
                onChange={(e) => onChange({ ...options, remoteDir: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="/export/backup"
              />
            </div>
          </div>
        );

      case 'sshfs':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Host *</label>
              <input
                type="text"
                required
                value={options.host || ''}
                onChange={(e) => onChange({ ...options, host: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="ssh.example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
              <input
                type="number"
                value={options.port || 22}
                onChange={(e) => onChange({ ...options, port: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="22"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
              <input
                type="text"
                required
                value={options.username || ''}
                onChange={(e) => onChange({ ...options, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remote Directory *</label>
              <input
                type="text"
                required
                value={options.remoteDir || ''}
                onChange={(e) => onChange({ ...options, remoteDir: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="/home/user/backup"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Private Key *</label>
              <textarea
                required
                value={options.privateKey || ''}
                onChange={(e) => onChange({ ...options, privateKey: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
              />
            </div>
          </div>
        );

      case 'filesystem':
      case 'mountpoint':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Host Path *</label>
              <input
                type="text"
                required
                value={options.hostPath || ''}
                onChange={(e) => onChange({ ...options, hostPath: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="/mnt/storage"
              />
            </div>
          </div>
        );

      case 'ext4':
      case 'xfs':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Device *</label>
              <input
                type="text"
                required
                value={options.device || ''}
                onChange={(e) => onChange({ ...options, device: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="/dev/sdb1"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-500">
            Select a mount type to configure options
          </div>
        );
    }
  };

  const getMountTypeLabel = (mountType: string) => {
    const type = MOUNT_TYPES.find((t) => t.value === mountType);
    return type ? type.label : mountType;
  };

  const formatCreationTime = (time: string) => {
    return new Date(time).toLocaleString();
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
              {server?.domain || 'Server'}
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Volumes</span>
          </div>

          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Storage Volumes</h1>
                <p className="text-sm text-gray-600 mt-1">Manage external storage volumes for {server?.domain}</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
              >
                Add Volume
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {volumes.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No volumes</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new storage volume.</p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
                    >
                      Add Volume
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {volumes.map((volume) => (
                    <div key={volume.id} className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{volume.name}</h3>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {getMountTypeLabel(volume.mountType)}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <label className="text-xs text-gray-500">Volume ID</label>
                              <p className="text-sm font-mono text-gray-900">{volume.id}</p>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Host Path</label>
                              <p className="text-sm font-mono text-gray-900">{volume.hostPath || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Mount Type</label>
                              <p className="text-sm text-gray-900">{volume.mountType}</p>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Created</label>
                              <p className="text-sm text-gray-900">{formatCreationTime(volume.creationTime)}</p>
                            </div>
                          </div>

                          {/* Mount Options Summary */}
                          {volume.mountOptions && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                              <label className="text-xs font-medium text-gray-700">Mount Options</label>
                              <div className="mt-2 space-y-1">
                                {volume.mountType === 'cifs' && (
                                  <>
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium">Host:</span> {volume.mountOptions.host}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium">Remote Dir:</span> {volume.mountOptions.remoteDir}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium">Username:</span> {volume.mountOptions.username}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium">Seal:</span> {volume.mountOptions.seal ? 'Yes' : 'No'}
                                    </p>
                                  </>
                                )}
                                {(volume.mountType === 'nfs' || volume.mountType === 'sshfs') && (
                                  <>
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium">Host:</span> {volume.mountOptions.host}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium">Remote Dir:</span> {volume.mountOptions.remoteDir}
                                    </p>
                                    {volume.mountOptions.username && (
                                      <p className="text-sm text-gray-600">
                                        <span className="font-medium">Username:</span> {volume.mountOptions.username}
                                      </p>
                                    )}
                                  </>
                                )}
                                {(volume.mountType === 'filesystem' || volume.mountType === 'mountpoint') && (
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Host Path:</span> {volume.mountOptions.hostPath}
                                  </p>
                                )}
                                {(volume.mountType === 'ext4' || volume.mountType === 'xfs') && (
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Device:</span> {volume.mountOptions.device}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            onClick={() => handleCheckStatus(volume)}
                            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                          >
                            Check Status
                          </button>
                          <button
                            onClick={() => handleRemountVolume(volume.id)}
                            disabled={remounting === volume.id}
                            className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {remounting === volume.id ? 'Remounting...' : 'Remount'}
                          </button>
                          {(volume.mountType === 'cifs' || volume.mountType === 'nfs' || volume.mountType === 'sshfs') && (
                            <button
                              onClick={() => openEditModal(volume)}
                              className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => openDeleteModal(volume)}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Add Volume Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add Storage Volume</h2>
              <form onSubmit={handleAddVolume}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Volume Name *</label>
                    <input
                      type="text"
                      required
                      value={volumeForm.name}
                      onChange={(e) => setVolumeForm({ ...volumeForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="My Backup Volume"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mount Type *</label>
                    <select
                      required
                      value={volumeForm.mountType}
                      onChange={(e) => setVolumeForm({ ...volumeForm, mountType: e.target.value, mountOptions: {} })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {MOUNT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Mount Options</h3>
                    {renderMountOptionsForm(
                      volumeForm.mountType,
                      volumeForm.mountOptions,
                      (options) => setVolumeForm({ ...volumeForm, mountOptions: options })
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
                  >
                    Add Volume
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetAddForm();
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Volume Modal */}
      {showEditModal && selectedVolume && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Volume: {selectedVolume.name}</h2>
              <form onSubmit={handleEditVolume}>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Note:</span> You can only update mount options for CIFS, NFS, and SSHFS volumes.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Mount Options</h3>
                    {renderMountOptionsForm(
                      selectedVolume.mountType,
                      editForm.mountOptions,
                      (options) => setEditForm({ mountOptions: options }),
                      true
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
                  >
                    Update Volume
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedVolume(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedVolume && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Volume</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the volume <span className="font-bold">{selectedVolume.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteVolume}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedVolume(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Volume Status Modal */}
      {showStatusModal && selectedVolume && volumeStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Volume Status: {selectedVolume.name}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">State</label>
                <p className={`text-lg font-bold ${volumeStatus.state === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                  {volumeStatus.state}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Message</label>
                <p className="text-sm text-gray-900">{volumeStatus.message}</p>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedVolume(null);
                  setVolumeStatus(null);
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
