import React, { useState } from 'react';
import { FiFilter, FiX, FiCalendar, FiUser, FiGrid } from 'react-icons/fi';

interface FilterOptions {
    user?: string;
    dateFrom?: string;
    dateTo?: string;
    cellReference?: string;
}

interface VersionHistoryFiltersProps {
    onFilterChange?: (filters: FilterOptions) => void;
    users?: string[];
}

const VersionHistoryFilters: React.FC<VersionHistoryFiltersProps> = ({
    onFilterChange,
    users = [],
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState<FilterOptions>({});

    const handleFilterChange = (key: keyof FilterOptions, value: string) => {
        const newFilters = { ...filters, [key]: value || undefined };
        setFilters(newFilters);
        onFilterChange?.(newFilters);
    };

    const clearFilters = () => {
        setFilters({});
        onFilterChange?.({});
    };

    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    return (
        <div className="relative">
            {/* Filter Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
                {(FiFilter as any)({ size: 16 })}
                <span className="text-sm font-medium">Filters</span>
                {activeFilterCount > 0 && (
                    <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {/* Filter Panel */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-800">Filter History</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                {(FiX as any)({ size: 18 })}
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* User Filter */}
                            <div>
                                <label className="flex items-center space-x-2 text-xs font-medium text-gray-700 mb-2">
                                    {(FiUser as any)({ size: 14 })}
                                    <span>User</span>
                                </label>
                                <select
                                    value={filters.user || ''}
                                    onChange={(e) => handleFilterChange('user', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Users</option>
                                    {users.map((user) => (
                                        <option key={user} value={user}>
                                            {user}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Range */}
                            <div>
                                <label className="flex items-center space-x-2 text-xs font-medium text-gray-700 mb-2">
                                    {(FiCalendar as any)({ size: 14 })}
                                    <span>Date Range</span>
                                </label>
                                <div className="space-y-2">
                                    <input
                                        type="date"
                                        value={filters.dateFrom || ''}
                                        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                        placeholder="From"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="date"
                                        value={filters.dateTo || ''}
                                        onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                        placeholder="To"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Cell Reference */}
                            <div>
                                <label className="flex items-center space-x-2 text-xs font-medium text-gray-700 mb-2">
                                    {(FiGrid as any)({ size: 14 })}
                                    <span>Cell Reference</span>
                                </label>
                                <input
                                    type="text"
                                    value={filters.cellReference || ''}
                                    onChange={(e) => handleFilterChange('cellReference', e.target.value)}
                                    placeholder="e.g., A1, B5:C10"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                            <button
                                onClick={clearFilters}
                                className="text-sm text-gray-600 hover:text-gray-800"
                            >
                                Clear All
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VersionHistoryFilters;
