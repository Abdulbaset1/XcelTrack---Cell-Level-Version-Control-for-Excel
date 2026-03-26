import React, { ReactNode } from 'react';
import { FiInbox, FiFile, FiUsers, FiGitCommit } from 'react-icons/fi';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                {icon || (FiInbox as any)({ className: "text-gray-400", size: 32 })}
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
            {description && (
                <p className="text-sm text-gray-600 mb-6 max-w-md">{description}</p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};

// Predefined empty states
const NoFilesEmptyState: React.FC<{ onUpload: () => void }> = ({ onUpload }) => (
    <EmptyState
        icon={(FiFile as any)({ className: "text-gray-400", size: 32 })}
        title="No files yet"
        description="Upload your first Excel file to get started with version control"
        action={{ label: 'Upload File', onClick: onUpload }}
    />
);

const NoCommitsEmptyState: React.FC = () => (
    <EmptyState
        icon={(FiGitCommit as any)({ className: "text-gray-400", size: 32 })}
        title="No commits yet"
        description="Make changes and save to create your first commit"
    />
);

const NoCollaboratorsEmptyState: React.FC = () => (
    <EmptyState
        icon={(FiUsers as any)({ className: "text-gray-400", size: 32 })}
        title="No other users editing"
        description="You're the only one working on this file right now"
    />
);

export { NoFilesEmptyState, NoCommitsEmptyState, NoCollaboratorsEmptyState };
export default EmptyState;
