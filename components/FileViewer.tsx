'use client';

import { useState, useEffect } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

interface FileViewerProps {
  fileUrl: string;
  fileName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function FileViewer({ fileUrl, fileName, isOpen, onClose }: FileViewerProps) {
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'unknown'>('unknown');

  useEffect(() => {
    if (fileUrl) {
      // Detect file type from URL or extension
      const urlLower = fileUrl.toLowerCase();
      if (urlLower.endsWith('.pdf') || urlLower.includes('.pdf')) {
        setFileType('pdf');
      } else if (
        urlLower.match(/\.(jpg|jpeg|png|gif|webp)/) ||
        urlLower.includes('image')
      ) {
        setFileType('image');
      } else {
        setFileType('unknown');
      }
    }
  }, [fileUrl]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-6xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {fileName || 'File Preview'}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={handleOpenInNewTab}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                title="Open in new tab"
              >
                <ExternalLink className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6" style={{ maxHeight: '80vh', overflow: 'auto' }}>
            {fileType === 'image' && (
              <div className="flex justify-center">
                <img
                  src={fileUrl}
                  alt={fileName || 'File preview'}
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  style={{ maxHeight: '70vh' }}
                />
              </div>
            )}

            {fileType === 'pdf' && (
              <div className="w-full" style={{ height: '70vh' }}>
                <iframe
                  src={`${fileUrl}#view=FitH`}
                  className="w-full h-full rounded-lg border border-gray-200"
                  title={fileName || 'PDF preview'}
                />
              </div>
            )}

            {fileType === 'unknown' && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <ExternalLink className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Preview not available
                </h4>
                <p className="text-sm text-gray-500 mb-6">
                  This file type cannot be previewed in the browser.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
                  >
                    Download File
                  </button>
                  <button
                    onClick={handleOpenInNewTab}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    Open in New Tab
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
