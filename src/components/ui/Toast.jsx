// src/components/ui/Toast.jsx
import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export const Toast = ({ message, type = 'info', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const config = {
    success: {
      bg: 'bg-green-500',
      icon: <CheckCircle className="w-5 h-5" />,
      title: 'Éxito'
    },
    error: {
      bg: 'bg-red-500',
      icon: <XCircle className="w-5 h-5" />,
      title: 'Error'
    },
    warning: {
      bg: 'bg-yellow-500',
      icon: <AlertCircle className="w-5 h-5" />,
      title: 'Advertencia'
    },
    info: {
      bg: 'bg-blue-500',
      icon: <Info className="w-5 h-5" />,
      title: 'Información'
    }
  };

  const current = config[type];

  return (
    <div className={`fixed top-4 right-4 z-50 ${current.bg} text-white px-6 py-4 rounded-lg shadow-2xl flex items-start gap-3 min-w-[320px] max-w-md animate-slide-in`}>
      <div className="flex-shrink-0 mt-0.5">
        {current.icon}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm mb-1">{current.title}</p>
        <p className="text-sm opacity-95">{message}</p>
      </div>
      <button 
        onClick={onClose} 
        className="flex-shrink-0 hover:bg-white/20 rounded p-1 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Hook personalizado para manejar toasts
export const useToast = () => {
  const [toast, setToast] = React.useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  return { toast, showToast, hideToast };
};