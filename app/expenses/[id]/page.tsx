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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {currentUser && <Header user={currentUser} />}
        <NavigationMenu />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-gray-500">Loading expense details...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {currentUser && <Header user={currentUser} />}
        <NavigationMenu />
        <div className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            {error || 'Expense not found'}
          </div>
          <button
            onClick={() => router.push('/expenses')}
            className="mt-4 text-purple-600 hover:text-purple-800"
          >
            ← Back to Expenses
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {currentUser && <Header user={currentUser} />}
      <NavigationMenu />
      <div className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/expenses')}
            className="text-purple-600 hover:text-purple-800 mb-4 flex items-center"
          >
            ← Back to Expenses
          </button>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 break-words">{expense.description}</h1>
              <p className="mt-2 text-xs sm:text-sm text-gray-600">
                Created by {expense.createdBy.name} on {formatDateTime(expense.createdAt)}
              </p>
            </div>
            {canModify && (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => router.push(`/expenses/edit/${expense._id}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Details Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Amount</label>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                AED {expense.amount.toFixed(2)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeColor(expense.status)}`}>
                  {expense.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Category</label>
              <div className="mt-1">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getCategoryBadgeColor(expense.category)}`}>
                  {expense.category}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Expense Date</label>
              <div className="mt-1 text-lg text-gray-900">
                {formatDate(expense.expenseDate)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Paid By</label>
              <div className="mt-1 text-lg text-gray-900">
                {expense.paidBy.name}
              </div>
              <div className="text-sm text-gray-500">{expense.paidBy.email}</div>
            </div>
          </div>

          {expense.notes && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-500">Notes</label>
              <div className="mt-2 text-gray-900">{expense.notes}</div>
            </div>
          )}
        </div>

        {/* Receipt Card */}
        {expense.receipt && expense.receiptUrl && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Receipt</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">
                  📄 {expense.receipt.originalName}
                </div>
              </div>
              <button
                onClick={() => setShowReceiptModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                View Receipt
              </button>
            </div>
          </div>
        )}

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

        {/* Split Details Card */}
        {expense.splitBetween && expense.splitBetween.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Split Details</h2>
            <div className="space-y-3">
              {expense.splitBetween.map((split) => (
                <div
                  key={split._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">{split.user.name}</div>
                    <div className="text-sm text-gray-500">{split.user.email}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        AED {split.amount.toFixed(2)}
                      </div>
                      {split.paid && split.paidAt && (
                        <div className="text-xs text-green-600">
                          Paid on {formatDate(split.paidAt)}
                        </div>
                      )}
                    </div>
                    <div>
                      {split.paid ? (
                        <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Paid
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-3 mt-3 border-t border-gray-200">
                <div className="flex justify-between text-lg font-semibold text-gray-900">
                  <span>Total Split Amount</span>
                  <span>AED {expense.totalSplitAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Metadata Card */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Created:</span>
              <span className="ml-2 text-gray-900">{formatDateTime(expense.createdAt)}</span>
            </div>
            <div>
              <span className="text-gray-500">Last Updated:</span>
              <span className="ml-2 text-gray-900">{formatDateTime(expense.updatedAt)}</span>
            </div>
          </div>
        </div>

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
                    <p className="text-sm text-gray-600">AED {expense.amount.toFixed(2)}</p>
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
      </div>
      <Footer />
    </div>
  );
}
