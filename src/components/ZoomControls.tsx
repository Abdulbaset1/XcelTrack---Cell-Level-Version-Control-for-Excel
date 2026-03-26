import React, { useState } from 'react';
import { FiPlus, FiMinus, FiMaximize2 } from 'react-icons/fi';

interface ZoomControlsProps {
    initialZoom?: number;
    onZoomChange?: (zoom: number) => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
    initialZoom = 100,
    onZoomChange,
}) => {
    const [zoom, setZoom] = useState(initialZoom);

    const handleZoomIn = () => {
        const newZoom = Math.min(zoom + 10, 200);
        setZoom(newZoom);
        onZoomChange?.(newZoom);
    };

    const handleZoomOut = () => {
        const newZoom = Math.max(zoom - 10, 50);
        setZoom(newZoom);
        onZoomChange?.(newZoom);
    };

    const handleFitToScreen = () => {
        setZoom(100);
        onZoomChange?.(100);
    };

    const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value >= 50 && value <= 200) {
            setZoom(value);
            onZoomChange?.(value);
        }
    };

    return (
        <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
            {/* Zoom Out */}
            <button
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className={`p-1 rounded transition-colors ${zoom <= 50
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                title="Zoom Out"
                aria-label="Zoom Out"
            >
                {(FiMinus as any)({ size: 16 })}
            </button>

            {/* Zoom Percentage */}
            <div className="flex items-center">
                <input
                    type="number"
                    value={zoom}
                    onChange={handleZoomInputChange}
                    min="50"
                    max="200"
                    className="w-12 text-center text-sm font-medium text-gray-700 bg-transparent focus:outline-none"
                    aria-label="Zoom Percentage"
                />
                <span className="text-sm text-gray-500" aria-hidden="true">%</span>
            </div>

            {/* Zoom In */}
            <button
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className={`p-1 rounded transition-colors ${zoom >= 200
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                title="Zoom In"
                aria-label="Zoom In"
            >
                {(FiPlus as any)({ size: 16 })}
            </button>

            {/* Divider */}
            <div className="h-4 w-px bg-gray-300" aria-hidden="true"></div>

            {/* Fit to Screen */}
            <button
                onClick={handleFitToScreen}
                className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Fit to Screen"
                aria-label="Fit to Screen"
            >
                {(FiMaximize2 as any)({ size: 16 })}
            </button>
        </div>
    );
};

export default ZoomControls;
