import React, { useState } from 'react';

interface TooltipProps {
    content: string;
    children: React.ReactElement;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    const arrowClasses = {
        top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800',
        left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800',
        right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-800',
    };

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded shadow-sm whitespace-nowrap transition-opacity duration-200 ${positionClasses[position]}`}>
                    {content}
                    <div className={`absolute border-4 border-transparent ${arrowClasses[position]}`} />
                </div>
            )}
        </div>
    );
};

export default Tooltip;
