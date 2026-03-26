import React from 'react';
import { FiRefreshCw, FiCloudOff, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

interface HybridSyncBannerProps {
    status: 'syncing' | 'offline' | 'error' | 'synced';
    message?: string;
    onRetry?: () => void;
}

const HybridSyncBanner: React.FC<HybridSyncBannerProps> = ({ status, message, onRetry }) => {
    const getStatusConfig = () => {
        switch (status) {
            case 'syncing':
                return {
                    icon: <FiRefreshCw className="animate-spin text-blue-500" size={18} />,
                    bg: 'bg-blue-50',
                    border: 'border-blue-100',
                    text: 'text-blue-700',
                    label: 'Synchronizing offline changes...',
                };
            case 'offline':
                return {
                    icon: <FiCloudOff className="text-gray-500" size={18} />,
                    bg: 'bg-gray-100',
                    border: 'border-gray-200',
                    text: 'text-gray-700',
                    label: 'Working Offline. Changes will sync when reconnected.',
                };
            case 'error':
                return {
                    icon: <FiAlertCircle className="text-red-500" size={18} />,
                    bg: 'bg-red-50',
                    border: 'border-red-100',
                    text: 'text-red-700',
                    label: 'Sync Conflict Detected!',
                };
            case 'synced':
                return {
                    icon: <FiCheckCircle className="text-green-500" size={18} />,
                    bg: 'bg-green-50',
                    border: 'border-green-100',
                    text: 'text-green-700',
                    label: 'All changes synchronized.',
                };
            default:
                return null;
        }
    };

    const config = getStatusConfig();
    if (!config) return null;

    return (
        <div className={`px-4 py-2 ${config.bg} border-b ${config.border} transition-all duration-300`}>
            <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center space-x-3">
                    {config.icon}
                    <span className={`text-sm font-medium ${config.text}`}>
                        {message || config.label}
                    </span>
                </div>

                {status === 'error' && onRetry && (
                    <button
                        onClick={onRetry}
                        className="text-xs font-bold uppercase tracking-wider bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors shadow-sm"
                    >
                        Resolve Conflicts
                    </button>
                )}

                {status === 'offline' && (
                    <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold uppercase py-0.5 px-2 bg-gray-200 text-gray-600 rounded">
                            Local Storage Active
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HybridSyncBanner;
