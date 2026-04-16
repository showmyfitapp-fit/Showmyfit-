import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-500',
      iconColor: 'text-green-500',
      bgLight: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-500',
      iconColor: 'text-red-500',
      bgLight: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-500',
      iconColor: 'text-yellow-500',
      bgLight: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-500',
      iconColor: 'text-blue-500',
      bgLight: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className={`
      ${config.bgLight} ${config.borderColor}
      border rounded-xl p-4 shadow-lg hover-lift
      animate-slide-up max-w-sm w-full
    `}>
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-warm-900">{title}</p>
          {message && (
            <p className="text-sm text-warm-600 mt-1">{message}</p>
          )}
        </div>
        <button
          onClick={() => onClose(id)}
          className="text-warm-400 hover:text-warm-600 transition-colors flex-shrink-0"
          aria-label="Close notification"
          title="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;