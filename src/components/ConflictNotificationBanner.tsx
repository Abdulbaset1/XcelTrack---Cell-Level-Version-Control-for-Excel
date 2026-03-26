import React from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

interface Conflict {
    cellReference: string;
    yourValue: string;
    theirValue: string;
    theirUser: string;
    timestamp: Date;
}

interface ConflictNotificationBannerProps {
    conflicts: Conflict[];
    onResolve?: () => void;
    onDismiss?: () => void;
}

const ConflictNotificationBanner: React.FC<ConflictNotificationBannerProps> = ({
    conflicts,
    onResolve,
    onDismiss,
}) => {
    if (conflicts.length === 0) return null;

    return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 shadow-md">
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                    {(FiAlertTriangle as any)({ className: "text-yellow-600 flex-shrink-0 mt-0.5", size: 20 })}
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                            Editing Conflict Detected
                        </h3>
                        <p className="text-sm text-yellow-700 mb-3">
                            {conflicts.length} cell{conflicts.length !== 1 ? 's have' : ' has'} conflicting changes from multiple users. Please resolve to continue.
                        </p>

                        {/* Conflict List */}
                        <div className="space-y-2">
                            {conflicts.slice(0, 3).map((conflict, index) => (
                                <div key={index} className="bg-white rounded p-2 text-xs">
                                    <span className="font-mono font-semibold text-blue-600">
                                        {conflict.cellReference}
                                    </span>
                                    <span className="text-gray-600 mx-2">•</span>
                                    <span className="text-gray-700">
                                        You: <span className="font-medium">{conflict.yourValue}</span>
                                    </span>
                                    <span className="text-gray-600 mx-2">vs</span>
                                    <span className="text-gray-700">
                                        {conflict.theirUser}: <span className="font-medium">{conflict.theirValue}</span>
                                    </span>
                                </div>
                            ))}
                            {conflicts.length > 3 && (
                                <p className="text-xs text-yellow-700">
                                    +{conflicts.length - 3} more conflict{conflicts.length - 3 !== 1 ? 's' : ''}
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-3 mt-3">
                            <button
                                onClick={onResolve}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                            >
                                Resolve Conflicts
                            </button>
                            <button
                                onClick={onDismiss}
                                className="text-sm text-yellow-700 hover:text-yellow-800 underline"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onDismiss}
                    className="text-yellow-600 hover:text-yellow-800 transition-colors ml-4"
                >
                    {(FiX as any)({ size: 20 })}
                </button>
            </div>
        </div>
    );
};

export default ConflictNotificationBanner;
