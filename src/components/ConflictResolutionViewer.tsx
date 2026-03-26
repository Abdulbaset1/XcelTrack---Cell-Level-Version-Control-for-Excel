import React, { useState } from 'react';
import { FiCheck, FiAlertCircle } from 'react-icons/fi';

interface ConflictItem {
    cellKey: string;       // Unique ID like "sheet-01:0:0"
    cellReference: string;   // Pretty name for display like "A1"
    yourValue: string;
    yourFormula?: string;
    theirValue: string;
    theirFormula?: string;
    theirUser: string;
    theirColor: string;
}

interface ConflictResolutionViewerProps {
    conflicts: ConflictItem[];
    onResolve?: (resolutions: Record<string, 'yours' | 'theirs' | 'custom'>) => void;
    onCancel?: () => void;
}

const ConflictResolutionViewer: React.FC<ConflictResolutionViewerProps> = ({
    conflicts,
    onResolve,
    onCancel,
}) => {
    const [resolutions, setResolutions] = useState<Record<string, 'yours' | 'theirs' | 'custom'>>({});
    const [customValues, setCustomValues] = useState<Record<string, string>>({});

    const safelyRenderValue = (val: any) => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') {
            return val.v !== undefined ? String(val.v) : JSON.stringify(val);
        }
        return String(val);
    };

    const handleSelectResolution = (cellKey: string, choice: 'yours' | 'theirs') => {
        setResolutions({ ...resolutions, [cellKey]: choice });
    };

    const handleCustomValue = (cellKey: string, value: string) => {
        setCustomValues({ ...customValues, [cellKey]: value });
        setResolutions({ ...resolutions, [cellKey]: 'custom' });
    };

    const handleResolveAll = () => {
        const resolutionData: Record<string, { choice: 'yours' | 'theirs' | 'custom', value: string }> = {};

        conflicts.forEach(conflict => {
            const choice = resolutions[conflict.cellKey];
            let value = '';

            if (choice === 'yours') value = conflict.yourValue;
            else if (choice === 'theirs') value = conflict.theirValue;
            else if (choice === 'custom') value = customValues[conflict.cellKey] || '';

            resolutionData[conflict.cellKey] = { choice, value };
        });

        onResolve?.(resolutionData as any);
    };

    const allResolved = conflicts.every((c) => resolutions[c.cellKey]);

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-lg">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
                <div className="flex items-center space-x-3">
                    {(FiAlertCircle as any)({ className: "text-yellow-600", size: 24 })}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">Resolve Conflicts</h2>
                        <p className="text-sm text-gray-600">
                            {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} need{conflicts.length === 1 ? 's' : ''} your attention
                        </p>
                    </div>
                </div>
            </div>

            {/* Conflicts List */}
            <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
                {conflicts.map((conflict, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                        {/* Cell Reference */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-mono font-semibold text-lg text-blue-600">
                                {conflict.cellReference}
                            </h3>
                            {resolutions[conflict.cellKey] && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                    ✓ Resolved
                                </span>
                            )}
                        </div>

                        {/* Side-by-side comparison */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {/* Your Version */}
                            <button
                                onClick={() => handleSelectResolution(conflict.cellKey, 'yours')}
                                className={`border-2 rounded-lg p-4 text-left transition-all ${resolutions[conflict.cellKey] === 'yours'
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-blue-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-gray-700">Your Version</span>
                                    {resolutions[conflict.cellKey] === 'yours' && (
                                        (FiCheck as any)({ className: "text-blue-500", size: 20 })
                                    )}
                                </div>
                                <div className="text-sm text-gray-900 font-medium mb-1">
                                    {safelyRenderValue(conflict.yourValue)}
                                </div>
                                {conflict.yourFormula && (
                                    <div className="text-xs text-purple-600 font-mono">
                                        = {safelyRenderValue(conflict.yourFormula)}
                                    </div>
                                )}
                            </button>

                            {/* Their Version */}
                            <button
                                onClick={() => handleSelectResolution(conflict.cellKey, 'theirs')}
                                className={`border-2 rounded-lg p-4 text-left transition-all ${resolutions[conflict.cellKey] === 'theirs'
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-green-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm font-semibold text-gray-700">
                                            {conflict.theirUser}'s Version
                                        </span>
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: conflict.theirColor }}
                                        ></div>
                                    </div>
                                    {resolutions[conflict.cellKey] === 'theirs' && (
                                        (FiCheck as any)({ className: "text-green-500", size: 20 })
                                    )}
                                </div>
                                <div className="text-sm text-gray-900 font-medium mb-1">
                                    {safelyRenderValue(conflict.theirValue)}
                                </div>
                                {conflict.theirFormula && (
                                    <div className="text-xs text-purple-600 font-mono">
                                        = {safelyRenderValue(conflict.theirFormula)}
                                    </div>
                                )}
                            </button>
                        </div>

                        {/* Custom Value Option */}
                        <div className="border-t border-gray-200 pt-4">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Or enter a custom value:
                            </label>
                            <input
                                type="text"
                                value={customValues[conflict.cellKey] || ''}
                                onChange={(e) => handleCustomValue(conflict.cellKey, e.target.value)}
                                placeholder="Enter custom value..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-600">
                    {Object.keys(resolutions).length} of {conflicts.length} resolved
                </p>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleResolveAll}
                        disabled={!allResolved}
                        className={`px-6 py-2 rounded-lg transition-colors ${allResolved
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        Apply Resolutions
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConflictResolutionViewer;
