import React from 'react';
import { FiUsers, FiX } from 'react-icons/fi';

interface ActiveUser {
    id: string;
    name: string;
    email: string;
    color: string;
    currentCell?: string;
    lastActive: Date;
}

interface WhosEditingSidebarProps {
    users: ActiveUser[];
    isOpen: boolean;
    onClose?: () => void;
}

const WhosEditingSidebar: React.FC<WhosEditingSidebarProps> = ({
    users,
    isOpen = true,
    onClose,
}) => {
    const formatLastActive = (date: Date | string): string => {
        const activeDate = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diff = now.getTime() - activeDate.getTime();
        const seconds = Math.floor(diff / 1000);

        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    if (!isOpen) return null;

    return (
        <div className="h-full w-full bg-white flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                    {(FiUsers as any)({ className: "text-blue-500", size: 20 })}
                    <h3 className="text-lg font-semibold text-gray-800">Who's Editing</h3>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                    {(FiX as any)({ size: 20 })}
                </button>
            </div>

            {/* User List */}
            <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-60px)]">
                {users.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        {(FiUsers as any)({ size: 48, className: "mx-auto text-gray-300 mb-4" })}
                        <p className="text-sm">No other users editing</p>
                    </div>
                ) : (
                    users.map((user) => (
                        <div
                            key={user.id}
                            className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-start space-x-3">
                                {/* User Avatar */}
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                                    style={{ backgroundColor: user.color }}
                                >
                                    {user.name
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .toUpperCase()
                                        .slice(0, 2)}
                                </div>

                                {/* User Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {user.name}
                                        </p>
                                        <div className="flex items-center space-x-1">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate mb-2">{user.email}</p>

                                    {/* Current Activity */}
                                    {user.currentCell ? (
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs text-gray-600">Editing:</span>
                                            <span
                                                className="px-2 py-0.5 rounded text-xs font-mono font-semibold text-white"
                                                style={{ backgroundColor: user.color }}
                                            >
                                                {user.currentCell}
                                            </span>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400">Viewing</p>
                                    )}

                                    <p className="text-xs text-gray-400 mt-1">
                                        Active {formatLastActive(user.lastActive)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default WhosEditingSidebar;
