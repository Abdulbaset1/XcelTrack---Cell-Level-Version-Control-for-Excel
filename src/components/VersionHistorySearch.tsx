import React, { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

interface VersionHistorySearchProps {
    onSearch?: (query: string) => void;
    placeholder?: string;
}

const VersionHistorySearch: React.FC<VersionHistorySearchProps> = ({
    onSearch,
    placeholder = 'Search commits, messages, or cell references...',
}) => {
    const [query, setQuery] = useState('');

    const handleSearch = (value: string) => {
        setQuery(value);
        onSearch?.(value);
    };

    const clearSearch = () => {
        setQuery('');
        onSearch?.('');
    };

    return (
        <div className="relative">
            <div className="relative">
                {(FiSearch as any)({ className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400", size: 18 })}
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {query && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        {(FiX as any)({ size: 18 })}
                    </button>
                )}
            </div>
        </div>
    );
};

export default VersionHistorySearch;
