import React from 'react';
import { FiUser, FiClock, FiMessageSquare, FiGitCommit, FiFileText, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import SemanticDiffSummary from './SemanticDiffSummary';
import DiffHighlighter from './DiffHighlighter';

interface CellChange {
    cellReference: string;
    changeType: 'added' | 'modified' | 'deleted';
    oldValue?: string;
    newValue?: string;
    oldFormula?: string;
    newFormula?: string;
}

interface CommitDetails {
    id: string;
    message: string;
    user: string;
    timestamp: Date;
    changes: CellChange[];
}

interface CommitDetailViewerProps {
    commit: CommitDetails | null;
    onClose?: () => void;
    onRevert?: (commitId: string) => void;
}

const CommitDetailViewer: React.FC<CommitDetailViewerProps> = ({
    commit,
    onClose,
    onRevert,
}) => {
    if (!commit) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
                {(FiGitCommit as any)({ size: 48, className: "mx-auto text-gray-300 mb-4" })}
                <p className="text-gray-500">Select a commit to view details</p>
            </div>
        );
    }

    const formatDate = (date: Date): string => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }).format(date);
    };

    const getChangeTypeColor = (type: string) => {
        switch (type) {
            case 'added':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'modified':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'deleted':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                            {(FiMessageSquare as any)({ className: "text-blue-500", size: 20 })}
                            <h2 className="text-lg font-semibold text-gray-800">{commit.message}</h2>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                                {(FiUser as any)({ size: 14 })}
                                <span>{commit.user}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                {(FiClock as any)({ size: 14 })}
                                <span>{formatDate(commit.timestamp)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => onRevert?.(commit.id)}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                        >
                            Revert to This Version
                        </button>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                            >
                                Close
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Changes List */}
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Commit Analysis
                    </h3>
                </div>

                {/* Semantic Summary Card */}
                <div className="mb-8">
                    <SemanticDiffSummary
                        changes={commit.changes.map(c => ({
                            type: c.changeType === 'added' ? 'cell_added' : c.changeType === 'deleted' ? 'cell_deleted' : 'value_change',
                            cellReference: c.cellReference,
                            description: `${c.changeType === 'modified' ? 'Updated' : c.changeType === 'added' ? 'Added' : 'Cleared'} cell ${c.cellReference} ${c.newValue ? `to "${c.newValue}"` : ''}`,
                            impact: 'medium'
                        }))}
                    />
                </div>

                <div className="flex items-center justify-between mb-4 border-t border-gray-100 pt-6">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Visual Diff ({commit.changes.length} cells)
                    </h3>
                </div>

                {/* Visual Diff Highlighter */}
                <div className="mb-6">
                    <DiffHighlighter
                        diffs={commit.changes.map(c => ({
                            cellReference: c.cellReference,
                            changeType: c.changeType,
                            oldValue: c.oldValue,
                            newValue: c.newValue,
                            oldFormula: c.oldFormula,
                            newFormula: c.newFormula
                        }))}
                        viewMode="unified"
                    />
                </div>

                <details className="mt-8 group">
                    <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700">
                        <span>Raw Change List</span>
                        <FiChevronDown className="group-open:hidden" />
                        <FiChevronUp className="hidden group-open:block" />
                    </summary>
                    <div className="space-y-3 mt-4 max-h-[400px] overflow-y-auto">
                        {commit.changes.map((change, index) => (
                            <div
                                key={index}
                                className={`border rounded-lg p-4 ${getChangeTypeColor(change.changeType)}`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        {(FiFileText as any)({ size: 16 })}
                                        <span className="font-mono font-semibold">{change.cellReference}</span>
                                        <span className="px-2 py-0.5 bg-white bg-opacity-50 rounded text-xs font-medium uppercase">
                                            {change.changeType}
                                        </span>
                                    </div>
                                </div>

                                {/* Value Changes */}
                                {(change.oldValue !== undefined || change.newValue !== undefined) && (
                                    <div className="mt-2 space-y-1">
                                        {change.oldValue !== undefined && (
                                            <div className="flex items-start space-x-2 text-sm">
                                                <span className="text-gray-600 font-medium min-w-[60px]">Old:</span>
                                                <span className="font-mono">{change.oldValue || '(empty)'}</span>
                                            </div>
                                        )}
                                        {change.newValue !== undefined && (
                                            <div className="flex items-start space-x-2 text-sm">
                                                <span className="text-gray-600 font-medium min-w-[60px]">New:</span>
                                                <span className="font-mono">{change.newValue || '(empty)'}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </details>
            </div>
        </div>
    );
};

export default CommitDetailViewer;
