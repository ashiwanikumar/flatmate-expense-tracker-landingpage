'use client';

import { useState, useEffect } from 'react';
import { invitationAPI, organizationAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import toast from 'react-hot-toast';

interface Invitation {
  _id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: {
    _id: string;
    name: string;
    email: string;
  };
  acceptedBy?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface Member {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  role: string;
  joinedAt: string;
  invitedBy?: {
    _id: string;
    name: string;
    email: string;
  };
}

export default function InvitationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [sending, setSending] = useState(false);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [workspaceInviteLink, setWorkspaceInviteLink] = useState<string | null>(null);
  const [workspaceInviteRole, setWorkspaceInviteRole] = useState<'member' | 'admin'>('member');
  const [workspaceInviteExpiry, setWorkspaceInviteExpiry] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setUserRole(parsedUser.organizationRole ||'');
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invitationsRes, orgRes] = await Promise.all([
        invitationAPI.getAll(),
        organizationAPI.getMyOrganization()
      ]);

      setInvitations(invitationsRes.data.data.invitations);

      // Extract members from organization response
      const organization = orgRes.data.data;
      if (organization && organization.members) {
        // Map members to include all fields properly
        const membersData = organization.members.map((m: any) => ({
          _id: m.user._id,
          name: m.user.name,
          email: m.user.email,
          mobile: m.user.mobile,
          role: m.role,
          joinedAt: m.joinedAt,
          invitedBy: m.invitedBy
        }));
        setMembers(membersData);

        // Find current user's role from members
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('Current user from localStorage:', currentUser);
        console.log('All members:', membersData);

        // Try multiple ways to find the user
        let currentMember = membersData.find((m: any) => m._id === currentUser._id);

        // If not found by _id, try by id
        if (!currentMember && currentUser.id) {
          currentMember = membersData.find((m: any) => m._id === currentUser.id);
        }

        // If still not found, try by email
        if (!currentMember && currentUser.email) {
          currentMember = membersData.find((m: any) => m.email === currentUser.email);
        }

        console.log('Found current member:', currentMember);
        if (currentMember) {
          console.log('Setting user role to:', currentMember.role);
          setUserRole(currentMember.role);
        } else {
          console.log('Current user not found in members, user ID:', currentUser._id, 'email:', currentUser.email);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      setSending(true);
      const response = await invitationAPI.send({
        email: inviteEmail,
        role: inviteRole,
      });

      // Get the invitation link from response
      const link = response.data.data.invitation?.invitationLink;
      if (link) {
        setInvitationLink(link);
      }

      toast.success('Invitation sent! An email has been sent to the recipient.');
      setInviteEmail('');
      setInviteRole('member');
      fetchData();
    } catch (err: any) {
      console.error('Failed to send invitation:', err);
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleCancelInvitation = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      await invitationAPI.cancel(id);
      toast.success('Invitation cancelled');
      fetchData();
    } catch (err: any) {
      console.error('Failed to cancel invitation:', err);
      toast.error(err.response?.data?.message || 'Failed to cancel invitation');
    }
  };

  const handleResendInvitation = async (id: string) => {
    try {
      await invitationAPI.resend(id);
      toast.success('Invitation resent successfully!');
      fetchData();
    } catch (err: any) {
      console.error('Failed to resend invitation:', err);
      toast.error(err.response?.data?.message || 'Failed to resend invitation');
    }
  };

  const handleGenerateWorkspaceLink = async () => {
    try {
      setGeneratingLink(true);
      const response = await organizationAPI.generateInviteLink({ role: workspaceInviteRole });
      const link = response.data.data.inviteLink;
      const expiresAt = response.data.data.expiresAt;
      setWorkspaceInviteLink(link);
      setWorkspaceInviteExpiry(expiresAt);
      toast.success(`Workspace invite link generated for ${workspaceInviteRole} role!`);
    } catch (err: any) {
      console.error('Failed to generate workspace link:', err);
      toast.error(err.response?.data?.message || 'Failed to generate workspace link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.pending;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: { [key: string]: string } = {
      owner: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      member: 'bg-gray-100 text-gray-800',
    };
    return colors[role] || colors.member;
  };

  return (
    <LayoutWrapper user={user}>
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team & Invitations</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage team members and invite flatmates to join
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              + Send Invitation
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <>
            {/* Workspace Invite Link Section */}
            {(() => {
              console.log('User Role for workspace link check:', userRole, 'Type:', typeof userRole);
              return (userRole && (userRole.toLowerCase() === 'owner' || userRole.toLowerCase() === 'admin'));
            })() && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-lg overflow-hidden mb-8 border-2 border-blue-200">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600">
                  <h2 className="text-lg font-semibold text-white">Shareable Workspace Link</h2>
                  <p className="text-sm text-blue-100 mt-1">
                    Generate a link that anyone can use to join your workspace via WhatsApp, social media, or any platform
                  </p>
                </div>
                <div className="p-6">
                  {!workspaceInviteLink ? (
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">
                        Generate a shareable link that can be used by anyone to join your workspace without needing an email invitation
                      </p>

                      {/* Role Selection */}
                      <div className="mb-4 max-w-md mx-auto">
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                          Select Role for New Members:
                        </label>
                        <select
                          value={workspaceInviteRole}
                          onChange={(e) => setWorkspaceInviteRole(e.target.value as 'member' | 'admin')}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="member">Member - Can use all features but cannot invite or delete</option>
                          <option value="admin">Admin - Can invite users and manage workspace</option>
                        </select>
                      </div>

                      <button
                        onClick={handleGenerateWorkspaceLink}
                        disabled={generatingLink}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {generatingLink ? 'Generating...' : 'Generate Workspace Link'}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Workspace Invite Link:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={workspaceInviteLink}
                          readOnly
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => copyToClipboard(workspaceInviteLink)}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
                        >
                          Copy
                        </button>
                        <button
                          onClick={handleGenerateWorkspaceLink}
                          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md"
                        >
                          Regenerate
                        </button>
                      </div>
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="space-y-2">
                          <p className="text-sm text-blue-800">
                            <strong>Role:</strong> New members will join as <span className="font-semibold">{workspaceInviteRole}</span>
                          </p>
                          {workspaceInviteExpiry && (
                            <p className="text-sm text-blue-800">
                              <strong>Expires:</strong> {new Date(workspaceInviteExpiry).toLocaleString()} (7 days from generation)
                            </p>
                          )}
                          <p className="text-sm text-blue-800">
                            <strong>Note:</strong> This link can be shared via WhatsApp, email, or any platform. Anyone with this link can join your workspace.
                            Regenerating the link will invalidate the previous one.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Team Members Section */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Team Members ({members.length})</h2>
              </div>
              {members.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No team members found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Member
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invited By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {members.map((member) => (
                        <tr key={member._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-purple-600 font-semibold">
                                  {member.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{member.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getRoleBadgeColor(member.role)}`}>
                              {member.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {member.invitedBy ? member.invitedBy.name : <span className="text-gray-400 italic">Founder</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(member.joinedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pending Invitations Section */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Pending Invitations ({invitations.length})</h2>
              </div>
              {invitations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No pending invitations. Send your first invitation to add flatmates!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invited By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sent Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expires
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invitations.map((invitation) => (
                        <tr key={invitation._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {invitation.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getRoleBadgeColor(invitation.role)}`}>
                              {invitation.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {invitation.invitedBy.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(invitation.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(invitation.expiresAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {invitation.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleResendInvitation(invitation._id)}
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                >
                                  Resend
                                </button>
                                <button
                                  onClick={() => handleCancelInvitation(invitation._id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Invite Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Send Invitation
            </h3>

            {invitationLink ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-800 mb-2">
                    Invitation sent successfully!
                  </p>
                  <p className="text-xs text-green-700">
                    An email has been sent to the recipient with the invitation link.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invitation Link (Backup)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={invitationLink}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-sm"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(invitationLink);
                        toast.success('Link copied to clipboard!');
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    You can also copy and share this link manually if needed.
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setInvitationLink(null);
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendInvitation}>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
                    placeholder="flatmate@example.com"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    id="role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    {inviteRole === 'admin' ? (
                      <span className="text-purple-600 font-medium">
                        Admin: Can invite users, manage members, and access all features
                      </span>
                    ) : (
                      <span className="text-gray-600">
                        Member: Can use all features but cannot invite users or delete account
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setInviteEmail('');
                      setInviteRole('member');
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Creating...' : 'Create Invitation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </LayoutWrapper>
  );
}
