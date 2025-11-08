'use client';

import { useState, useEffect } from 'react';
import { expenseAPI, authAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NavigationMenu from '@/components/NavigationMenu';

interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
}

export default function AddExpensePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    currency: 'AED',
    description: '',
    category: 'other',
    expenseDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptFileType, setReceiptFileType] = useState<'image' | 'pdf' | null>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (formData.expenseDate) {
      fetchAvailableUsers();
    }
  }, [formData.expenseDate]);

  const fetchCurrentUser = async () => {
    try {
      const response = await authAPI.getMe();
      setCurrentUser(response.data.data.user);
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      setLoadingAvailability(true);
      const response = await expenseAPI.getAvailableUsers(formData.expenseDate);
      setAvailableUsers(response.data.data.availableUsers || []);
    } catch (err) {
      console.error('Failed to fetch available users:', err);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      // Validate file type - only images and PDFs
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('File type must be JPEG, PNG, GIF, WebP, or PDF');
        return;
      }

      setReceiptFile(file);
      setError('');

      // Create preview for images
      if (file.type.startsWith('image/')) {
        setReceiptFileType('image');
        const reader = new FileReader();
        reader.onloadend = () => {
          setReceiptPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        setReceiptFileType('pdf');
        const reader = new FileReader();
        reader.onloadend = () => {
          setReceiptPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setReceiptFileType(null);
        setReceiptPreview(null);
      }
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setReceiptFileType(null);
    // Reset the file input
    const fileInput = document.getElementById('receipt-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.amount || !formData.description) {
        setError('Amount and description are required');
        setLoading(false);
        return;
      }

      if (parseFloat(formData.amount) <= 0) {
        setError('Amount must be greater than 0');
        setLoading(false);
        return;
      }

      // Create FormData
      const data = new FormData();
      data.append('amount', formData.amount);
      data.append('currency', formData.currency);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('expenseDate', formData.expenseDate);
      if (formData.notes) {
        data.append('notes', formData.notes);
      }
      if (receiptFile) {
        data.append('receipt', receiptFile);
      }

      await expenseAPI.create(data);
      setSuccess('Expense created successfully!');

      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push('/expenses');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create expense');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 flex flex-col">
      {currentUser && <Header user={currentUser} />}
      <NavigationMenu />
      <div className="flex-grow w-full px-6 lg:px-12 xl:px-16 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="group inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4 transition-all duration-200 hover:gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back</span>
            </button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 bg-clip-text text-transparent">
                  Add New Expense
                </h1>
                <p className="mt-1 text-sm text-gray-600 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Record a new expense with optional receipt upload
                </p>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg shadow-sm animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-lg shadow-sm animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-blue-600 px-6 py-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Expense Details
              </h2>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-5">
                {/* Amount and Currency */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="amount"
                        name="amount"
                        step="0.01"
                        min="0"
                        value={formData.amount}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-4 pr-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50 text-gray-900 transition-all duration-200 hover:border-gray-300"
                        placeholder="30.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="currency" className="block text-sm font-semibold text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      id="currency"
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50 text-gray-900 font-semibold transition-all duration-200 hover:border-gray-300"
                    >
                      <option value="AED">AED</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="INR">INR</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    maxLength={500}
                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50 text-gray-900 transition-all duration-200 hover:border-gray-300"
                    placeholder="e.g., Groceries from Carrefour"
                  />
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50 text-gray-900 transition-all duration-200 hover:border-gray-300"
                  >
                    <option value="groceries">🛒 Groceries</option>
                    <option value="food">🍔 Food & Dining</option>
                    <option value="utilities">💡 Utilities</option>
                    <option value="household">🏠 Household</option>
                    <option value="other">📌 Other</option>
                  </select>
                </div>

                {/* Expense Date */}
                <div>
                  <label htmlFor="expenseDate" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Expense Date
                  </label>
                  <input
                    type="date"
                    id="expenseDate"
                    name="expenseDate"
                    value={formData.expenseDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50 text-gray-900 transition-all duration-200 hover:border-gray-300"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    maxLength={1000}
                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50 text-gray-900 transition-all duration-200 hover:border-gray-300 resize-none"
                    placeholder="Add any additional details about this expense..."
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-5">
                {/* Available Members Info */}
                {loadingAvailability ? (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-3 border-blue-600 border-t-transparent"></div>
                      <p className="text-sm font-medium text-blue-800">Checking member availability...</p>
                    </div>
                  </div>
                ) : availableUsers.length > 0 ? (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      <h4 className="text-sm font-bold text-green-900">
                        Available Members ({availableUsers.length})
                      </h4>
                    </div>
                    <p className="text-xs text-green-700 mb-3">
                      On {new Date(formData.expenseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {availableUsers.map((user) => (
                        <div
                          key={user._id || user.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-green-200 text-green-800 text-xs font-semibold rounded-full shadow-sm"
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          {user.name}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-start gap-2 bg-green-100/50 rounded-lg p-2">
                      <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs text-green-800 leading-relaxed">
                        Only these members will be included if you split this expense. Members away for 7+ days are excluded.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-yellow-900 mb-1">No Available Members</p>
                        <p className="text-xs text-yellow-800">All members may be marked as away on this date.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Receipt Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    Receipt Upload (Optional)
                  </label>

                  {receiptFile ? (
                    <div className="border-2 border-purple-300 rounded-xl p-4 bg-gradient-to-br from-purple-50 to-blue-50 shadow-sm">
                      {/* Preview Section */}
                      <div className="mb-3">
                        {receiptFileType === 'image' && receiptPreview ? (
                          <div className="relative group">
                            <img
                              src={receiptPreview}
                              alt="Receipt preview"
                              className="w-full max-h-48 object-contain rounded-lg bg-white shadow-md border-2 border-purple-200"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg"></div>
                          </div>
                        ) : receiptFileType === 'pdf' && receiptPreview ? (
                          <div className="bg-white rounded-xl p-4 shadow-md border-2 border-purple-200">
                            <div className="flex items-center justify-center flex-col gap-3">
                              <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
                                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="text-center">
                                <p className="text-xs font-bold text-gray-900 break-all">{receiptFile.name}</p>
                                <p className="text-xs text-gray-600 mt-1 font-medium">PDF Document</p>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {/* File Info & Actions */}
                      <div className="flex items-center justify-between gap-2 bg-white rounded-lg p-3 shadow-sm border border-purple-100">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-2xl">
                            {receiptFileType === 'pdf' ? '📄' : '🖼️'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-gray-900 truncate">
                              {receiptFile.name}
                            </p>
                            <p className="text-xs text-gray-500 font-medium">
                              {(receiptFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeReceipt}
                          className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 border border-red-200 transition-all duration-200 hover:shadow-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative group">
                      <div className="flex justify-center px-6 pt-6 pb-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 bg-gradient-to-br from-gray-50 to-purple-50/30 transition-all duration-200 group-hover:shadow-md">
                        <div className="space-y-2 text-center">
                          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                            <svg
                              className="w-8 h-8 text-purple-600"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 48 48"
                            >
                              <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <div className="text-sm text-gray-600">
                            <label
                              htmlFor="receipt-upload"
                              className="relative cursor-pointer font-semibold text-purple-600 hover:text-purple-700 transition-colors"
                            >
                              <span>Click to upload</span>
                              <input
                                id="receipt-upload"
                                name="receipt-upload"
                                type="file"
                                className="sr-only"
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf"
                                onChange={handleFileChange}
                              />
                            </label>
                            <span className="text-gray-500"> or drag and drop</span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium">
                            PNG, JPG, GIF, WebP, PDF • Max 5MB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-6 mt-4 border-t-2 border-gray-100 px-6 pb-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="group px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 hover:shadow-md border border-gray-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="group px-8 py-2.5 text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Create Expense
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
