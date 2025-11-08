'use client';

import { useState, useEffect } from 'react';
import { expenseAPI, authAPI } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
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
    s3Key?: string;
    originalName: string;
    s3Url?: string;
    mimetype?: string;
    size?: number;
    uploadedAt?: string;
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

export default function ExpenseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const expenseId = params.id as string;

  const [expense, setExpense] = useState<Expense | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (expenseId) {
      fetchExpense();
    }
  }, [expenseId]);

  const fetchExpense = async () => {
    try {
      setLoading(true);
      const response = await expenseAPI.getById(expenseId);
      setExpense(response.data.data.expense);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch expense');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const getReceiptImageUrl = () => {
    if (!expense?.receipt) return null;
    // Use S3 URL or fallback to receiptUrl
    return expense.receipt.s3Url || expense.receiptUrl;
  };

  const handleDelete = async () => {
    // Verify confirmation text
    if (deleteConfirmText.toUpperCase() !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    setDeleting(true);
    try {
      await expenseAPI.delete(expenseId);
      // Redirect to expenses list after successful delete
      router.push('/expenses');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete expense');
      setDeleting(false);
      setShowDeleteModal(false);
      setDeleteConfirmText('');
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
  };

  // Check if current user can edit/delete
  const canModify = currentUser && expense && (
    currentUser.role === 'admin' ||
    currentUser.role === 'super_admin' ||
    expense.createdBy._id === currentUser._id ||
    expense.createdBy._id === currentUser.id
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 flex flex-col">
        <Header user={currentUser} />
        <NavigationMenu />
        <div className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <div className="text-gray-600 font-medium">Loading expense details...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 flex flex-col">
        <Header user={currentUser} />
        <NavigationMenu />
        <div className="flex-grow w-full px-6 lg:px-12 xl:px-16 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-800 font-semibold">{error || 'Expense not found'}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/expenses')}
              className="mt-6 inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold transition-all duration-200 hover:gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Expenses
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 flex flex-col">
      <Header user={currentUser} />
      <NavigationMenu />
      <div className="flex-grow w-full px-6 lg:px-12 xl:px-16 py-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-4">
            <button
              onClick={() => router.push('/expenses')}
              className="group inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-3 transition-all duration-200 hover:gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to Expenses</span>
            </button>
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 bg-clip-text text-transparent break-words">
                  {expense.description}
                </h1>
                <p className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Created by <span className="font-semibold">{expense.createdBy.name}</span> on {formatDateTime(expense.createdAt)}
                </p>
              </div>
              {canModify && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => router.push(`/expenses/edit/${expense._id}`)}
                    className="group px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-5 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column - 2/3 width */}
            <div className="lg:col-span-2 space-y-4">
              {/* Main Details Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-blue-600 px-5 py-3">
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Expense Details
                  </h2>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                      <label className="text-xs font-semibold text-green-700 flex items-center gap-1 mb-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                        Amount
                      </label>
                      <div className="text-2xl font-bold text-green-900">
                        {expense.currency} {expense.amount.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-2 block">Status</label>
                      <span className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-xl ${getStatusBadgeColor(expense.status)}`}>
                        {expense.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-2 block">Category</label>
                      <span className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-xl ${getCategoryBadgeColor(expense.category)}`}>
                        {expense.category}
                      </span>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-2 block">Expense Date</label>
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(expense.expenseDate)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">Paid By</label>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {expense.paidBy.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{expense.paidBy.name}</div>
                        <div className="text-xs text-gray-500">{expense.paidBy.email}</div>
                      </div>
                    </div>
                  </div>

                  {expense.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <label className="text-xs font-semibold text-gray-600 mb-2 block">Notes</label>
                      <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{expense.notes}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Split Details Card */}
              {expense.splitBetween && expense.splitBetween.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-600 px-5 py-3">
                    <h2 className="text-base font-semibold text-white flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      Split Details
                    </h2>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {expense.splitBetween.map((split) => (
                        <div
                          key={split._id}
                          className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-purple-50/30 rounded-xl border border-gray-200"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {split.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-gray-900 text-sm truncate">{split.user.name}</div>
                              <div className="text-xs text-gray-500 truncate">{split.user.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                              <div className="font-bold text-gray-900 text-sm">
                                {expense.currency} {split.amount.toFixed(2)}
                              </div>
                              {split.paid && split.paidAt && (
                                <div className="text-xs text-green-600 font-medium">
                                  {formatDate(split.paidAt)}
                                </div>
                              )}
                            </div>
                            {split.paid ? (
                              <span className="px-2.5 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-lg border border-green-300">
                                Paid
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 text-xs font-bold bg-yellow-100 text-yellow-700 rounded-lg border border-yellow-300">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t-2 border-gray-200">
                      <div className="flex justify-between items-center bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-3">
                        <span className="font-bold text-gray-900">Total Split Amount</span>
                        <span className="text-xl font-bold text-purple-900">{expense.currency} {expense.totalSplitAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - 1/3 width */}
            <div className="space-y-4">
              {/* Receipt Card */}
              {expense.receipt && expense.receiptUrl && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-600 px-5 py-3">
                    <h2 className="text-base font-semibold text-white flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      Receipt
                    </h2>
                  </div>
                  <div className="p-4">
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-3 mb-3 border-2 border-purple-200">
                      <div className="text-sm text-gray-700 font-medium break-all flex items-center gap-2">
                        <span className="text-xl">📄</span>
                        {expense.receipt.originalName}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowReceiptModal(true)}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Receipt
                    </button>
                  </div>
                </div>
              )}

              {/* Metadata Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-5 py-3">
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Metadata
                  </h2>
                </div>
                <div className="p-4 space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-semibold text-gray-600 mb-1">Created</div>
                    <div className="text-sm text-gray-900 font-medium">{formatDateTime(expense.createdAt)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-semibold text-gray-600 mb-1">Last Updated</div>
                    <div className="text-sm text-gray-900 font-medium">{formatDateTime(expense.updatedAt)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Viewer Modal */}
      {showReceiptModal && expense.receipt && getReceiptImageUrl() && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
          <div className="relative max-w-5xl w-full">
            <button
              onClick={() => setShowReceiptModal(false)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-2 transition-all z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="bg-white rounded-lg overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Receipt: {expense.receipt.originalName}</h3>
              </div>
              <div className="p-4 flex items-center justify-center bg-gray-100">
                {expense.receipt.mimetype?.startsWith('image/') ? (
                  <img
                    src={getReceiptImageUrl()!}
                    alt="Receipt"
                    className="max-w-full max-h-[75vh] object-contain"
                  />
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-600 mb-4">PDF Document</p>
                    <a
                      href={getReceiptImageUrl()!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-block"
                    >
                      Open PDF in New Tab
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete Expense
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to delete this expense? This action cannot be undone.
                </p>
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm font-medium text-gray-900 break-words">{expense.description}</p>
                  <p className="text-sm text-gray-600">{expense.currency} {expense.amount.toFixed(2)}</p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type <span className="font-bold text-red-600">DELETE</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    disabled={deleting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    autoFocus
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    For security, you must type "DELETE" (case-insensitive) to proceed
                  </p>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleCloseDeleteModal}
                    disabled={deleting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting || deleteConfirmText.toUpperCase() !== 'DELETE'}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
