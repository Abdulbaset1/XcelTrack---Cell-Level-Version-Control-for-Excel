import React from 'react';

interface SkeletonLoaderProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    borderRadius?: string;
    shape?: 'rectangle' | 'circle' | 'text';
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    className = '',
    width = '100%',
    height = '20px',
    borderRadius = '4px',
    shape = 'rectangle',
}) => {
    const style: React.CSSProperties = {
        width,
        height,
        borderRadius: shape === 'circle' ? '50%' : borderRadius,
    };

    return (
        <div
            className={`bg-gray-200 animate-pulse ${className}`}
            style={style}
            role="status"
            aria-label="Loading..."
        >
            <span className="sr-only">Loading...</span>
        </div>
    );
};

export default SkeletonLoader;
