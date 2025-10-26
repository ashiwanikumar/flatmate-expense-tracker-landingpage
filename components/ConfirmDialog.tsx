interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
  confirmButtonClass = 'bg-blue-600 hover:bg-blue-700'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full border border-gray-700">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-white">
            {title}
          </h3>
        </div>

        {/* Message */}
        <div className="px-4 sm:px-6 py-4 sm:py-5">
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-700 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto px-4 sm:px-5 py-2.5 bg-gray-700 text-white text-sm sm:text-base rounded-lg hover:bg-gray-600 transition font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 order-2 sm:order-1"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`w-full sm:w-auto px-4 sm:px-5 py-2.5 text-white text-sm sm:text-base rounded-lg transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 order-1 sm:order-2 ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
