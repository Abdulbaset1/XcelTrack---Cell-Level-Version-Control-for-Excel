import React from 'react';
import { FiEdit, FiPlus, FiTrash, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';

interface SemanticChange {
    type: 'formula_change' | 'value_change' | 'format_change' | 'cell_added' | 'cell_deleted';
    cellReference: string;
    description: string;
    impact?: 'low' | 'medium' | 'high';
}

interface SemanticDiffSummaryProps {
    changes: SemanticChange[];
}

const SemanticDiffSummary: React.FC<SemanticDiffSummaryProps> = ({ changes }) => {
    const getIcon = (type: string) => {
        switch (type) {
            case 'formula_change':
                return (FiEdit as any)({ className: "text-blue-500", size: 16 });
            case 'value_change':
                return (FiTrendingUp as any)({ className: "text-purple-500", size: 16 });
            case 'cell_added':
                return (FiPlus as any)({ className: "text-green-500", size: 16 });
            case 'cell_deleted':
                return (FiTrash as any)({ className: "text-red-500", size: 16 });
            default:
                return (FiAlertCircle as any)({ className: "text-gray-500", size: 16 });
        }
    };

    const getImpactBadge = (impact?: string) => {
        if (!impact) return null;

        const colors = {
            low: 'bg-green-100 text-green-700 border-green-200',
            medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            high: 'bg-red-100 text-red-700 border-red-200',
        };

        return (
            <span className={`px-2 py-0.5 border rounded text-xs font-medium ${colors[impact as keyof typeof colors]}`}>
                {impact.toUpperCase()} IMPACT
            </span>
        );
    };

    const groupedChanges = changes.reduce((acc, change) => {
        if (!acc[change.type]) {
            acc[change.type] = [];
        }
        acc[change.type].push(change);
        return acc;
    }, {} as Record<string, SemanticChange[]>);

    const typeLabels: Record<string, string> = {
        formula_change: 'Formula Changes',
        value_change: 'Value Updates',
        format_change: 'Formatting Changes',
        cell_added: 'Cells Added',
        cell_deleted: 'Cells Deleted',
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Summary</h3>

            {/* Statistics */}
            <div className="grid grid-cols-5 gap-3 mb-6">
                {Object.entries(groupedChanges).map(([type, items]) => (
                    <div key={type} className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="flex justify-center mb-1">{getIcon(type)}</div>
                        <div className="text-2xl font-bold text-gray-800">{items.length}</div>
                        <div className="text-xs text-gray-600">{typeLabels[type]}</div>
                    </div>
                ))}
            </div>

            {/* Detailed Changes */}
            <div className="space-y-4">
                {Object.entries(groupedChanges).map(([type, items]) => (
                    <div key={type}>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                            {getIcon(type)}
                            <span>{typeLabels[type]}</span>
                            <span className="text-gray-400">({items.length})</span>
                        </h4>
                        <div className="space-y-2">
                            {items.map((change, index) => (
                                <div
                                    key={index}
                                    className="bg-gray-50 rounded-lg p-3 flex items-start justify-between"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="font-mono text-xs font-semibold text-blue-600">
                                                {change.cellReference}
                                            </span>
                                            {getImpactBadge(change.impact)}
                                        </div>
                                        <p className="text-sm text-gray-700">{change.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {changes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p>No changes detected</p>
                </div>
            )}
        </div>
    );
};

export default SemanticDiffSummary;
