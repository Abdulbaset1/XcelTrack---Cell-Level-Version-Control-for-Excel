import React from 'react';
import {
  FiSave,
  FiDownload,
  FiUpload,
} from 'react-icons/fi';
import Tooltip from './Tooltip';

interface EditorToolbarProps {
  onSave?: (data?: any) => void;
  onDownload?: () => void;
  onUpload?: () => void;
  onFormatChange?: (format: any) => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onSave,
  onDownload,
  onUpload,
}) => {

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 sm:px-4 py-2 gap-2 sm:gap-0">
        {/* Top Row on Mobile: File Actions */}
        <div className="flex items-center justify-between w-full sm:w-auto overflow-x-auto no-scrollbar">
          {/* File Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2 mr-4">
            <Tooltip content="Save Changes (Ctrl+S)">
              <button
                onClick={onSave}
                className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                aria-label="Save"
              >
                {(FiSave as any)({ size: 16 })}
                <span className="hidden sm:inline text-sm font-medium">Save</span>
              </button>
            </Tooltip>
            <Tooltip content="Upload New File">
              <button
                onClick={onUpload}
                className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                aria-label="Upload"
              >
                {(FiUpload as any)({ size: 16 })}
                <span className="hidden sm:inline text-sm font-medium">Upload</span>
              </button>
            </Tooltip>
            <Tooltip content="Download XLSX">
              <button
                onClick={onDownload}
                className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                aria-label="Download"
              >
                {(FiDownload as any)({ size: 16 })}
                <span className="hidden sm:inline text-sm font-medium">Download</span>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;