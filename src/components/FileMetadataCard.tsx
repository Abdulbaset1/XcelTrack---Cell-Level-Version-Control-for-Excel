import React from 'react';
import { FiDownload, FiFile, FiUser, FiCalendar, FiLayers } from 'react-icons/fi';

interface FileMetadata {
    name: string;
    owner: string;
    createdAt: Date;
    lastModified: Date;
    size: number;
    worksheetCount: number;
    version: number;
}

interface FileMetadataCardProps {
    metadata: FileMetadata;
    onDownload?: () => void;
    onExport?: (format: 'xlsx' | 'csv' | 'pdf') => void;
}

const FileMetadataCard: React.FC<FileMetadataCardProps> = ({
    metadata,
    onDownload,
    onExport,
}) => {
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (date: Date): string => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">File Information</h3>

            <div className="space-y-4">
                {/* File Name */}
                <div className="flex items-start space-x-3">
                    {(FiFile as any)({ className: "text-blue-500 mt-1 flex-shrink-0", size: 20 })}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase font-medium">File Name</p>
                        <p className="text-sm text-gray-900 font-medium truncate">{metadata.name}</p>
                    </div>
                </div>

                {/* Owner */}
                <div className="flex items-start space-x-3">
                    {(FiUser as any)({ className: "text-green-500 mt-1 flex-shrink-0", size: 20 })}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase font-medium">Owner</p>
                        <p className="text-sm text-gray-900">{metadata.owner}</p>
                    </div>
                </div>

                {/* Created Date */}
                <div className="flex items-start space-x-3">
                    {(FiCalendar as any)({ className: "text-purple-500 mt-1 flex-shrink-0", size: 20 })}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase font-medium">Created</p>
                        <p className="text-sm text-gray-900">{formatDate(metadata.createdAt)}</p>
                    </div>
                </div>

                {/* Last Modified */}
                <div className="flex items-start space-x-3">
                    {(FiCalendar as any)({ className: "text-orange-500 mt-1 flex-shrink-0", size: 20 })}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase font-medium">Last Modified</p>
                        <p className="text-sm text-gray-900">{formatDate(metadata.lastModified)}</p>
                    </div>
                </div>

                {/* Worksheets */}
                <div className="flex items-start space-x-3">
                    {(FiLayers as any)({ className: "text-indigo-500 mt-1 flex-shrink-0", size: 20 })}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase font-medium">Worksheets</p>
                        <p className="text-sm text-gray-900">{metadata.worksheetCount} sheet{metadata.worksheetCount !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                {/* File Size */}
                <div className="flex items-start space-x-3">
                    {(FiFile as any)({ className: "text-gray-500 mt-1 flex-shrink-0", size: 20 })}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase font-medium">File Size</p>
                        <p className="text-sm text-gray-900">{formatFileSize(metadata.size)}</p>
                    </div>
                </div>

                {/* Version */}
                <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-1 flex-shrink-0">
                        <span className="text-xs font-bold text-blue-600">v</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase font-medium">Version</p>
                        <p className="text-sm text-gray-900">Version {metadata.version}</p>
                    </div>
                </div>
            </div>

            {/* Download/Export Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 uppercase font-medium mb-3">Download & Export</p>

                <div className="space-y-2">
                    {/* Download Original */}
                    <button
                        onClick={onDownload}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        {(FiDownload as any)({ size: 16 })}
                        <span className="text-sm font-medium">Download (.xlsx)</span>
                    </button>

                    {/* Export Options */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => onExport?.('csv')}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                        >
                            Export CSV
                        </button>
                        <button
                            onClick={() => onExport?.('pdf')}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                        >
                            Export PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FileMetadataCard;
