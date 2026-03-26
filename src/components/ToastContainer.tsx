import React, { useEffect } from 'react';
import { FiCheck, FiX, FiAlertCircle, FiInfo } from 'react-icons/fi';

interface ToastProps {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
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
    onClose,
}) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose(id);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [id, duration, onClose]);

    const getStyles = () => {
        switch (type) {
            case 'success':
                return {
                    bg: 'bg-green-50',
                    border: 'border-green-200',
                    icon: (FiCheck as any)({ className: "text-green-500", size: 20 }),
                    title: 'text-green-800',
                    message: 'text-green-700',
                };
            case 'error':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    icon: (FiAlertCircle as any)({ className: "text-red-500", size: 20 }),
                    title: 'text-red-800',
                    message: 'text-red-700',
                };
            case 'warning':
                return {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    icon: (FiAlertCircle as any)({ className: "text-yellow-500", size: 20 }),
                    title: 'text-yellow-800',
                    message: 'text-yellow-700',
                };
            default:
                return {
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    icon: (FiInfo as any)({ className: "text-blue-500", size: 20 }),
                    title: 'text-blue-800',
                    message: 'text-blue-700',
                };
        }
    };

    const styles = getStyles();

    return (
        <div
            className={`${styles.bg} border ${styles.border} rounded-lg shadow-lg p-4 min-w-[300px] max-w-md animate-slide-in-right`}
        >
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">{styles.icon}</div>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${styles.title}`}>{title}</p>
                    {message && <p className={`text-sm ${styles.message} mt-1`}>{message}</p>}
                </div>
                <button
                    onClick={() => onClose(id)}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    {(FiX as any)({ size: 18 })}
                </button>
            </div>
        </div>
    );
};

interface ToastContainerProps {
    toasts: Array<{
        id: string;
        type: 'success' | 'error' | 'warning' | 'info';
        title: string;
        message?: string;
        duration?: number;
    }>;
    onClose: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-3">
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} onClose={onClose} />
            ))}
        </div>
    );
};

export default ToastContainer;
export { Toast };
