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

export default function CSVPage() {
  const router = useRouter();
  const [csvFiles, setCsvFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewModal, setViewModal] = useState<{ open: boolean; data: any | null }>({
    open: false,
    data: null,
  });
  const [loadingData, setLoadingData] = useState(false);
  const [resetModal, setResetModal] = useState<{ open: boolean; fileId: string | null }>({
    open: false,
    fileId: null,
  });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; fileId: string | null }>({
    open: false,
    fileId: null,
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
      await csvAPI.upload(file);
      console.log('Upload successful!');
      toast.success('File uploaded successfully!');
      fetchCsvFiles();
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img src="/img/logo/netraga_logo.png" alt="Netraga Logo" className="h-12 w-12" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Campaign Manager
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href="/dashboard"
              className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              Dashboard
            </Link>
            <Link
              href="/csv"
              className="px-3 py-4 text-sm font-medium text-purple-600 border-b-2 border-purple-600"
            >
              CSV Files
            </Link>
            <Link
              href="/campaigns"
              className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              Campaigns
            </Link>
            <Link
              href="/company-accounts"
              className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              Company Accounts
            </Link>
            <Link
              href="/calendar"
              className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              📅 Calendar
            </Link>
            <Link
              href="/activity-logs"
              className="px-3 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Activity Logs
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Upload Area */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload CSV File</h2>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
              isDragActive
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-300 hover:border-purple-400 bg-white'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} disabled={uploading} />
            <div className="space-y-4">
              <div className="flex justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              {uploading ? (
                <p className="text-lg text-gray-600">Uploading...</p>
              ) : isDragActive ? (
                <p className="text-lg text-purple-600 font-medium">Drop the file here...</p>
              ) : (
                <>
                  <p className="text-lg text-gray-700 font-medium">Drag & drop your CSV or Excel file here</p>
                  <p className="text-sm text-gray-500">or click to browse</p>
                  <p className="text-xs text-gray-400">Max file size: 30MB • Supported: CSV, XLS, XLSX</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Files List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Files</h2>
          {csvFiles.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">No files uploaded yet. Upload your first CSV file to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {csvFiles.map((file) => (
                <div key={file._id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{file.originalName}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Total Emails</p>
                          <p className="text-lg font-semibold">{file.totalEmails.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Sent</p>
                          <p className="text-lg font-semibold text-green-600">{file.sentCount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Remaining</p>
                          <p className="text-lg font-semibold text-blue-600">{file.remainingCount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Progress</p>
                          <p className="text-lg font-semibold text-purple-600">{file.progressPercentage}%</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${file.progressPercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Uploaded {new Date(file.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="ml-4 flex gap-2">
                      <button
                        onClick={() => handleView(file._id)}
                        disabled={loadingData}
                        className="px-4 py-2 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition disabled:opacity-50"
                      >
                        View Data
                      </button>
                      <Link
                        href={`/campaigns/create?csvId=${file._id}`}
                        className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition"
                      >
                        Create Campaign
                      </Link>
                      <button
                        onClick={() => setResetModal({ open: true, fileId: file._id })}
                        className="px-4 py-2 bg-yellow-100 text-yellow-700 text-sm rounded-lg hover:bg-yellow-200 transition"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setDeleteModal({ open: true, fileId: file._id })}
                        className="px-4 py-2 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{viewModal.data.fileName}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Total Records: {viewModal.data.totalEmails.toLocaleString()} • Columns: {viewModal.data.columns.length}
                </p>
              </div>
              <button
                onClick={() => setViewModal({ open: false, data: null })}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Scrollable Table */}
            <div className="flex-1 overflow-auto p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r bg-gray-100">
                        #
                      </th>
                      {viewModal.data.columns.map((column: string, index: number) => (
                        <th
                          key={index}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r last:border-r-0 bg-gray-100"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {viewModal.data.rows.map((row: any, rowIndex: number) => (
                      <tr key={rowIndex} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 border-r font-medium bg-gray-50">
                          {rowIndex + 1}
                        </td>
                        {viewModal.data.columns.map((column: string, colIndex: number) => (
                          <td
                            key={colIndex}
                            className="px-4 py-3 text-sm text-gray-900 border-r last:border-r-0"
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
            <div className="flex items-center justify-between p-6 border-t bg-gray-50">
              <p className="text-sm text-gray-600">
                Showing {viewModal.data.rows.length.toLocaleString()} records
              </p>
              <button
                onClick={() => setViewModal({ open: false, data: null })}
                className="px-6 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Reset CSV Progress
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to reset progress for this file? This will reset the sent count to 0 and allow you to reuse all emails.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium"
              >
                Reset
              </button>
              <button
                onClick={() => setResetModal({ open: false, fileId: null })}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteModal.open}
        title="localhost:3004 says"
        message="Are you sure you want to delete this file?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ open: false, fileId: null })}
        confirmText="OK"
        cancelText="Cancel"
        confirmButtonClass="bg-blue-600 hover:bg-blue-700"
      />
    </div>
  );
}
