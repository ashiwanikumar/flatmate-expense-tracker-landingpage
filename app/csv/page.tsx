'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import { csvAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Footer from '@/components/Footer';
import LoadingModal from '@/components/LoadingModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

export default function CSVPage() {
  const router = useRouter();
  const [csvFiles, setCsvFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [tag, setTag] = useState('');
  const [viewModal, setViewModal] = useState<{ open: boolean; data: any | null }>({
    open: false,
    data: null,
  });
  const [loadingData, setLoadingData] = useState(false);
  const [resetModal, setResetModal] = useState<{ open: boolean; fileId: string | null }>({
    open: false,
    fileId: null,
  });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; fileId: string | null; fileName: string }>({
    open: false,
    fileId: null,
    fileName: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchCsvFiles();
  }, []);

  const fetchCsvFiles = async () => {
    try {
      const response = await csvAPI.getAll();
      setCsvFiles(response.data.data);
    } catch (error: any) {
      console.error('Error fetching CSV files:', error);
      toast.error('Failed to load CSV files');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    console.log('Starting CSV upload:', file.name, 'Size:', file.size, 'bytes');
    setUploading(true);

    try {
      console.log('Uploading file to backend...');
      await csvAPI.upload(file, tag || undefined);
      console.log('Upload successful!');
      toast.success('File uploaded successfully!');
      fetchCsvFiles();
      setTag('');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
    maxSize: 31457280, // 30MB
  });

  const handleDelete = async () => {
    if (!deleteModal.fileId) return;

    try {
      await csvAPI.delete(deleteModal.fileId);
      toast.success('File deleted successfully');
      setDeleteModal({ open: false, fileId: null });
      fetchCsvFiles();
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  const handleReset = async () => {
    if (!resetModal.fileId) return;

    try {
      await csvAPI.reset(resetModal.fileId);
      toast.success('Progress reset successfully');
      setResetModal({ open: false, fileId: null });
      fetchCsvFiles();
    } catch (error) {
      toast.error('Failed to reset progress');
    }
  };

  const handleView = async (id: string) => {
    setLoadingData(true);
    try {
      const response = await csvAPI.getData(id);
      setViewModal({ open: true, data: response.data.data });
    } catch (error: any) {
      console.error('Error fetching CSV data:', error);
      toast.error('Failed to load CSV data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgb(12, 190, 225)', boxShadow: 'rgb(12, 190, 225) 0px 0px 4px 0px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-4">
              <img src="/img/logo/netraga_logo.png" alt="Netraga Logo" className="h-10 w-10 sm:h-12 sm:w-12" />
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Campaign Manager
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b overflow-x-auto">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 sm:space-x-8 min-w-max sm:min-w-0">
            <Link
              href="/dashboard"
              className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Home</span>
            </Link>
            <Link
              href="/csv"
              className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-purple-600 border-b-2 border-purple-600 whitespace-nowrap"
            >
              CSV Files
            </Link>
            <Link
              href="/campaigns"
              className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
            >
              Campaigns
            </Link>
            <Link
              href="/company-accounts"
              className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Company Accounts</span>
              <span className="sm:hidden">Accounts</span>
            </Link>
            <Link
              href="/calendar"
              className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
            >
              Calendar
            </Link>
            <Link
              href="/activity-logs"
              className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
            >
              <span className="flex items-center gap-1 sm:gap-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Activity Logs</span>
                <span className="sm:hidden">Logs</span>
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Upload Area */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Upload CSV File</h2>

          {/* Tag Input (Optional) */}
          <div className="mb-4 sm:mb-6">
            <label htmlFor="tag" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Tag (Optional)
            </label>
            <input
              type="text"
              id="tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g., test, production, client-name"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
            />
            <p className="mt-1 text-xs sm:text-sm text-gray-500">Add a tag to categorize this CSV file for your reference</p>
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 sm:p-12 text-center cursor-pointer transition ${
              isDragActive
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-300 hover:border-purple-400 bg-white'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} disabled={uploading} />
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-center">
                <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              {uploading ? (
                <p className="text-base sm:text-lg text-gray-600">Uploading...</p>
              ) : isDragActive ? (
                <p className="text-base sm:text-lg text-purple-600 font-medium">Drop the file here...</p>
              ) : (
                <>
                  <p className="text-base sm:text-lg text-gray-700 font-medium">Drag & drop your CSV or Excel file here</p>
                  <p className="text-xs sm:text-sm text-gray-500">or click to browse</p>
                  <p className="text-xs text-gray-400">Max file size: 30MB • Supported: CSV, XLS, XLSX</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Files List */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Your Files</h2>
          {csvFiles.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 sm:p-12 text-center">
              <p className="text-sm sm:text-base text-gray-500">No files uploaded yet. Upload your first CSV file to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {csvFiles.map((file) => (
                <div key={file._id} className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 break-words">
                        {file.originalName}
                        {file.tag && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {file.tag}
                          </span>
                        )}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Total Emails</p>
                          <p className="text-sm sm:text-lg font-semibold">{file.totalEmails.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Sent</p>
                          <p className="text-sm sm:text-lg font-semibold text-green-600">{file.sentCount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Remaining</p>
                          <p className="text-sm sm:text-lg font-semibold text-blue-600">{file.remainingCount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Progress</p>
                          <p className="text-sm sm:text-lg font-semibold text-purple-600">{file.progressPercentage}%</p>
                        </div>
                        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
                          <p className="text-xs sm:text-sm text-gray-600">Uploaded</p>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">
                            {new Date(file.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${file.progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col lg:flex-col gap-2 lg:ml-4">
                      <button
                        onClick={() => handleView(file._id)}
                        disabled={loadingData}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-100 text-blue-700 text-xs sm:text-sm rounded-lg hover:bg-blue-200 transition disabled:opacity-50 whitespace-nowrap"
                      >
                        View
                      </button>
                      <Link
                        href={`/campaigns/create?csvId=${file._id}`}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-purple-600 text-white text-xs sm:text-sm rounded-lg hover:bg-purple-700 transition text-center whitespace-nowrap"
                      >
                        Campaign
                      </Link>
                      <button
                        onClick={() => setResetModal({ open: true, fileId: file._id })}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-yellow-100 text-yellow-700 text-xs sm:text-sm rounded-lg hover:bg-yellow-200 transition whitespace-nowrap"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setDeleteModal({ open: true, fileId: file._id, fileName: file.originalName })}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-100 text-red-700 text-xs sm:text-sm rounded-lg hover:bg-red-200 transition whitespace-nowrap"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Upload Loading Modal */}
      <LoadingModal
        isOpen={uploading}
        title="Uploading CSV File"
        subtitle="Please wait while we process your file..."
      />

      {/* CSV Data Viewer Modal */}
      {viewModal.open && viewModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <div className="flex-1 mr-4">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 break-words">{viewModal.data.fileName}</h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Total: {viewModal.data.totalEmails.toLocaleString()} • Cols: {viewModal.data.columns.length}
                </p>
              </div>
              <button
                onClick={() => setViewModal({ open: false, data: null })}
                className="text-gray-400 hover:text-gray-600 transition flex-shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Scrollable Table */}
            <div className="flex-1 overflow-auto p-3 sm:p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r bg-gray-100">
                        #
                      </th>
                      {viewModal.data.columns.map((column: string, index: number) => (
                        <th
                          key={index}
                          className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r last:border-r-0 bg-gray-100"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {viewModal.data.rows.map((row: any, rowIndex: number) => (
                      <tr key={rowIndex} className="hover:bg-gray-50 transition">
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500 border-r font-medium bg-gray-50">
                          {rowIndex + 1}
                        </td>
                        {viewModal.data.columns.map((column: string, colIndex: number) => (
                          <td
                            key={colIndex}
                            className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 border-r last:border-r-0"
                          >
                            {row[column] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 sm:p-6 border-t bg-gray-50">
              <p className="text-xs sm:text-sm text-gray-600">
                Showing {viewModal.data.rows.length.toLocaleString()} records
              </p>
              <button
                onClick={() => setViewModal({ open: false, data: null })}
                className="w-full sm:w-auto px-6 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Modal for View Data */}
      <LoadingModal isOpen={loadingData} title="Loading CSV Data" subtitle="Please wait while we fetch your data..." />

      {/* Reset Confirmation Modal */}
      {resetModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
              Reset CSV Progress
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Are you sure you want to reset progress for this file? This will reset the sent count to 0 and allow you to reuse all emails.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleReset}
                className="w-full sm:flex-1 px-4 py-2 bg-yellow-600 text-white text-sm sm:text-base rounded-lg hover:bg-yellow-700 transition font-medium"
              >
                Reset
              </button>
              <button
                onClick={() => setResetModal({ open: false, fileId: null })}
                className="w-full sm:flex-1 px-4 py-2 bg-gray-200 text-gray-800 text-sm sm:text-base rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmModal
        isOpen={deleteModal.open}
        title="Confirm Delete CSV File"
        message="This action cannot be undone. This will permanently delete the CSV file."
        itemName={deleteModal.fileName}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ open: false, fileId: null, fileName: '' })}
      />
    </div>
  );
}
