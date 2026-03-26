import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    color = 'text-blue-500',
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className={`${sizeClasses[size]} ${color} animate-spin`}>
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
            </svg>
        </div>
    );
};

interface LoadingStateProps {
    message?: string;
    fullScreen?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({
    message = 'Loading...',
    fullScreen = false,
}) => {
    const containerClass = fullScreen
        ? 'fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50'
        : 'flex items-center justify-center p-12';

    return (
        <div className={containerClass}>
            <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600 text-sm">{message}</p>
            </div>
        </div>
    );
};

interface SkeletonProps {
    className?: string;
    count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', count = 1 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className={`animate-pulse bg-gray-200 rounded ${className}`}
                ></div>
            ))}
        </>
    );
};

const TableSkeleton: React.FC = () => {
    return (
        <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-16 w-full" count={5} />
        </div>
    );
};

const CardSkeleton: React.FC = () => {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" count={3} />
            <Skeleton className="h-10 w-1/4" />
        </div>
    );
};

export { LoadingSpinner, LoadingState, Skeleton, TableSkeleton, CardSkeleton };
export default LoadingState;
