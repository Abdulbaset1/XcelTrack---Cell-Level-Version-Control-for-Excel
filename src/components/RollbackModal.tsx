import React, { useState } from 'react';
import { FiAlertTriangle, FiRotateCcw, FiX, FiEye } from 'react-icons/fi';
import { rollbackToCommit } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface RollbackModalProps {
    isOpen: boolean;
    workbookId: number;
    commitId: number;
    userId: string;
    commitMessage: string;
    commitDate: string;
    changesCount: number;
    onConfirm?: () => void;
    onCancel?: () => void;
    onPreview?: (commitId: number) => void;
}

const RollbackModal: React.FC<RollbackModalProps> = ({
    isOpen,
    workbookId,
    commitId,
    userId,
    commitMessage,
    commitDate,
    changesCount,
    onConfirm,
    onCancel,
    onPreview,
}) => {
    const [isConfirming, setIsConfirming] = useState(false);
    const { showToast } = useToast();

    if (!isOpen) return null;

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            await rollbackToCommit(workbookId, commitId, userId);
            showToast('Successfully rolled back to previous version!', 'success');
            onConfirm?.();
        } catch (error) {
            console.error('Rollback failed:', error);
            showToast(
                error instanceof Error ? error.message : 'Failed to rollback',
                'error'
            );
        } finally {
            setIsConfirming(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            {(FiRotateCcw as any)({ className: "text-orange-600", size: 20 })}
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Revert to Previous Version</h2>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        {(FiX as any)({ size: 24 })}
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Warning */}
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                        <div className="flex items-start space-x-3">
                            {(FiAlertTriangle as any)({ className: "text-yellow-600 flex-shrink-0 mt-0.5", size: 20 })}
                            <div>
                                <h3 className="text-sm font-semibold text-yellow-800 mb-1">Warning</h3>
                                <p className="text-sm text-yellow-700">
                                    This will revert your workbook to a previous state. All changes made after this commit will be undone. This action will create a new commit.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Commit Details */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-medium mb-1">Commit Message</p>
                            <p className="text-sm font-medium text-gray-900">{commitMessage}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-medium mb-1">Date</p>
                            <p className="text-sm text-gray-700">{formatDate(commitDate)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-medium mb-1">Changes</p>
                            <p className="text-sm text-gray-700">{changesCount} cell{changesCount !== 1 ? 's' : ''} will be reverted</p>
                        </div>
                    </div>

                    {/* Preview Button */}
                    {onPreview && (
                        <button
                            onClick={() => onPreview(commitId)}
                            className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            {(FiEye as any)({ size: 16 })}
                            <span className="text-sm font-medium">Preview Changes</span>
                        </button>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onCancel}
                        disabled={isConfirming}
                        className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isConfirming}
                        className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                        {(FiRotateCcw as any)({ size: 16 })}
                        <span>{isConfirming ? 'Reverting...' : 'Revert to This Version'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RollbackModal;
