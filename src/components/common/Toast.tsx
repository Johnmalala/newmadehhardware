import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-600' : 'bg-red-600';
  const Icon = isSuccess ? CheckCircle : AlertCircle;

  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center p-4 rounded-lg shadow-lg text-white ${bgColor}`}>
      <Icon className="w-6 h-6 mr-3" />
      <p>{message}</p>
      <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-white/20">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
