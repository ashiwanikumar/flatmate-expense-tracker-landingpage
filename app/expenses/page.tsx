'use client';

import { useState, useEffect } from 'react';
import { expenseAPI, balanceAPI, userAvailabilityAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { toast } from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Balance {
  user: User;
  userId: string;
  availability: {
    totalDays: number;
    availableDays: number;
    unavailableDays: number;
  };
  totalPaid: number;
  totalOwed: number;
  totalAdvancePayments: number;
  totalStaffSalaryShare: number;
  netBalance: number;
  summary: {
    toReceive: number;
    toPay: number;
  };
  expenseDetails: any[];
  advancePaymentDetails: any[];
  staffSalaryDetails: any[];
}

interface MonthlyBalances {
  month: number;
  year: number;
  totalExpenses: number;
  settledAmount: number;
  pendingAmount: number;
  balances: Balance[];
}

interface Settlement {
  from: User;
  to: User;
  amount: number;
}

interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  paidBy: User;
  expenseDate: string;
  splitBetween: any[];
  receipt?: any;
}

export default function ExpensesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'settlements' | 'mybalance'>('overview');
  const [loading, setLoading] = useState(true);
  const [monthlyBalances, setMonthlyBalances] = useState<MonthlyBalances | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [myBalance, setMyBalance] = useState<Balance | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [availabilityStatus, setAvailabilityStatus] = useState<any[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user, currentMonth, currentYear]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchMonthlyBalances(),
        fetchSettlements(),
        fetchMyBalance(),
        fetchAvailabilityStatus(),
        fetchExpenses()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyBalances = async () => {
    try {
      const response = await balanceAPI.getMonthlyBalances(currentYear, currentMonth);
      setMonthlyBalances(response.data.data);
    } catch (error: any) {
      console.error('Error fetching balances:', error);
    }
  };

  const fetchSettlements = async () => {
    try {
      const response = await balanceAPI.getSettlements(currentYear, currentMonth);
      setSettlements(response.data.data.suggestions || []);
    } catch (error: any) {
      console.error('Error fetching settlements:', error);
    }
  };

  const fetchMyBalance = async () => {
    try {
      const response = await balanceAPI.getMyBalance(currentYear, currentMonth);
      setMyBalance(response.data.data.balance);
    } catch (error: any) {
      console.error('Error fetching my balance:', error);
    }
  };

  const fetchAvailabilityStatus = async () => {
    try {
      const response = await userAvailabilityAPI.getCurrentStatus();
      setAvailabilityStatus(response.data.data.users || []);
    } catch (error: any) {
      console.error('Error fetching availability status:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString();
      const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString();

      const response = await expenseAPI.getAll({
        startDate: startOfMonth,
        endDate: endOfMonth,
        sortBy: 'expenseDate',
        sortOrder: 'desc'
      });
      setExpenses(response.data.data.expenses || []);
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `AED ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    setLoading(true); // Show loading when changing months
    if (direction === 'prev') {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  if (loading) {
    return (
      <LayoutWrapper user={user}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper user={user}>
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header with Month Selector */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Expense Dashboard</h1>
            <button
              onClick={() => router.push('/expenses/add')}
              className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all self-start sm:self-auto whitespace-nowrap"
            >
              + Add Expense
            </button>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-2 sm:gap-4 bg-white rounded-lg p-3 sm:p-4 shadow-sm">
            <button
              onClick={() => changeMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 text-center">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                {getMonthName(currentMonth)} {currentYear}
              </h2>
            </div>
            <button
              onClick={() => changeMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {monthlyBalances && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-blue-500">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Expenses</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{formatCurrency(monthlyBalances.totalExpenses)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-green-500">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Settled Amount</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{formatCurrency(monthlyBalances.settledAmount)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-orange-500">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Pending Amount</p>
              <p className="text-2xl sm:text-3xl font-bold text-orange-600">{formatCurrency(monthlyBalances.pendingAmount)}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('settlements')}
                className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'settlements'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Settlements
              </button>
              <button
                onClick={() => setActiveTab('mybalance')}
                className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'mybalance'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Balance
              </button>
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && monthlyBalances && (
              <div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Member Balances</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {monthlyBalances.balances.map((balance) => (
                    <div
                      key={balance.user._id}
                      className={`rounded-lg p-4 sm:p-6 border-2 transition-all hover:shadow-md ${
                        balance.netBalance >= 0
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 truncate">{balance.user.name}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{balance.user.email}</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ml-2 ${balance.netBalance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      </div>

                      {/* Availability Info */}
                      {balance.availability.unavailableDays > 0 && (
                        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                          <p className="text-yellow-800">
                            Present: {balance.availability.availableDays}/{balance.availability.totalDays} days
                          </p>
                        </div>
                      )}

                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Paid:</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(balance.totalPaid)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Owes:</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(balance.totalOwed)}</span>
                        </div>
                        <div className="pt-2 border-t border-gray-300">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-900">Net Balance:</span>
                            <span className={`text-base sm:text-lg font-bold ${
                              balance.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {balance.netBalance >= 0 ? '+' : ''}{formatCurrency(balance.netBalance)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                        {balance.netBalance >= 0 ? (
                          <p className="text-xs sm:text-sm font-medium text-green-700">
                            To Receive: {formatCurrency(balance.summary.toReceive)}
                          </p>
                        ) : (
                          <p className="text-xs sm:text-sm font-medium text-red-700">
                            To Pay: {formatCurrency(balance.summary.toPay)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Expense List */}
                <div className="mt-6 sm:mt-8">
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-4">All Expenses This Month</h3>
                  {expenses.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="text-base sm:text-lg lg:text-xl font-medium text-gray-700 mb-2">No expenses yet</h4>
                      <p className="text-sm text-gray-600">Add your first expense for this month</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <div className="hidden md:block overflow-x-auto">
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
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Split
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {expenses.map((expense) => (
                              <tr key={expense._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {new Date(expense.expenseDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    expense.category === 'groceries' ? 'bg-green-100 text-green-800' :
                                    expense.category === 'household' ? 'bg-blue-100 text-blue-800' :
                                    expense.category === 'food' ? 'bg-orange-100 text-orange-800' :
                                    expense.category === 'utilities' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {expense.category}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{expense.paidBy.name}</div>
                                  <div className="text-xs text-gray-500">{expense.paidBy.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                  {formatCurrency(expense.amount)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                                  {expense.splitBetween.length} members
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                  <button
                                    onClick={() => router.push(`/expenses/${expense._id}`)}
                                    className="text-purple-600 hover:text-purple-900 font-medium"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden divide-y divide-gray-200">
                        {expenses.map((expense) => (
                          <div key={expense._id} className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900">{expense.description}</p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {new Date(expense.expenseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                expense.category === 'groceries' ? 'bg-green-100 text-green-800' :
                                expense.category === 'household' ? 'bg-blue-100 text-blue-800' :
                                expense.category === 'food' ? 'bg-orange-100 text-orange-800' :
                                expense.category === 'utilities' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {expense.category}
                              </span>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-gray-600">Amount:</span>
                                <span className="text-lg font-bold text-gray-900">{formatCurrency(expense.amount)}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-600">Paid by:</span>
                                <span className="font-medium text-gray-900">{expense.paidBy.name}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs mt-1">
                                <span className="text-gray-600">Split:</span>
                                <span className="text-gray-900">{expense.splitBetween.length} members</span>
                              </div>
                            </div>
                            <button
                              onClick={() => router.push(`/expenses/${expense._id}`)}
                              className="w-full px-3 py-2 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <button
                    onClick={() => router.push('/user-availability')}
                    className="p-3 sm:p-4 text-sm sm:text-base bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Manage Availability
                  </button>
                  <button
                    onClick={() => router.push('/expenses/add')}
                    className="p-3 sm:p-4 text-sm sm:text-base bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Add New Expense
                  </button>
                </div>
              </div>
            )}

            {/* Settlements Tab */}
            {activeTab === 'settlements' && (
              <div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Settlement Suggestions</h3>
                {settlements.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="text-base sm:text-lg lg:text-xl font-bold text-green-800 mb-2">All Settled!</h4>
                    <p className="text-sm text-green-700">No pending settlements for this month.</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {settlements.map((settlement, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 sm:p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow gap-4"
                      >
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-base sm:text-lg font-semibold text-red-700">{settlement.from.name.charAt(0)}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{settlement.from.name}</p>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">{settlement.from.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-center gap-2 my-2 sm:my-0">
                            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                            <div className="px-3 sm:px-4 py-2 bg-purple-100 rounded-lg">
                              <p className="text-base sm:text-lg lg:text-xl font-bold text-purple-900">{formatCurrency(settlement.amount)}</p>
                            </div>
                            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-base sm:text-lg font-semibold text-green-700">{settlement.to.name.charAt(0)}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{settlement.to.name}</p>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">{settlement.to.email}</p>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => toast.success('Payment tracking feature coming soon!')}
                          className="w-full sm:w-auto sm:ml-4 px-4 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          Mark as Paid
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm sm:text-base font-semibold text-blue-900 mb-2">Pro Tip</h4>
                  <p className="text-xs sm:text-sm text-blue-800">
                    These settlements minimize the number of transactions needed to balance everyone's accounts.
                    Simply follow the suggestions above to settle all debts efficiently!
                  </p>
                </div>
              </div>
            )}

            {/* My Balance Tab */}
            {activeTab === 'mybalance' && myBalance && (
              <div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Your Balance for {getMonthName(currentMonth)}</h3>

                {/* Availability Card */}
                <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Your Availability</h4>
                    <button
                      onClick={() => router.push('/user-availability')}
                      className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Manage →
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="text-center">
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{myBalance.availability.availableDays}</p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">Available Days</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600">{myBalance.availability.unavailableDays}</p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">Away Days</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">{myBalance.availability.totalDays}</p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">Total Days</p>
                    </div>
                  </div>
                  {myBalance.availability.unavailableDays > 0 && (
                    <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                      <p className="text-xs sm:text-sm text-yellow-800">
                        Your grocery/household expenses are prorated based on {myBalance.availability.availableDays} days present
                      </p>
                    </div>
                  )}
                </div>

                {/* Balance Summary */}
                <div className={`p-4 sm:p-6 lg:p-8 rounded-lg mb-4 sm:mb-6 ${
                  myBalance.netBalance >= 0 ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'
                }`}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
                    <div className="text-center">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">You Paid</p>
                      <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">{formatCurrency(myBalance.totalPaid)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">You Owe</p>
                      <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">{formatCurrency(myBalance.totalOwed)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Advance Paid</p>
                      <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-blue-600">+{formatCurrency(myBalance.totalAdvancePayments || 0)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Staff Salary</p>
                      <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-orange-600">-{formatCurrency(myBalance.totalStaffSalaryShare || 0)}</p>
                    </div>
                    <div className="text-center col-span-2 sm:col-span-3 lg:col-span-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Net Balance</p>
                      <p className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${myBalance.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {myBalance.netBalance >= 0 ? '+' : ''}{formatCurrency(myBalance.netBalance)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 sm:pt-6 border-t-2 border-gray-300">
                    {myBalance.netBalance >= 0 ? (
                      <div className="text-center">
                        <p className="text-base sm:text-lg lg:text-2xl font-bold text-green-700 mb-2">
                          Others owe you {formatCurrency(myBalance.summary.toReceive)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">You'll receive this amount from your flatmates</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-base sm:text-lg lg:text-2xl font-bold text-red-700 mb-2">
                          You need to pay {formatCurrency(myBalance.summary.toPay)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">Check Settlements tab to see who to pay</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Advance Payments Section */}
                {myBalance.advancePaymentDetails && myBalance.advancePaymentDetails.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
                    <div className="p-4 bg-blue-50 border-b border-blue-200 flex justify-between items-center">
                      <h4 className="font-semibold text-gray-900">Your Advance Payments</h4>
                      <span className="text-sm font-medium text-blue-600">
                        Total: {formatCurrency(myBalance.totalAdvancePayments || 0)}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {myBalance.advancePaymentDetails.map((payment: any, index: number) => (
                        <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{payment.description || 'Advance Payment'}</p>
                              <p className="text-sm text-gray-600">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-blue-600">{formatCurrency(payment.amount)}</p>
                              <span className="text-xs text-gray-500">Reduces your balance</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Staff Salary Share Section */}
                {myBalance.staffSalaryDetails && myBalance.staffSalaryDetails.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
                    <div className="p-4 bg-orange-50 border-b border-orange-200 flex justify-between items-center">
                      <h4 className="font-semibold text-gray-900">Your Staff Salary Share</h4>
                      <span className="text-sm font-medium text-orange-600">
                        Total: {formatCurrency(myBalance.totalStaffSalaryShare || 0)}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {myBalance.staffSalaryDetails.map((salary: any, index: number) => (
                        <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-gray-900">{salary.staffName}</p>
                                {salary.staffRole && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                    {salary.staffRole}
                                  </span>
                                )}
                                <span className={`px-2 py-1 text-xs font-medium rounded ${
                                  salary.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {salary.status}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                Total: {formatCurrency(salary.totalAmount)} • Your share: {formatCurrency(salary.shareAmount)}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-orange-600">{formatCurrency(salary.shareAmount)}</p>
                              <span className="text-xs text-gray-500">Adds to your balance</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expense Breakdown */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">Expense Breakdown</h4>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {myBalance.expenseDetails.length === 0 ? (
                      <div className="p-8 text-center text-gray-600">
                        No expenses for this month
                      </div>
                    ) : (
                      myBalance.expenseDetails.map((expense, index) => (
                        <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-gray-900">{expense.description}</p>
                                {expense.isProrated && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                                    Prorated
                                  </span>
                                )}
                                {expense.isPaid && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                    Paid
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>{new Date(expense.expenseDate).toLocaleDateString()}</span>
                                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{expense.category}</span>
                                <span>Paid by: {expense.paidBy}</span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              {expense.isProrated ? (
                                <div>
                                  <p className="text-sm text-gray-500 line-through">{formatCurrency(expense.originalShare)}</p>
                                  <p className="text-lg font-bold text-purple-600">{formatCurrency(expense.proratedShare)}</p>
                                </div>
                              ) : (
                                <p className="text-lg font-bold text-gray-900">{formatCurrency(expense.originalShare)}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
