import React, { useState, useRef, DragEvent } from 'react';
import { FiUpload, FiX, FiFile } from 'react-icons/fi';

interface FileUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFileSelect: (file: File) => void;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
    isOpen,
    onClose,
    onFileSelect,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (isValidExcelFile(file)) {
                setSelectedFile(file);
            } else {
                alert('Please upload a valid Modern Excel file (.xlsx). Legacy .xls files are not supported at this time.');
            }
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (isValidExcelFile(file)) {
                setSelectedFile(file);
            } else {
                alert('Please upload a valid Modern Excel file (.xlsx). Legacy .xls files are not supported at this time.');
            }
        }
    };

    const isValidExcelFile = (file: File): boolean => {
        const validExtensions = ['.xlsx'];
        const fileName = file.name.toLowerCase();
        return validExtensions.some((ext) => fileName.endsWith(ext));
    };

    const handleUpload = () => {
        if (selectedFile) {
            onFileSelect(selectedFile);
            setSelectedFile(null);
            onClose();
        }
    };

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">Upload Excel File</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                        aria-label="Close Modal"
                    >
                        {(FiX as any)({ size: 24 })}
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Drag and Drop Area */}
                    <div
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${isDragging
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 bg-gray-50'
                            }`}
                    >
                        {(FiUpload as any)({
                            size: 48,
                            className: `mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`
                        })}
                        <p className="text-lg font-semibold text-gray-700 mb-2">
                            {isDragging ? 'Drop your file here' : 'Drag & drop your Excel file here'}
                        </p>
                        <p className="text-sm text-gray-500 mb-4">or</p>
                        <button
                            onClick={handleBrowseClick}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Browse Files
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileInputChange}
                            className="hidden"
                        />
                        <p className="text-xs text-gray-400 mt-4">
                            Supported formats: .xlsx (Modern Excel)
                        </p>
                    </div>

                    {/* Selected File Display */}
                    {selectedFile && (
                        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    {(FiFile as any)({ className: "text-green-600", size: 24 })}
                                    <div>
                                        <p className="font-semibold text-gray-800">{selectedFile.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {formatFileSize(selectedFile.size)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedFile(null)}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                    aria-label="Remove File"
                                >
                                    {(FiX as any)({ size: 20 })}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile}
                        className={`px-6 py-2 rounded-lg transition-colors ${selectedFile
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        Upload
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FileUploadModal;
