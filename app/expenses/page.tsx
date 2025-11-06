'use client';

import { useState, useEffect } from 'react';
import { expenseAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NavigationMenu from '@/components/NavigationMenu';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface SplitBetween {
  user: User;
  amount: number;
  paid: boolean;
  paidAt?: string;
  _id: string;
}

interface Expense {
  _id: string;
  amount: number;
  currency: string;
  description: string;
  category: string;
  paidBy: User;
  expenseDate: string;
  receipt?: {
    filename: string;
    originalName: string;
    path: string;
  };
  receiptUrl?: string;
  splitBetween: SplitBetween[];
  totalSplitAmount: number;
  status: string;
  notes?: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  overall: {
    totalExpenses: number;
    totalAmount: number;
    avgAmount: number;
    maxAmount: number;
    minAmount: number;
  };
  byCategory: Array<{
    _id: string;
    count: number;
    total: number;
  }>;
}

export default function ExpensesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({
    category: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [balances, setBalances] = useState<{ [key: string]: { name: string; balance: number } }>({});

  // Get user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
    fetchStats();
  }, [filter]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = {
        ...filter,
        sortBy: 'expenseDate',
        sortOrder: 'desc',
      };
      const response = await expenseAPI.getAll(params);
      const fetchedExpenses = response.data.data.expenses;
      setExpenses(fetchedExpenses);
      calculateBalances(fetchedExpenses);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const calculateBalances = (expenses: Expense[]) => {
    const userBalances: { [key: string]: { name: string; balance: number } } = {};

    expenses.forEach((expense) => {
      const paidById = expense.paidBy._id;
      const paidByName = expense.paidBy.name;

      // Initialize if not exists
      if (!userBalances[paidById]) {
        userBalances[paidById] = { name: paidByName, balance: 0 };
      }

      // User who paid gets positive balance
      userBalances[paidById].balance += expense.amount;

      // If there are splits, deduct the split amounts
      if (expense.splitBetween && expense.splitBetween.length > 0) {
        expense.splitBetween.forEach((split) => {
          const splitUserId = split.user._id;
          const splitUserName = split.user.name;

          if (!userBalances[splitUserId]) {
            userBalances[splitUserId] = { name: splitUserName, balance: 0 };
          }

          // User who owes gets negative balance
          userBalances[splitUserId].balance -= split.amount;
        });
      } else {
        // If no splits defined, assume equal split among all users in the system
        // For now, just the person who paid owns the full amount
      }
    });

    setBalances(userBalances);
  };

  const exportToExcel = () => {
    // Prepare data for export
    const exportData = expenses.map((expense) => ({
      Date: formatDate(expense.expenseDate),
      Description: expense.description,
      Category: expense.category,
      'Paid By': expense.paidBy.name,
      Amount: expense.amount,
      Currency: expense.currency,
      Status: expense.status.replace('_', ' '),
      Notes: expense.notes || '',
    }));

    // Convert to CSV
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...exportData.map((row) =>
        headers.map((header) => `"${row[header as keyof typeof row]}"`).join(',')
      ),
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchStats = async () => {
    try {
      const params = {
        startDate: filter.startDate,
        endDate: filter.endDate,
      };
      const response = await expenseAPI.getStats(params);
      setStats(response.data.data);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleDelete = async () => {
    if (!expenseToDelete) return;

    try {
      await expenseAPI.delete(expenseToDelete);
      setExpenses(expenses.filter(e => e._id !== expenseToDelete));
      setDeleteModalOpen(false);
      setExpenseToDelete(null);
      fetchStats(); // Refresh stats after deletion
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  const openDeleteModal = (expenseId: string) => {
    setExpenseToDelete(expenseId);
    setDeleteModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: { [key: string]: string } = {
      groceries: 'bg-green-100 text-green-800',
      food: 'bg-orange-100 text-orange-800',
      utilities: 'bg-blue-100 text-blue-800',
      household: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.other;
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      partially_paid: 'bg-blue-100 text-blue-800',
      fully_paid: 'bg-green-100 text-green-800',
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {user && <Header user={user} />}
      <NavigationMenu />
      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Expenses</h1>
              <p className="mt-2 text-sm text-gray-600">
                View all flatmate expenses - track who spent what
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportToExcel}
                disabled={expenses.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export to Excel
              </button>
              <button
                onClick={() => router.push('/expenses/add')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                + Add Expense
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Total Expenses</div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.overall.totalExpenses}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Total Amount</div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.overall.totalAmount.toFixed(2)} AED
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Average</div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.overall.avgAmount ? stats.overall.avgAmount.toFixed(2) : '0.00'} AED
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Highest</div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.overall.maxAmount ? stats.overall.maxAmount.toFixed(2) : '0.00'} AED
              </div>
            </div>
          </div>
        )}

        {/* Balance/Settlement Section */}
        {Object.keys(balances).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Balance & Settlements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(balances).map(([userId, data]) => (
                <div
                  key={userId}
                  className={`p-4 rounded-lg border-2 ${
                    data.balance > 0
                      ? 'bg-green-50 border-green-200'
                      : data.balance < 0
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-900">{data.name}</div>
                      <div className="text-sm text-gray-600">
                        {data.balance > 0 ? 'Gets back' : data.balance < 0 ? 'Owes' : 'Settled'}
                      </div>
                    </div>
                    <div
                      className={`text-xl font-bold ${
                        data.balance > 0
                          ? 'text-green-700'
                          : data.balance < 0
                          ? 'text-red-700'
                          : 'text-gray-700'
                      }`}
                    >
                      {Math.abs(data.balance).toFixed(2)} AED
                    </div>
                  </div>
                  {user && userId === user._id && (
                    <div className="mt-2 text-xs font-medium text-purple-600">You</div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>How to settle:</strong> People who "Owe" money should pay the people who "Get back" money.
                The amounts shown are net balances based on who paid for expenses.
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filter.category}
                onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="">All Categories</option>
                <option value="groceries">Groceries</option>
                <option value="food">Food</option>
                <option value="utilities">Utilities</option>
                <option value="household">Household</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="fully_paid">Fully Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Expenses List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading expenses...</div>
          ) : expenses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No expenses found. Start by adding your first expense!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receipt
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(expense.expenseDate)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{expense.description}</div>
                        {expense.notes && (
                          <div className="text-xs text-gray-500 mt-1">{expense.notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryBadgeColor(expense.category)}`}>
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.paidBy.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {expense.amount.toFixed(2)} {expense.currency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(expense.status)}`}>
                          {expense.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {expense.receipt && expense.receiptUrl ? (
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${expense.receiptUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-800"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-gray-400">No receipt</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => router.push(`/expenses/${expense._id}`)}
                          className="text-purple-600 hover:text-purple-900 mr-3"
                        >
                          View
                        </button>
                        <button
                          onClick={() => router.push(`/expenses/edit/${expense._id}`)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(expense._id)}
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

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Expense
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this expense? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setExpenseToDelete(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
