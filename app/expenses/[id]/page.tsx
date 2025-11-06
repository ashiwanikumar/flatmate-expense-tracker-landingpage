'use client';

import { useState, useEffect } from 'react';
import { expenseAPI } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';

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

export default function ExpenseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const expenseId = params.id as string;

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading expense details...</div>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/expenses')}
            className="text-purple-600 hover:text-purple-800 mb-4 flex items-center"
          >
            ← Back to Expenses
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{expense.description}</h1>
              <p className="mt-2 text-sm text-gray-600">
                Created by {expense.createdBy.name} on {formatDateTime(expense.createdAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/expenses/edit/${expense._id}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Main Details Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Amount</label>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {expense.amount.toFixed(2)} {expense.currency}
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
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${expense.receiptUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                View Receipt
              </a>
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
                        {split.amount.toFixed(2)} {expense.currency}
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
                  <span>{expense.totalSplitAmount.toFixed(2)} {expense.currency}</span>
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
      </div>
    </div>
  );
}
