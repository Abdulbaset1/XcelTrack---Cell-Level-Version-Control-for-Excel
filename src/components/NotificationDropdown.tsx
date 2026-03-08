import React, { useState } from 'react';
import { FiBell, FiX, FiCheck, FiAlertCircle, FiInfo } from 'react-icons/fi';

interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
}

interface NotificationDropdownProps {
    notifications: Notification[];
    onMarkAsRead?: (id: string) => void;
    onMarkAllAsRead?: () => void;
    onClear?: (id: string) => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onClear,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter((n) => !n.read).length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'success':
                return (FiCheck as any)({ className: "text-green-500", size: 16 });
            case 'warning':
                return (FiAlertCircle as any)({ className: "text-yellow-500", size: 16 });
            case 'error':
                return (FiAlertCircle as any)({ className: "text-red-500", size: 16 });
            default:
                return (FiInfo as any)({ className: "text-blue-500", size: 16 });
        }
    };

    const formatTime = (date: Date): string => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
                {(FiBell as any)({ size: 20 })}
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                        <div className="flex items-center space-x-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={onMarkAllAsRead}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                    Mark all as read
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                {(FiX as any)({ size: 18 })}
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                {(FiBell as any)({ size: 48, className: "mx-auto text-gray-300 mb-4" })}
                                <p className="text-sm">No notifications</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50' : ''
                                        }`}
                                    onClick={() => onMarkAsRead?.(notification.id)}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-1">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {notification.title}
                                                </p>
                                                {!notification.read && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-400">
                                                    {formatTime(notification.timestamp)}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onClear?.(notification.id);
                                                    }}
                                                    className="text-xs text-gray-500 hover:text-red-600"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
