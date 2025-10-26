interface LoadingModalProps {
  isOpen: boolean;
  title: string;
  subtitle: string;
}

export default function LoadingModal({ isOpen, title, subtitle }: LoadingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(12, 190, 225, 0.5)' }}>
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          <div className="mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto" style={{ borderColor: 'rgb(12, 190, 225)' }}></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-4">{subtitle}</p>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="h-2 rounded-full animate-pulse" style={{ background: 'linear-gradient(to right, rgb(12, 190, 225), rgb(8, 153, 182))' }}></div>
          </div>
          <p className="text-sm text-gray-500 mt-4">This may take a few moments</p>
        </div>
      </div>
    </div>
  );
}
