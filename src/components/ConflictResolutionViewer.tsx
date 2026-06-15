import React, { useState } from 'react';
import { FiCheck, FiShield, FiLock } from 'react-icons/fi';

interface ConflictItem {
    cellKey: string;       // Unique ID like "sheet-01:0:0"
    cellReference: string;   // Pretty name for display like "A1"
    yourValue: string;
    yourFormula?: string;
    theirValue: string;
    theirFormula?: string;
    theirUser: string;
    theirColor: string;
    conflictId?: number;
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
        <div className="bg-white rounded-xl border border-red-200 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200">
                <div className="flex items-center space-x-3">
                    {(FiShield as any)({ className: "text-red-600", size: 28 })}
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            Resolve Conflicts
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                {conflicts.length}
                            </span>
                        </h2>
                        <p className="text-sm text-gray-600 mt-0.5">
                            {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} need{conflicts.length === 1 ? 's' : ''} your attention.
                            Choose which value to keep for each cell.
                        </p>
                    </div>
                </div>

                {/* Save blocked notice */}
                <div className="mt-3 flex items-center gap-2 text-xs text-red-700 bg-red-100 rounded-lg px-3 py-2">
                    {(FiLock as any)({ size: 14, className: "flex-shrink-0" })}
                    <span className="font-medium">Save & commit are blocked until all conflicts are resolved.</span>
                </div>
            </div>

            {/* Conflicts List */}
            <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
                {conflicts.map((conflict, index) => (
                    <div key={index} className={`border rounded-xl p-5 transition-all ${
                        resolutions[conflict.cellKey]
                            ? 'border-green-300 bg-green-50/30'
                            : 'border-red-200 bg-white'
                    }`}>
                        {/* Cell Reference */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-500 text-xs font-bold">
                                    {index + 1}
                                </span>
                                <h3 className="font-mono font-bold text-lg text-blue-600">
                                    {conflict.cellReference}
                                </h3>
                            </div>
                            {resolutions[conflict.cellKey] && (
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                    {(FiCheck as any)({ size: 12 })}
                                    Resolved
                                </span>
                            )}
                        </div>

                        {/* Side-by-side comparison */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {/* Owner's Version (My value) */}
                            <button
                                onClick={() => handleSelectResolution(conflict.cellKey, 'yours')}
                                className={`border-2 rounded-xl p-4 text-left transition-all hover:shadow-md ${resolutions[conflict.cellKey] === 'yours'
                                    ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                                    : 'border-gray-200 hover:border-blue-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                        <span className="text-sm font-bold text-gray-800">My value</span>
                                    </div>
                                    {resolutions[conflict.cellKey] === 'yours' && (
                                        (FiCheck as any)({ className: "text-blue-600", size: 20 })
                                    )}
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-gray-100">
                                    <div className="text-base text-gray-900 font-semibold">
                                        {safelyRenderValue(conflict.yourValue) || <span className="text-gray-400 italic">empty</span>}
                                    </div>
                                    {conflict.yourFormula && (
                                        <div className="text-xs text-purple-600 font-mono mt-1">
                                            = {safelyRenderValue(conflict.yourFormula)}
                                        </div>
                                    )}
                                </div>
                            </button>

                            {/* Collaborator's Version */}
                            <button
                                onClick={() => handleSelectResolution(conflict.cellKey, 'theirs')}
                                className={`border-2 rounded-xl p-4 text-left transition-all hover:shadow-md ${resolutions[conflict.cellKey] === 'theirs'
                                    ? 'border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-200'
                                    : 'border-gray-200 hover:border-emerald-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: conflict.theirColor }}
                                        ></div>
                                        <span className="text-sm font-bold text-gray-800">
                                            {conflict.theirUser}'s value
                                        </span>
                                    </div>
                                    {resolutions[conflict.cellKey] === 'theirs' && (
                                        (FiCheck as any)({ className: "text-emerald-600", size: 20 })
                                    )}
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-gray-100">
                                    <div className="text-base text-gray-900 font-semibold">
                                        {safelyRenderValue(conflict.theirValue) || <span className="text-gray-400 italic">empty</span>}
                                    </div>
                                    {conflict.theirFormula && (
                                        <div className="text-xs text-purple-600 font-mono mt-1">
                                            = {safelyRenderValue(conflict.theirFormula)}
                                        </div>
                                    )}
                                </div>
                            </button>
                        </div>

                        {/* Custom Value Option */}
                        <div className="border-t border-gray-200 pt-4">
                            <label className="text-sm font-medium text-gray-600 mb-2 block">
                                Or enter a custom value:
                            </label>
                            <input
                                type="text"
                                value={customValues[conflict.cellKey] || ''}
                                onChange={(e) => handleCustomValue(conflict.cellKey, e.target.value)}
                                placeholder="Enter custom value..."
                                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                                    resolutions[conflict.cellKey] === 'custom'
                                        ? 'border-amber-400 ring-2 ring-amber-200 bg-amber-50'
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1.5">
                        {conflicts.map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                    resolutions[conflicts[i].cellKey] ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                            />
                        ))}
                    </div>
                    <p className="text-sm text-gray-600 font-medium">
                        {Object.keys(resolutions).length} of {conflicts.length} resolved
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="px-5 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                        >
                            Back to Editor
                        </button>
                    )}
                    <button
                        onClick={handleResolveAll}
                        disabled={!allResolved}
                        className={`px-6 py-2.5 rounded-lg transition-all text-sm font-semibold shadow-sm ${allResolved
                            ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-200'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {allResolved ? '✓ Apply All Resolutions' : `Resolve ${conflicts.length - Object.keys(resolutions).length} Remaining`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConflictResolutionViewer;
