'use client';

import { useState, useEffect } from 'react';
import { userAvailabilityAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NavigationMenu from '@/components/NavigationMenu';
import { toast } from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
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
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setFormData(prev => ({ ...prev, userId: parsedUser._id }));
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
        fetchCurrentStatus()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

  const handleDelete = async (id: string) => {
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

  const resetForm = () => {
    setFormData({
      userId: user?._id || '',
      startDate: '',
      endDate: '',
      reason: ''
    });
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {user && <Header user={user} />}
        <NavigationMenu />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent mb-4"></div>
            <p className="text-gray-600">Loading availability data...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {user && <Header user={user} />}
      <NavigationMenu />

      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Member Availability</h1>
            <p className="mt-2 text-gray-600">Track when members are away to ensure fair expense splitting</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            + Mark Absence
          </button>
        </div>

        {/* Info Banner */}
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Important Information</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Minimum 7 days required:</strong> Only absences of 7 days or more are considered for expense calculations</li>
              <li>• <strong>Automatic proration:</strong> Grocery and household expenses are automatically prorated based on days present</li>
              <li>• <strong>Other expenses:</strong> Food, utilities, and other expenses are NOT prorated</li>
            </ul>
          </div>
        </div>

        {/* Current Status Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentStatus.map((status) => (
              <div
                key={status.user._id}
                className={`p-6 rounded-lg border-2 ${
                  status.isAvailable ? 'bg-green-50 border-green-300' : 'bg-orange-50 border-orange-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900">{status.user.name}</h4>
                    <p className="text-sm text-gray-600">{status.user.email}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${status.isAvailable ? 'bg-green-500' : 'bg-orange-500'}`}></div>
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
        </div>

        {/* Absence Records */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Absence Records</h2>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {availabilities.length === 0 ? (
              <div className="p-12 text-center text-gray-600">
                <p className="text-lg font-medium mb-2">No absence records yet</p>
                <p className="text-sm">Click "Mark Absence" to record when someone is away</p>
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
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {availabilities.map((availability) => (
                      <tr key={availability._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{availability.userId.name}</div>
                            <div className="text-sm text-gray-500">{availability.userId.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(availability.startDate)}
                          </div>
                          <div className="text-sm text-gray-500">
                            to {formatDate(availability.endDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
                            {availability.durationDays} days
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {availability.reason || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full ${getStatusBadgeColor(availability.status)}`}>
                            {availability.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDelete(availability._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
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
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Mark Absence Period</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (Optional)
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="e.g., Business trip, Vacation, Family visit..."
                />
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Minimum 7 days required for expense calculations
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Save Absence
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
