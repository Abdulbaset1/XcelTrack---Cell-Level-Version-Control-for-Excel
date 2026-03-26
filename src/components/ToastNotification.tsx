import React, { useEffect, useState, useCallback } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastNotificationProps {
    toast: Toast;
    onClose: (id: string) => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    const handleClose = useCallback(() => {
        setIsVisible(false);
        setTimeout(() => onClose(toast.id), 300);
    }, [toast.id, onClose]);

    useEffect(() => {
        // Trigger animation
        setTimeout(() => setIsVisible(true), 10);

        // Auto-dismiss
        if (toast.duration !== 0) {
            const timer = setTimeout(() => {
                handleClose();
            }, toast.duration || 5000);

            return () => clearTimeout(timer);
        }
    }, [toast, handleClose]);

    const getIcon = () => {
        const iconProps = { size: 20 };
        switch (toast.type) {
            case 'success':
                return React.createElement(FiCheckCircle as any, { ...iconProps, className: 'text-green-500' });
            case 'error':
                return React.createElement(FiXCircle as any, { ...iconProps, className: 'text-red-500' });
            case 'warning':
                return React.createElement(FiAlertCircle as any, { ...iconProps, className: 'text-yellow-500' });
            case 'info':
                return React.createElement(FiInfo as any, { ...iconProps, className: 'text-blue-500' });
        }
    };

    const getStyles = () => {
        switch (toast.type) {
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'error':
                return 'bg-red-50 border-red-200';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200';
            case 'info':
                return 'bg-blue-50 border-blue-200';
        }
    };

    return (
        <div
            className={`flex items-start space-x-3 p-4 rounded-lg border shadow-lg transition-all duration-300 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                } ${getStyles()}`}
            style={{ minWidth: '300px', maxWidth: '400px' }}
        >
            <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{toast.message}</p>
            </div>
            <button
                onClick={handleClose}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
                {React.createElement(FiX as any, { size: 18 })}
            </button>
        </div>
    );
};

export default ToastNotification;
