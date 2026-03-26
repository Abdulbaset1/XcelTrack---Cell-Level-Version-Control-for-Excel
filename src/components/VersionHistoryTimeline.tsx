import React, { useState, useEffect } from 'react';
import { FiClock, FiUser, FiFileText } from 'react-icons/fi';
import { getCommitHistory, Commit } from '../services/api';

interface VersionHistoryTimelineProps {
    workbookId: number;
    onCommitSelect?: (commit: Commit) => void;
}

const VersionHistoryTimeline: React.FC<VersionHistoryTimelineProps> = ({
    workbookId,
    onCommitSelect,
}) => {
    const [commits, setCommits] = useState<Commit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCommitId, setSelectedCommitId] = useState<number | null>(null);

    useEffect(() => {
        const fetchCommits = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getCommitHistory(workbookId);
                setCommits(data.commits);
            } catch (err) {
                console.error('Error fetching commits:', err);
                setError(err instanceof Error ? err.message : 'Failed to load commit history');
            } finally {
                setLoading(false);
            }
        };

        if (workbookId) {
            fetchCommits();
        }
    }, [workbookId]);

    const handleCommitClick = (commit: Commit) => {
        setSelectedCommitId(commit.id);
        onCommitSelect?.(commit);
    };

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
    };

    if (loading && commits.length === 0) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Loading commit history...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 font-medium">Error loading commits</p>
                <p className="text-red-500 text-sm mt-1">{error}</p>
            </div>
        );
    }

    if (commits.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                {React.createElement(FiClock as any, { size: 48, className: 'mx-auto mb-3 opacity-50' })}
                <p className="font-medium">No commits yet</p>
                <p className="text-sm mt-1">Changes will appear here once you save</p>
            </div>
        );
    }

    return (
        <div className="version-history-timeline">
            <div className="space-y-4">
                {commits.map((commit, index) => (
                    <div
                        key={commit.id}
                        onClick={() => handleCommitClick(commit)}
                        className={`relative pl-8 pb-6 cursor-pointer transition-all ${selectedCommitId === commit.id
                            ? 'bg-blue-50 -mx-4 px-4 rounded-lg'
                            : 'hover:bg-gray-50 -mx-4 px-4 rounded-lg'
                            }`}
                    >
                        {/* Timeline Line */}
                        {index < commits.length - 1 && (
                            <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-300" />
                        )}

                        {/* Timeline Dot */}
                        <div
                            className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedCommitId === commit.id
                                ? 'bg-blue-500 border-blue-500'
                                : 'bg-white border-gray-300'
                                }`}
                        >
                            {selectedCommitId === commit.id && (
                                <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                        </div>

                        {/* Commit Content */}
                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-1">
                                <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                                    {React.createElement(FiFileText as any, { size: 14 })}
                                    <span>{commit.message || 'Auto-save'}</span>
                                </h4>
                                <span className="text-xs text-gray-500 flex items-center space-x-1">
                                    {React.createElement(FiClock as any, { size: 12 })}
                                    <span>{formatDate(commit.timestamp)}</span>
                                </span>
                            </div>

                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="flex items-center space-x-1">
                                    {React.createElement(FiUser as any, { size: 12 })}
                                    <span>{commit.user_id.substring(0, 8)}...</span>
                                </span>
                                <span className="text-xs text-gray-500">
                                    {commit.changes_count || 0} change{commit.changes_count !== 1 ? 's' : ''}
                                </span>
                            </div>

                            <div className="mt-2 text-xs text-gray-400 font-mono">
                                {commit.hash.substring(0, 8)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VersionHistoryTimeline;
