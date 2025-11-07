'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { organizationAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface Organization {
  _id: string;
  name: string;
  type: string;
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  members: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
      mobile?: string;
      isActive: boolean;
    };
    role: string;
    joinedAt: string;
  }>;
  settings: {
    currency: string;
    timezone: string;
    expenseApprovalRequired: boolean;
  };
  subscription: {
    plan: string;
    maxMembers: number;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

interface Invitation {
  _id: string;
  email: string;
  name?: string;
  role: string;
  status: string;
  invitedBy: {
    name: string;
    email: string;
  };
  expiresAt: string;
  createdAt: string;
}

export default function OrganizationPage() {
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'member',
  });
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    fetchOrganizationData();
  }, []);

  const fetchOrganizationData = async () => {
    try {
      const [orgResponse, invitationsResponse] = await Promise.all([
        organizationAPI.getMyOrganization(),
        organizationAPI.getInvitations().catch(() => ({ data: [] })),
      ]);

      setOrganization(orgResponse.data.data);
      setInvitations(invitationsResponse.data || []);
    } catch (error: any) {
      console.error('Error fetching organization:', error);
      if (error.response?.status === 401) {
        router.push('/auth/login');
      } else {
        toast.error('Failed to load organization data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await organizationAPI.inviteMember(inviteForm);
      toast.success('Invitation sent successfully!');
      setShowInviteModal(false);
      setInviteForm({ email: '', name: '', role: 'member' });
      fetchOrganizationData();
    } catch (error: any) {
      console.error('Error inviting member:', error);
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} from the organization?`)) {
      return;
    }

    try {
      await organizationAPI.removeMember(userId);
      toast.success('Member removed successfully');
      fetchOrganizationData();
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast.error(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string, userName: string) => {
    if (!confirm(`Change ${userName}'s role to ${newRole}?`)) {
      return;
    }

    try {
      await organizationAPI.updateMemberRole(userId, newRole);
      toast.success('Role updated successfully');
      fetchOrganizationData();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error.response?.data?.message || 'Failed to update role');
    }
  };

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    if (!confirm(`Cancel invitation for ${email}?`)) {
      return;
    }

    try {
      await organizationAPI.cancelInvitation(invitationId);
      toast.success('Invitation cancelled');
      fetchOrganizationData();
    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel invitation');
    }
  };

  const getUserRole = () => {
    if (!organization || !currentUser) return null;
    const member = organization.members.find((m) => m.user._id === currentUser.id);
    return member?.role || null;
  };

  const canManageMembers = () => {
    const role = getUserRole();
    return role === 'owner' || role === 'admin';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Organization Found</h2>
          <p className="text-gray-600">You are not part of any organization yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
              <p className="text-gray-600 mt-1">
                {organization.type.charAt(0).toUpperCase() + organization.type.slice(1)} • {organization.subscription.plan} Plan
              </p>
            </div>
            {canManageMembers() && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                + Invite Member
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {organization.members.length} / {organization.subscription.maxMembers}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Invitations</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{invitations.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Your Role</p>
                <p className="text-2xl font-bold text-gray-900 mt-1 capitalize">{getUserRole()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Members</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {organization.members.map((member) => (
              <div key={member.user._id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-purple-600">
                      {member.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{member.user.name}</h3>
                    <p className="text-sm text-gray-600">{member.user.email}</p>
                    {member.user.mobile && <p className="text-sm text-gray-500">{member.user.mobile}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    member.role === 'owner' ? 'bg-purple-100 text-purple-700' :
                    member.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {member.role}
                  </span>
                  {canManageMembers() && member.role !== 'owner' && member.user._id !== currentUser?.id && (
                    <div className="flex gap-2">
                      {member.role === 'member' && (
                        <button
                          onClick={() => handleUpdateRole(member.user._id, 'admin', member.user.name)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Make Admin
                        </button>
                      )}
                      {member.role === 'admin' && (
                        <button
                          onClick={() => handleUpdateRole(member.user._id, 'member', member.user.name)}
                          className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                        >
                          Make Member
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveMember(member.user._id, member.user.name)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Invitations */}
        {canManageMembers() && invitations.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Pending Invitations</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {invitations.map((invitation) => (
                <div key={invitation._id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{invitation.name || invitation.email}</h3>
                    <p className="text-sm text-gray-600">{invitation.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Invited by {invitation.invitedBy.name} • Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                      {invitation.role}
                    </span>
                    <button
                      onClick={() => handleCancelInvitation(invitation._id, invitation.email)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Invite Member</h3>
              <form onSubmit={handleInviteMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="member@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Member Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
