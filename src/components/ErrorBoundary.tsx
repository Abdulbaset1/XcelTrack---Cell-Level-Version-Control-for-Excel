import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });
        // Here you would typically log to an error reporting service
    }

    handleReset = () => {
        this.props.onReset?.();
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[50vh] flex items-center justify-center bg-gray-50 p-6">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            {(FiAlertTriangle as any)({ className: "text-red-600", size: 32 })}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-3">
                            Something went wrong
                        </h2>
                        <p className="text-gray-600 mb-8">
                            We encountered an unexpected error. Please try refreshing the page.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left border border-gray-200 overflow-hidden">
                                <p className="text-xs font-mono text-red-600 mb-2 font-semibold break-all">
                                    {this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <pre className="text-xs text-gray-500 overflow-auto max-h-40 custom-scrollbar">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                                onClick={this.handleReset}
                                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 font-medium"
                            >
                                {(FiRefreshCw as any)({ size: 16 })}
                                <span>Try Again</span>
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 font-medium"
                            >
                                {(FiRefreshCw as any)({ size: 16 })}
                                <span>Reload Page</span>
                            </button>
                            <button
                                onClick={() => window.location.href = '/dashboard'}
                                className="w-full sm:w-auto px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 font-medium"
                            >
                                {(FiHome as any)({ size: 16 })}
                                <span>Go Home</span>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
