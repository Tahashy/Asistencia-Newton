import React, { useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: { bg: 'bg-green-500', icon: <CheckCircle className="w-5 h-5" /> },
    error: { bg: 'bg-red-500', icon: <XCircle className="w-5 h-5" /> },
    warning: { bg: 'bg-yellow-500', icon: <AlertCircle className="w-5 h-5" /> },
    info: { bg: 'bg-blue-500', icon: <AlertCircle className="w-5 h-5" /> }
  };

  const current = config[type] || config.info;

  return (
    <div className={`fixed top-4 right-4 z-50 ${current.bg} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[320px] max-w-md animate-slide-in`}>
      {current.icon}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="hover:bg-white/20 rounded p-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;