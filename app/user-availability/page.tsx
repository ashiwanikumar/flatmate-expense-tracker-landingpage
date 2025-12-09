'use client';

import { useState, useEffect } from 'react';
import { userAvailabilityAPI, organizationAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { toast } from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Member {
  _id: string;
  user: User;
  role: string;
}

interface Availability {
  _id: string;
  userId: User;
  startDate: string;
  endDate: string;
  reason?: string;
  status: string;
  durationDays: number;
  createdAt: string;
}

interface AvailabilityStatus {
  user: User;
  isAvailable: boolean;
  currentAbsence: {
    startDate: string;
    endDate: string;
    reason?: string;
    durationDays: number;
  } | null;
}

export default function UserAvailabilityPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [currentStatus, setCurrentStatus] = useState<AvailabilityStatus[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [organization, setOrganization] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAvailabilities(),
        fetchCurrentStatus(),
        fetchMembers(),
        fetchOrganization()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganization = async () => {
    try {
      const response = await organizationAPI.getMyOrganization();
      setOrganization(response.data.data);
    } catch (error: any) {
      console.error('Error fetching organization:', error);
    }
  };

  const fetchAvailabilities = async () => {
    try {
      const response = await userAvailabilityAPI.getAll({ sortBy: 'startDate', sortOrder: 'desc' });
      setAvailabilities(response.data.data.availabilities || []);
    } catch (error: any) {
      console.error('Error fetching availabilities:', error);
    }
  };

  const fetchCurrentStatus = async () => {
    try {
      const response = await userAvailabilityAPI.getCurrentStatus();
      setCurrentStatus(response.data.data.users || []);
    } catch (error: any) {
      console.error('Error fetching current status:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await organizationAPI.getMembers();
      const membersData = response.data.data.members || response.data.data || [];
      console.log('Fetched members:', membersData.length, membersData);
      setMembers(membersData);
    } catch (error: any) {
      console.error('Error fetching members:', error);
      setMembers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate userId
    if (!formData.userId) {
      toast.error('Please select a member');
      return;
    }

    // Validate dates
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      toast.error('Absence period must be at least 7 days to be considered for expense calculations');
      return;
    }

    if (end <= start) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      await userAvailabilityAPI.create(formData);
      toast.success('Absence period marked successfully!');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error creating availability:', error);
      toast.error(error.response?.data?.message || 'Failed to mark absence');
    }
  };

  const canDeleteAvailability = (availability: Availability) => {
    if (!user) return false;
    // Admin/Owner can delete any record
    if (isAdminOrOwner()) return true;
    // Regular members can only delete their own records
    return availability.userId._id === user._id;
  };

  const handleDelete = async (id: string, availability: Availability) => {
    if (!canDeleteAvailability(availability)) {
      toast.error('You do not have permission to delete this record');
      return;
    }

    if (!confirm('Are you sure you want to delete this absence record?')) return;

    try {
      await userAvailabilityAPI.delete(id);
      toast.success('Absence record deleted successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting availability:', error);
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  // Check if user is admin or owner
  const isAdminOrOwner = () => {
    if (!user) return false;
    
    // Check organizationRole from user object first (faster)
    if (user.organizationRole === 'admin' || user.organizationRole === 'owner' || user.organizationRole === 'super_admin') {
      return true;
    }
    
    // Check role from members state (most reliable)
    if (members && members.length > 0) {
      const userMember = members.find((m: Member) => m.user && m.user._id === user._id);
      if (userMember && (userMember.role === 'admin' || userMember.role === 'owner')) {
        return true;
      }
    }
    
    // If organization is loaded, check role from organization members list
    if (organization && organization.members) {
      const userMember = organization.members.find((m: Member) => m.user && m.user._id === user._id);
      if (userMember && (userMember.role === 'admin' || userMember.role === 'owner')) {
        return true;
      }
    }
    
    return false;
  };

  // Get filtered members based on permissions
  const getFilteredMembers = () => {
    if (!members || members.length === 0) return [];
    if (!user) return [];
    
    const isAdmin = isAdminOrOwner();
    
    if (isAdmin) {
      // Admin/Owner can see all members
      return members.filter(member => member.user && member.user._id);
    } else {
      // Regular members can only see themselves
      return members.filter(member => member.user && member.user._id === user._id);
    }
  };

  // Get all available members (for fallback display)
  const getAllAvailableMembers = () => {
    return members.filter(member => member.user && member.user._id);
  };

  const resetForm = () => {
    const filteredMembers = getFilteredMembers();
    const defaultUserId = filteredMembers.length === 1 && !isAdminOrOwner() 
      ? filteredMembers[0].user._id 
      : '';
    
    setFormData({
      userId: defaultUserId,
      startDate: '',
      endDate: '',
      reason: ''
    });
  };

  const handleOpenModal = async () => {
    // Ensure members are loaded before opening modal
    if (members.length === 0) {
      console.log('No members in state, fetching...');
      await fetchMembers();
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('Opening modal with members:', members.length);
    resetForm(); // Set default userId based on permissions
    setShowModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: { [key: string]: string } = {
      scheduled: 'bg-blue-100 text-blue-800',
      active: 'bg-orange-100 text-orange-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.scheduled;
  };

  if (loading) {
    return (
      <LayoutWrapper user={user}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent mb-4"></div>
            <p className="text-gray-600">Loading availability data...</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper user={user}>
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Member Availability</h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                Track when members are away to ensure fair expense splitting
                {isAdminOrOwner() && (
                  <span className="ml-2 px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded">
                    Admin/Owner: Can mark availability for any member
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={handleOpenModal}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all whitespace-nowrap text-sm sm:text-base"
            >
              + Mark Absence
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="flex-shrink-0 text-blue-600 text-xl sm:text-2xl">ℹ️</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Important Information</h3>
              <ul className="text-xs sm:text-sm text-blue-800 space-y-1.5">
                <li>• <strong>Minimum 7 days required:</strong> Only absences of 7 days or more are considered for expense calculations</li>
                <li>• <strong>Automatic proration:</strong> Grocery and household expenses are automatically prorated based on days present</li>
                <li>• <strong>Other expenses:</strong> Food, utilities, and other expenses are NOT prorated</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Current Status Grid */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3 sm:mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Current Status</h2>

            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  viewMode === 'card'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="hidden sm:inline">Card View</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="hidden sm:inline">List View</span>
              </button>
            </div>
          </div>

          {/* Card View */}
          {viewMode === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {currentStatus.map((status) => (
              <div
                key={status.user._id}
                className={`p-4 sm:p-6 rounded-lg border-2 ${
                  status.isAvailable ? 'bg-green-50 border-green-300' : 'bg-orange-50 border-orange-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm sm:text-base truncate">{status.user.name}</h4>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{status.user.email}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ml-2 ${status.isAvailable ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                </div>
                {status.currentAbsence ? (
                  <div className="mt-3 p-3 bg-white rounded border border-orange-200">
                    <p className="text-sm font-semibold text-orange-900 mb-1">Currently Away</p>
                    <p className="text-xs text-gray-700">
                      {formatDate(status.currentAbsence.startDate)} - {formatDate(status.currentAbsence.endDate)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {status.currentAbsence.durationDays} days
                    </p>
                    {status.currentAbsence.reason && (
                      <p className="text-xs text-gray-600 mt-1 italic">
                        "{status.currentAbsence.reason}"
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-green-700">Available</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Absence Period
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentStatus.map((status) => (
                      <tr key={status.user._id} className={`hover:bg-gray-50 transition-colors ${
                        status.isAvailable ? 'bg-green-50/30' : 'bg-orange-50/30'
                      }`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              status.isAvailable ? 'bg-green-100' : 'bg-orange-100'
                            }`}>
                              <span className={`text-sm font-bold ${
                                status.isAvailable ? 'text-green-700' : 'text-orange-700'
                              }`}>
                                {status.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-bold text-gray-900">{status.user.name}</div>
                              <div className="text-xs text-gray-600">{status.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${status.isAvailable ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                            <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                              status.isAvailable
                                ? 'bg-green-100 text-green-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {status.isAvailable ? 'Available' : 'Away'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {status.currentAbsence ? (
                            <div>
                              <div className="text-sm text-gray-900">
                                {formatDate(status.currentAbsence.startDate)}
                              </div>
                              <div className="text-xs text-gray-600">
                                to {formatDate(status.currentAbsence.endDate)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {status.currentAbsence ? (
                            <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
                              {status.currentAbsence.durationDays} days
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs">
                            {status.currentAbsence?.reason ? (
                              <span className="italic">"{status.currentAbsence.reason}"</span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile List View */}
              <div className="md:hidden divide-y divide-gray-200">
                {currentStatus.map((status) => (
                  <div key={status.user._id} className={`p-4 ${
                    status.isAvailable ? 'bg-green-50/50' : 'bg-orange-50/50'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          status.isAvailable ? 'bg-green-100' : 'bg-orange-100'
                        }`}>
                          <span className={`text-base font-bold ${
                            status.isAvailable ? 'text-green-700' : 'text-orange-700'
                          }`}>
                            {status.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-gray-900 truncate">{status.user.name}</h4>
                          <p className="text-xs text-gray-600 truncate">{status.user.email}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                        status.isAvailable
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${status.isAvailable ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                        <span className="text-xs font-semibold">{status.isAvailable ? 'Available' : 'Away'}</span>
                      </div>
                    </div>

                    {status.currentAbsence && (
                      <div className="bg-white rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start text-sm">
                          <span className="text-gray-600 font-medium">Period:</span>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              {formatDate(status.currentAbsence.startDate)}
                            </div>
                            <div className="text-xs text-gray-600">
                              to {formatDate(status.currentAbsence.endDate)}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 font-medium">Duration:</span>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            {status.currentAbsence.durationDays} days
                          </span>
                        </div>
                        {status.currentAbsence.reason && (
                          <div className="pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-600 font-medium mb-1">Reason:</p>
                            <p className="text-xs text-gray-900 italic">"{status.currentAbsence.reason}"</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Absence Records */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Absence Records</h2>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {availabilities.length === 0 ? (
              <div className="p-8 sm:p-12 text-center text-gray-600">
                <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📅</div>
                <p className="text-base sm:text-lg font-medium mb-2">No absence records yet</p>
                <p className="text-xs sm:text-sm">Click "Mark Absence" to record when someone is away</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {availabilities.map((availability) => (
                      <tr key={availability._id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div>
                            <div className="text-xs sm:text-sm font-medium text-gray-900">{availability.userId.name}</div>
                            <div className="text-xs sm:text-sm text-gray-500">{availability.userId.email}</div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-gray-900">
                            {formatDate(availability.startDate)}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            to {formatDate(availability.endDate)}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className="px-2 sm:px-3 py-1 inline-flex text-xs sm:text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
                            {availability.durationDays} days
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="text-xs sm:text-sm text-gray-900 max-w-xs truncate">
                            {availability.reason || '-'}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className={`px-2 sm:px-3 py-1 inline-flex text-xs font-medium rounded-full ${getStatusBadgeColor(availability.status)}`}>
                            {availability.status}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                          {canDeleteAvailability(availability) ? (
                            <button
                              onClick={() => handleDelete(availability._id, availability)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">No permission</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Absence Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Mark Absence Period</h2>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Member Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Select Member <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  {isAdminOrOwner() 
                    ? 'Choose which member will be away' 
                    : 'Mark your own absence period'}
                </p>
                {(() => {
                  const availableMembers = getAllAvailableMembers();
                  
                  if (availableMembers.length === 0) {
                    return (
                      <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                        <p className="text-sm text-gray-600 text-center">
                          {loading ? 'Loading members...' : 'No members available'}
                        </p>
                      </div>
                    );
                  }
                  
                  // For admin/owner, show filtered; for others, show all (fallback)
                  const filtered = getFilteredMembers();
                  const membersToShow = (isAdminOrOwner() && filtered.length > 0) ? filtered : availableMembers;
                  
                  return (
                    <div className="border-2 border-gray-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                      {membersToShow.map((member) => (
                        <button
                          key={member.user._id}
                          type="button"
                          onClick={() => setFormData({ ...formData, userId: member.user._id })}
                          className={`w-full flex items-center justify-between p-3 text-left transition-colors hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                            formData.userId === member.user._id
                              ? 'bg-purple-50 border-l-4 border-l-purple-600'
                              : ''
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold text-gray-900 truncate">{member.user.name}</div>
                              {member.role && (
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                  member.role === 'owner' 
                                    ? 'bg-purple-100 text-purple-800'
                                    : member.role === 'admin'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {member.role}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 truncate">{member.user.email}</div>
                          </div>
                          {formData.userId === member.user._id && (
                            <svg className="w-6 h-6 text-purple-600 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 text-base text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  style={{ colorScheme: 'light' }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 text-base text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  style={{ colorScheme: 'light' }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-3 text-base text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                  rows={3}
                  placeholder="e.g., Business trip, Vacation, Family visit..."
                />
              </div>

              <div className="p-3 sm:p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                <p className="text-sm font-semibold text-yellow-900 flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>Minimum 7 days required for expense calculations</span>
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-base shadow-md hover:shadow-lg"
                >
                  Save Absence
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </LayoutWrapper>
  );
}
