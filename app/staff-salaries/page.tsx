'use client';

import React, { useState, useEffect } from 'react';
import { staffSalaryAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import LayoutWrapper from '@/components/LayoutWrapper';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface SplitMember {
  user: User;
  shareAmount: number;
}

interface StaffSalary {
  _id: string;
  staffName: string;
  staffRole?: string;
  numberOfPersons: number;
  salaryAmount: number;
  month: number;
  year: number;
  status: 'pending' | 'paid';
  receipt?: string;
  notes?: string;
  splitAmongMembers: SplitMember[];
  createdBy: User;
  paidDate?: string;
  createdAt: string;
}

interface SalarySummary {
  totalSalaries: number;
  totalPaid: number;
  totalPending: number;
  currentMonthTotal: number;
}

interface SalaryTier {
  persons: number;
  amount: number;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function StaffSalariesPage() {
  const [salaries, setSalaries] = useState<StaffSalary[]>([]);
  const [summary, setSummary] = useState<SalarySummary | null>(null);
  const [salaryTiers, setSalaryTiers] = useState<SalaryTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<StaffSalary | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

  // Form state
  const [formData, setFormData] = useState({
    staffName: '',
    staffRole: '',
    numberOfPersons: 7,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    notes: '',
    receipt: null as File | null,
  });

  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchUserRole();
    fetchSalaryTiers();
    fetchSalaries();
    fetchSummary();
  }, [filterStatus, filterMonth, filterYear]);

  useEffect(() => {
    // Auto-calculate salary amount when number of persons changes
    if (formData.numberOfPersons > 0) {
      calculateSalaryAmount();
    }
  }, [formData.numberOfPersons]);

  const fetchUserRole = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.organizationRole || 'member');
  };

  const fetchSalaryTiers = async () => {
    try {
      const response = await staffSalaryAPI.getTiers();
      const tiers = Object.entries(response.data.data.tiers).map(([persons, amount]) => ({
        persons: parseInt(persons),
        amount: amount as number
      })).sort((a, b) => a.persons - b.persons);
      setSalaryTiers(tiers);
    } catch (error: any) {
      console.error('Error fetching salary tiers:', error);
    }
  };

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const params: any = {
        month: filterMonth,
        year: filterYear,
      };
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      const response = await staffSalaryAPI.getAll(params);
      setSalaries(response.data.data.salaries || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch staff salaries');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const params = {
        month: filterMonth,
        year: filterYear,
      };
      const response = await staffSalaryAPI.getSummary(params);
      setSummary(response.data.data);
    } catch (error: any) {
      console.error('Error fetching summary:', error);
    }
  };

  const calculateSalaryAmount = async () => {
    try {
      const response = await staffSalaryAPI.calculate({ numberOfPersons: formData.numberOfPersons });
      setCalculatedAmount(response.data.data.salaryAmount);
    } catch (error: any) {
      console.error('Error calculating salary:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.staffName.trim()) {
      toast.error('Please enter staff name');
      return;
    }

    if (formData.numberOfPersons < 1) {
      toast.error('Number of persons must be at least 1');
      return;
    }

    try {
      const data = new FormData();
      data.append('staffName', formData.staffName);
      if (formData.staffRole) data.append('staffRole', formData.staffRole);
      data.append('numberOfPersons', formData.numberOfPersons.toString());
      data.append('month', formData.month.toString());
      data.append('year', formData.year.toString());
      if (formData.notes) data.append('notes', formData.notes);
      if (formData.receipt) data.append('receipt', formData.receipt);

      await staffSalaryAPI.create(data);
      toast.success('Staff salary added successfully');
      setShowAddModal(false);
      resetForm();
      fetchSalaries();
      fetchSummary();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add staff salary');
    }
  };

  const handleMarkAsPaid = async (salaryId: string) => {
    if (!confirm('Are you sure you want to mark this salary as paid?')) return;

    try {
      await staffSalaryAPI.markAsPaid(salaryId);
      toast.success('Salary marked as paid');
      fetchSalaries();
      fetchSummary();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to mark salary as paid');
    }
  };

  const handleDelete = async (salaryId: string) => {
    if (!confirm('Are you sure you want to delete this salary entry?')) return;

    try {
      await staffSalaryAPI.delete(salaryId);
      toast.success('Salary entry deleted successfully');
      fetchSalaries();
      fetchSummary();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete salary entry');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

      if (!allowedTypes.includes(file.type)) {
        toast.error('Only image files (JPEG, PNG, GIF, WebP) and PDF are allowed');
        e.target.value = '';
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        e.target.value = '';
        return;
      }

      setFormData({ ...formData, receipt: file });
    }
  };

  const resetForm = () => {
    setFormData({
      staffName: '',
      staffRole: '',
      numberOfPersons: 7,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      notes: '',
      receipt: null,
    });
    setCalculatedAmount(null);
  };

  const canManageSalaries = ['owner', 'admin'].includes(userRole);

  return (
    <LayoutWrapper user={user}>
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Staff Salaries
          </h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">Manage monthly staff salary payments and splits</p>
        </div>

        {/* Summary Card */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 lg:p-6 border-l-4 border-purple-500">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Salaries</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600">{summary.totalSalaries || 0}</p>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 lg:p-6 border-l-4 border-green-500">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Paid</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">AED {(summary.totalPaid || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 lg:p-6 border-l-4 border-orange-500">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Pending</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600">AED {(summary.totalPending || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 lg:p-6 border-l-4 border-blue-500">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Current Month</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">AED {(summary.currentMonthTotal || 0).toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Salary Tiers Info */}
        {salaryTiers.length > 0 && (
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 text-white">
            <h3 className="text-base sm:text-lg font-semibold mb-3">Salary Tiers</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
              {salaryTiers.map((tier) => (
                <div key={tier.persons} className="bg-white/20 backdrop-blur-sm rounded-lg p-2 sm:p-3 text-center">
                  <p className="text-xs sm:text-sm opacity-90">{tier.persons} persons</p>
                  <p className="text-base sm:text-lg lg:text-xl font-bold">AED {tier.amount}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Add Button */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Month Filter */}
              <div className="flex-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Month</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {MONTHS.map((month, index) => (
                    <option key={index} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div className="flex-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Year</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(parseInt(e.target.value))}
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            {/* Add Button */}
            {canManageSalaries && (
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm sm:text-base bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg whitespace-nowrap"
              >
                + Add Salary
              </button>
            )}
          </div>
        </div>

        {/* Salaries List */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-6 sm:p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent"></div>
              <p className="mt-4 text-sm sm:text-base text-gray-600">Loading staff salaries...</p>
            </div>
          ) : salaries.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-gray-500">
              <p className="text-base sm:text-lg">No staff salaries found</p>
              <p className="text-xs sm:text-sm mt-2">Add your first staff salary entry to get started</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Staff Info</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Persons</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Receipt</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salaries.map((salary) => (
                      <React.Fragment key={salary._id}>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{salary.staffName}</p>
                              {salary.staffRole && (
                                <p className="text-sm text-gray-500">{salary.staffRole}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {MONTHS[salary.month - 1]} {salary.year}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {salary.numberOfPersons}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900">AED {(salary.salaryAmount || 0).toFixed(2)}</p>
                            <p className="text-xs text-gray-500">
                              AED {(salary.splitAmongMembers?.length ? (salary.salaryAmount / salary.splitAmongMembers.length) : 0).toFixed(2)}/person
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              salary.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {salary.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {salary.receipt ? (
                              <a
                                href={salary.receipt}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-600 hover:text-purple-800 underline"
                              >
                                View
                              </a>
                            ) : (
                              <span className="text-gray-400">No receipt</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm space-x-2">
                            <button
                              onClick={() => setSelectedSalary(selectedSalary?._id === salary._id ? null : salary)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {selectedSalary?._id === salary._id ? 'Hide' : 'View'} Split
                            </button>
                            {canManageSalaries && salary.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleMarkAsPaid(salary._id)}
                                  className="text-green-600 hover:text-green-800 font-medium"
                                >
                                  Mark Paid
                                </button>
                                <button
                                  onClick={() => handleDelete(salary._id)}
                                  className="text-red-600 hover:text-red-800 font-medium"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                        {selectedSalary?._id === salary._id && (
                          <tr>
                            <td colSpan={7} className="px-6 py-4 bg-gray-50">
                              <div className="space-y-2">
                                <h4 className="font-semibold text-gray-900 mb-3">Split Among Members:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {salary.splitAmongMembers?.map((split, index) => (
                                    <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                                      <p className="font-medium text-gray-900">{split.user?.name || 'Unknown'}</p>
                                      <p className="text-sm text-gray-500">{split.user?.email || ''}</p>
                                      <p className="text-lg font-semibold text-purple-600 mt-1">
                                        AED {(split.shareAmount || 0).toFixed(2)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                                {salary.notes && (
                                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-700">Notes:</p>
                                    <p className="text-sm text-gray-600">{salary.notes}</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200">
                {salaries.map((salary) => (
                  <div key={salary._id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{salary.staffName}</p>
                        {salary.staffRole && (
                          <p className="text-xs text-gray-500">{salary.staffRole}</p>
                        )}
                        <p className="text-xs text-gray-600 mt-1">
                          {MONTHS[salary.month - 1]} {salary.year} • {salary.numberOfPersons} persons
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        salary.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {salary.status}
                      </span>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 mb-3">
                      <p className="text-lg font-bold text-purple-600">AED {(salary.salaryAmount || 0).toFixed(2)}</p>
                      <p className="text-xs text-gray-600">
                        AED {(salary.splitAmongMembers?.length ? (salary.salaryAmount / salary.splitAmongMembers.length) : 0).toFixed(2)}/person
                      </p>
                    </div>
                    {salary.receipt && (
                      <div className="mb-3">
                        <a
                          href={salary.receipt}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-600 hover:text-purple-800 underline"
                        >
                          View Receipt
                        </a>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedSalary(selectedSalary?._id === salary._id ? null : salary)}
                        className="flex-1 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        {selectedSalary?._id === salary._id ? 'Hide' : 'View'} Split
                      </button>
                      {canManageSalaries && salary.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleMarkAsPaid(salary._id)}
                            className="flex-1 px-3 py-2 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() => handleDelete(salary._id)}
                            className="flex-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                    {selectedSalary?._id === salary._id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Split Among Members:</h4>
                        <div className="space-y-2">
                          {salary.splitAmongMembers?.map((split, index) => (
                            <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                              <p className="text-sm font-medium text-gray-900">{split.user?.name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{split.user?.email || ''}</p>
                              <p className="text-base font-semibold text-purple-600 mt-1">
                                AED {(split.shareAmount || 0).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                        {salary.notes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs font-medium text-gray-700">Notes:</p>
                            <p className="text-xs text-gray-600">{salary.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Add Salary Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-t-2xl">
                <h3 className="text-2xl font-bold">Add Staff Salary</h3>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Staff Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Staff Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.staffName}
                    onChange={(e) => setFormData({ ...formData, staffName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter staff name"
                    required
                  />
                </div>

                {/* Staff Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Staff Role</label>
                  <input
                    type="text"
                    value={formData.staffRole}
                    onChange={(e) => setFormData({ ...formData, staffRole: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Cook, Cleaner, Helper"
                  />
                </div>

                {/* Number of Persons */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Persons <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.numberOfPersons}
                    onChange={(e) => setFormData({ ...formData, numberOfPersons: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  {calculatedAmount !== null && (
                    <p className="mt-2 text-sm text-green-600 font-medium">
                      Calculated Salary: AED {calculatedAmount}
                    </p>
                  )}
                </div>

                {/* Month and Year */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Month <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      {MONTHS.map((month, index) => (
                        <option key={index} value={index + 1}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Receipt Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Receipt</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Accepted: Images (JPEG, PNG, GIF, WebP) or PDF. Max size: 10MB
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Additional notes..."
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg"
                  >
                    Add Salary
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
