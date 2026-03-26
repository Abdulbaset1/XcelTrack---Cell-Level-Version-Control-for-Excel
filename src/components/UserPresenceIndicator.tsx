import React from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    color: string;
    avatar?: string;
}

interface UserPresenceIndicatorProps {
    users: User[];
    maxDisplay?: number;
}

const UserPresenceIndicator: React.FC<UserPresenceIndicatorProps> = ({
    users,
    maxDisplay = 5,
}) => {
    const displayedUsers = users.slice(0, maxDisplay);
    const remainingCount = users.length - maxDisplay;

    const getInitials = (name: string): string => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 font-medium">Active Users:</span>
            <div className="flex -space-x-2">
                {displayedUsers.map((user) => (
                    <div
                        key={user.id}
                        className="relative group"
                        title={`${user.name} (${user.email})`}
                    >
                        {user.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                                style={{ borderColor: user.color }}
                            />
                        ) : (
                            <div
                                className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold text-white"
                                style={{ backgroundColor: user.color }}
                            >
                                {getInitials(user.name)}
                            </div>
                        )}
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            {user.name}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                    </div>
                ))}
                {remainingCount > 0 && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold text-gray-600">
                        +{remainingCount}
                    </div>
                )}
            </div>
            <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">{users.length} online</span>
            </div>
        </div>
    );
};

export default UserPresenceIndicator;
