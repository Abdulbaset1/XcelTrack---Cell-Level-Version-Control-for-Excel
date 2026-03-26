import React from 'react';

interface CellDiff {
    cellReference: string;
    changeType: 'added' | 'modified' | 'deleted' | 'unchanged';
    oldValue?: string;
    newValue?: string;
    oldFormula?: string;
    newFormula?: string;
}

interface DiffHighlighterProps {
    diffs: CellDiff[];
    viewMode?: 'side-by-side' | 'unified';
}

const DiffHighlighter: React.FC<DiffHighlighterProps> = ({
    diffs,
    viewMode = 'side-by-side',
}) => {
    const getCellColor = (changeType: string) => {
        switch (changeType) {
            case 'added':
                return 'bg-green-100 border-green-300';
            case 'modified':
                return 'bg-yellow-100 border-yellow-300';
            case 'deleted':
                return 'bg-red-100 border-red-300';
            default:
                return 'bg-white border-gray-200';
        }
    };

    if (viewMode === 'side-by-side') {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="grid grid-cols-2 gap-4">
                    {/* Before Column */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Before</h3>
                        <div className="space-y-2">
                            {diffs.map((diff, index) => (
                                <div
                                    key={`before-${index}`}
                                    className={`border rounded p-3 ${diff.changeType === 'added'
                                            ? 'bg-gray-50 border-gray-200 opacity-50'
                                            : getCellColor(diff.changeType)
                                        }`}
                                >
                                    <div className="font-mono text-xs font-semibold text-gray-600 mb-1">
                                        {diff.cellReference}
                                    </div>
                                    {diff.changeType !== 'added' && (
                                        <>
                                            {diff.oldValue !== undefined && (
                                                <div className="text-sm">{diff.oldValue || '(empty)'}</div>
                                            )}
                                            {diff.oldFormula && (
                                                <div className="text-xs text-purple-600 font-mono mt-1">
                                                    = {diff.oldFormula}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* After Column */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">After</h3>
                        <div className="space-y-2">
                            {diffs.map((diff, index) => (
                                <div
                                    key={`after-${index}`}
                                    className={`border rounded p-3 ${diff.changeType === 'deleted'
                                            ? 'bg-gray-50 border-gray-200 opacity-50'
                                            : getCellColor(diff.changeType)
                                        }`}
                                >
                                    <div className="font-mono text-xs font-semibold text-gray-600 mb-1">
                                        {diff.cellReference}
                                    </div>
                                    {diff.changeType !== 'deleted' && (
                                        <>
                                            {diff.newValue !== undefined && (
                                                <div className="text-sm">{diff.newValue || '(empty)'}</div>
                                            )}
                                            {diff.newFormula && (
                                                <div className="text-xs text-purple-600 font-mono mt-1">
                                                    = {diff.newFormula}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-6 text-xs">
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                            <span className="text-gray-600">Added</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                            <span className="text-gray-600">Modified</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                            <span className="text-gray-600">Deleted</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Unified view
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Changes</h3>
            <div className="space-y-2">
                {diffs.map((diff, index) => (
                    <div
                        key={index}
                        className={`border rounded p-3 ${getCellColor(diff.changeType)}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="font-mono text-xs font-semibold text-gray-600">
                                {diff.cellReference}
                            </div>
                            <span className="px-2 py-0.5 bg-white bg-opacity-50 rounded text-xs font-medium uppercase">
                                {diff.changeType}
                            </span>
                        </div>

                        {diff.changeType !== 'unchanged' && (
                            <div className="space-y-1 text-sm">
                                {diff.oldValue !== undefined && diff.changeType !== 'added' && (
                                    <div className="flex items-start space-x-2">
                                        <span className="text-red-600 font-medium">-</span>
                                        <span className="line-through text-gray-600">{diff.oldValue || '(empty)'}</span>
                                    </div>
                                )}
                                {diff.newValue !== undefined && diff.changeType !== 'deleted' && (
                                    <div className="flex items-start space-x-2">
                                        <span className="text-green-600 font-medium">+</span>
                                        <span className="text-gray-900">{diff.newValue || '(empty)'}</span>
                                    </div>
                                )}
                                {diff.oldFormula && diff.changeType !== 'added' && (
                                    <div className="flex items-start space-x-2 text-xs">
                                        <span className="text-red-600 font-medium">-</span>
                                        <span className="line-through text-purple-600 font-mono">= {diff.oldFormula}</span>
                                    </div>
                                )}
                                {diff.newFormula && diff.changeType !== 'deleted' && (
                                    <div className="flex items-start space-x-2 text-xs">
                                        <span className="text-green-600 font-medium">+</span>
                                        <span className="text-purple-600 font-mono">= {diff.newFormula}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DiffHighlighter;
