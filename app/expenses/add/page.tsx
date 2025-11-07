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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {currentUser && <Header user={currentUser} />}
      <NavigationMenu />
      <div className="flex-grow max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => router.back()}
            className="text-purple-600 hover:text-purple-800 mb-3 sm:mb-4 flex items-center text-sm sm:text-base"
          >
            ← Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add New Expense</h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
            Record a new expense with optional receipt upload
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Amount and Currency */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="col-span-1 sm:col-span-2">
                <label htmlFor="amount" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
                  placeholder="30.00"
                />
              </div>
              <div className="col-span-1">
                <label htmlFor="currency" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-2 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
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
              <label htmlFor="description" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
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
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
                placeholder="Groceries from Carrefour"
              />
            </div>

            {/* Category and Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label htmlFor="category" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
                >
                  <option value="groceries">Groceries</option>
                  <option value="food">Food</option>
                  <option value="utilities">Utilities</option>
                  <option value="household">Household</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="expenseDate" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Expense Date
                </label>
                <input
                  type="date"
                  id="expenseDate"
                  name="expenseDate"
                  value={formData.expenseDate}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
                />
              </div>
            </div>

            {/* Available Members Info */}
            {loadingAvailability ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  <p className="text-xs sm:text-sm text-blue-800">Checking member availability...</p>
                </div>
              </div>
            ) : availableUsers.length > 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                <h4 className="text-xs sm:text-sm font-semibold text-green-900 mb-2">
                  Available Members on {new Date(formData.expenseDate).toLocaleDateString()} ({availableUsers.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {availableUsers.map((user) => (
                    <span
                      key={user._id || user.id}
                      className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                    >
                      {user.name}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-green-700 mt-2">
                  ℹ️ Only these members will be included if you split this expense (members away for 7+ days are excluded)
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-yellow-800">
                  ⚠️ No members are available on this date. All members may be marked as away.
                </p>
              </div>
            )}

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                maxLength={1000}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
                placeholder="Additional notes about this expense..."
              />
            </div>

            {/* Receipt Upload */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Receipt (Optional)
              </label>

              {receiptFile ? (
                <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
                  {/* Preview Section */}
                  <div className="mb-4">
                    {receiptFileType === 'image' && receiptPreview ? (
                      <div className="relative">
                        <img
                          src={receiptPreview}
                          alt="Receipt preview"
                          className="w-full max-h-64 sm:max-h-96 object-contain rounded-lg bg-white"
                        />
                      </div>
                    ) : receiptFileType === 'pdf' && receiptPreview ? (
                      <div className="bg-white rounded-lg p-4 sm:p-6">
                        <div className="flex items-center justify-center flex-col gap-3">
                          <svg className="w-16 h-16 sm:w-20 sm:h-20 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          <div className="text-center">
                            <p className="text-sm sm:text-base font-semibold text-gray-900 break-all">{receiptFile.name}</p>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">PDF Document</p>
                            <p className="text-xs text-gray-500 mt-1">{(receiptFile.size / 1024).toFixed(2)} KB</p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* File Info & Actions */}
                  <div className="flex items-center justify-between gap-2 bg-white rounded-lg p-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-xl sm:text-2xl">
                        {receiptFileType === 'pdf' ? '📄' : '🖼️'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {receiptFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(receiptFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeReceipt}
                      className="flex-shrink-0 px-3 py-1.5 text-xs sm:text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex justify-center px-4 sm:px-6 pt-4 sm:pt-5 pb-4 sm:pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-xs sm:text-sm text-gray-600 justify-center">
                      <label
                        htmlFor="receipt-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none"
                      >
                        <span>Upload a file</span>
                        <input
                          id="receipt-upload"
                          name="receipt-upload"
                          type="file"
                          className="sr-only"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1 hidden sm:inline">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Images (PNG, JPG, GIF, WebP) or PDF up to 5MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Expense'}
              </button>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
