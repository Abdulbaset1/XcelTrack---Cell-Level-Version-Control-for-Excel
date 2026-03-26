import React, { useState, useEffect } from 'react';

interface FormulaBarProps {
    selectedCell?: string;
    cellFormula?: string;
    onFormulaChange?: (formula: string) => void;
    onFormulaSubmit?: (formula: string) => void;
}

const FormulaBar: React.FC<FormulaBarProps> = ({
    selectedCell = 'A1',
    cellFormula = '',
    onFormulaChange,
    onFormulaSubmit,
}) => {
    const [formula, setFormula] = useState(cellFormula);

    useEffect(() => {
        setFormula(cellFormula);
    }, [cellFormula]);

    const handleFormulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFormula = e.target.value;
        setFormula(newFormula);
        onFormulaChange?.(newFormula);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onFormulaSubmit?.(formula);
        }
        if (e.key === 'Escape') {
            setFormula(cellFormula);
        }
    };

    return (
        <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-2 transition-all duration-300">
            <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Cell Reference Display */}
                <div className="flex items-center flex-shrink-0">
                    <div className="px-2 sm:px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg font-mono text-sm font-semibold text-gray-700 min-w-[50px] sm:min-w-[80px] text-center transition-all">
                        {selectedCell}
                    </div>
                </div>

                {/* Formula Input */}
                <div className="flex-1 flex items-center min-w-0">
                    <span className="text-gray-500 mr-2 font-mono text-sm flex-shrink-0">fx</span>
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={formula}
                            onChange={handleFormulaChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter formula or value..."
                            className="w-full px-2 sm:px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    onClick={() => onFormulaSubmit?.(formula)}
                    className="px-2 sm:px-4 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex-shrink-0"
                    aria-label="Apply Formula"
                >
                    <span className="hidden sm:inline">✓ Apply</span>
                    <span className="sm:hidden">✓</span>
                </button>
            </div>
        </div>
    );
};

export default FormulaBar;
