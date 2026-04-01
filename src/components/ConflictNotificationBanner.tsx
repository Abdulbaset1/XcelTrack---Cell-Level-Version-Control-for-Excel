import React from 'react';
import { FiAlertTriangle, FiLock } from 'react-icons/fi';

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
}) => {
    if (conflicts.length === 0) return null;

    return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 shadow-md animate-pulse-subtle">
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                    {(FiAlertTriangle as any)({ className: "text-red-600 flex-shrink-0 mt-0.5", size: 20 })}
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-red-800 mb-1">
                            ⚠️ Editing Conflict{conflicts.length > 1 ? 's' : ''} Detected — Save Blocked
                        </h3>
                        <p className="text-sm text-red-700 mb-3">
                            {conflicts.length} cell{conflicts.length !== 1 ? 's have' : ' has'} conflicting changes.
                            <strong> You must resolve all conflicts before you can save or commit.</strong>
                        </p>

                        {/* Conflict List */}
                        <div className="space-y-2">
                            {conflicts.slice(0, 3).map((conflict, index) => (
                                <div key={index} className="bg-white rounded p-2 text-xs border border-red-200">
                                    <span className="font-mono font-semibold text-blue-600">
                                        {conflict.cellReference}
                                    </span>
                                    <span className="text-gray-600 mx-2">•</span>
                                    <span className="text-gray-700">
                                        My value: <span className="font-medium text-green-700">{conflict.yourValue}</span>
                                    </span>
                                    <span className="text-gray-600 mx-2">vs</span>
                                    <span className="text-gray-700">
                                        {conflict.theirUser}'s value: <span className="font-medium text-red-700">{conflict.theirValue}</span>
                                    </span>
                                </div>
                            ))}
                            {conflicts.length > 3 && (
                                <p className="text-xs text-red-700">
                                    +{conflicts.length - 3} more conflict{conflicts.length - 3 !== 1 ? 's' : ''}
                                </p>
                            )}
                        </div>

                        {/* Save Blocked Warning */}
                        <div className="flex items-center space-x-2 mt-3 text-xs text-red-600 bg-red-100 rounded px-3 py-1.5">
                            {(FiLock as any)({ size: 14, className: "flex-shrink-0" })}
                            <span>Save & commit are disabled until all conflicts are resolved.</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-3 mt-3">
                            <button
                                onClick={onResolve}
                                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold shadow-sm"
                            >
                                Resolve Conflicts Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConflictNotificationBanner;
