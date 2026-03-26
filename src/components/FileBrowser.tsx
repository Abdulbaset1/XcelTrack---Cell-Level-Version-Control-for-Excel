import React, { useState } from 'react';
import { FiFile, FiFolder, FiMoreVertical, FiDownload, FiTrash2, FiClock } from 'react-icons/fi';

interface WorkbookFile {
    id: string;
    name: string;
    owner: string;
    size: number;
    lastModified: Date;
    worksheetCount: number;
}

interface FileBrowserProps {
    files: WorkbookFile[];
    onFileSelect?: (fileId: string) => void;
    onFileDelete?: (fileId: string) => void;
    onFileDownload?: (fileId: string) => void;
}

const FileBrowser: React.FC<FileBrowserProps> = ({
    files,
    onFileSelect,
    onFileDelete,
    onFileDownload,
}) => {
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const [contextMenuId, setContextMenuId] = useState<string | null>(null);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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

    const handleFileClick = (fileId: string) => {
        setSelectedFileId(fileId);
        onFileSelect?.(fileId);
    };

    const handleDelete = (fileId: string) => {
        if (window.confirm('Are you sure you want to delete this file?')) {
            onFileDelete?.(fileId);
        }
        setContextMenuId(null);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase">
                    <div className="col-span-5">Name</div>
                    <div className="col-span-2">Owner</div>
                    <div className="col-span-2">Size</div>
                    <div className="col-span-2">Last Modified</div>
                    <div className="col-span-1"></div>
                </div>
            </div>

            {/* File List */}
            <div className="divide-y divide-gray-200">
                {files.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        {(FiFolder as any)({ size: 48, className: "mx-auto text-gray-300 mb-4" })}
                        <p className="text-gray-500 text-sm">No files yet</p>
                        <p className="text-gray-400 text-xs mt-1">Upload an Excel file to get started</p>
                    </div>
                ) : (
                    files.map((file) => (
                        <div
                            key={file.id}
                            onClick={() => handleFileClick(file.id)}
                            className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedFileId === file.id ? 'bg-blue-50' : ''
                                }`}
                        >
                            {/* Name */}
                            <div className="col-span-5 flex items-center space-x-3">
                                {(FiFile as any)({ className: "text-blue-500 flex-shrink-0", size: 20 })}
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500">{file.worksheetCount} worksheet{file.worksheetCount !== 1 ? 's' : ''}</p>
                                </div>
                            </div>

                            {/* Owner */}
                            <div className="col-span-2 flex items-center">
                                <p className="text-sm text-gray-600 truncate">{file.owner}</p>
                            </div>

                            {/* Size */}
                            <div className="col-span-2 flex items-center">
                                <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                            </div>

                            {/* Last Modified */}
                            <div className="col-span-2 flex items-center space-x-1">
                                {(FiClock as any)({ size: 14, className: "text-gray-400" })}
                                <p className="text-sm text-gray-600">{formatDate(file.lastModified)}</p>
                            </div>

                            {/* Actions */}
                            <div className="col-span-1 flex items-center justify-end relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setContextMenuId(contextMenuId === file.id ? null : file.id);
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                >
                                    {(FiMoreVertical as any)({ size: 16, className: "text-gray-500" })}
                                </button>

                                {/* Context Menu */}
                                {contextMenuId === file.id && (
                                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onFileDownload?.(file.id);
                                                setContextMenuId(null);
                                            }}
                                            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            {(FiDownload as any)({ size: 14 })}
                                            <span>Download</span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(file.id);
                                            }}
                                            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-lg"
                                        >
                                            {(FiTrash2 as any)({ size: 14 })}
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FileBrowser;
