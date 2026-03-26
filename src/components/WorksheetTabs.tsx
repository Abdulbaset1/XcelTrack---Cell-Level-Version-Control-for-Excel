import React, { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiMoreVertical } from 'react-icons/fi';

interface Worksheet {
    id: string;
    name: string;
    position: number;
}

interface WorksheetTabsProps {
    worksheets: Worksheet[];
    activeWorksheetId: string;
    onWorksheetChange?: (worksheetId: string) => void;
    onWorksheetCreate?: () => void;
    onWorksheetRename?: (worksheetId: string, newName: string) => void;
    onWorksheetDelete?: (worksheetId: string) => void;
    onWorksheetReorder?: (worksheets: Worksheet[]) => void;
}

const WorksheetTabs: React.FC<WorksheetTabsProps> = ({
    worksheets,
    activeWorksheetId,
    onWorksheetChange,
    onWorksheetCreate,
    onWorksheetRename,
    onWorksheetDelete,
    onWorksheetReorder,
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [contextMenuId, setContextMenuId] = useState<string | null>(null);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    const handleTabClick = (worksheetId: string) => {
        if (editingId !== worksheetId) {
            onWorksheetChange?.(worksheetId);
        }
    };

    const handleDoubleClick = (worksheet: Worksheet) => {
        setEditingId(worksheet.id);
        setEditingName(worksheet.name);
    };

    const handleRenameSubmit = (worksheetId: string) => {
        if (editingName.trim() && editingName !== worksheets.find(w => w.id === worksheetId)?.name) {
            onWorksheetRename?.(worksheetId, editingName.trim());
        }
        setEditingId(null);
        setEditingName('');
    };

    const handleRenameKeyDown = (e: React.KeyboardEvent, worksheetId: string) => {
        if (e.key === 'Enter') {
            handleRenameSubmit(worksheetId);
        } else if (e.key === 'Escape') {
            setEditingId(null);
            setEditingName('');
        }
    };

    const handleDelete = (worksheetId: string) => {
        if (worksheets.length > 1) {
            if (window.confirm('Are you sure you want to delete this worksheet?')) {
                onWorksheetDelete?.(worksheetId);
            }
        } else {
            alert('Cannot delete the last worksheet!');
        }
        setContextMenuId(null);
    };

    // Drag and Drop handlers
    const handleDragStart = (e: React.DragEvent, worksheetId: string) => {
        setDraggedId(worksheetId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', worksheetId);
    };

    const handleDragOver = (e: React.DragEvent, worksheetId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverId(worksheetId);
    };

    const handleDragLeave = () => {
        setDragOverId(null);
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();

        if (!draggedId || draggedId === targetId) {
            setDraggedId(null);
            setDragOverId(null);
            return;
        }

        const draggedIndex = worksheets.findIndex(w => w.id === draggedId);
        const targetIndex = worksheets.findIndex(w => w.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) {
            setDraggedId(null);
            setDragOverId(null);
            return;
        }

        const newWorksheets = [...worksheets];
        const [removed] = newWorksheets.splice(draggedIndex, 1);
        newWorksheets.splice(targetIndex, 0, removed);

        // Update positions
        const reorderedWorksheets = newWorksheets.map((ws, index) => ({
            ...ws,
            position: index,
        }));

        onWorksheetReorder?.(reorderedWorksheets);
        setDraggedId(null);
        setDragOverId(null);
    };

    const handleDragEnd = () => {
        setDraggedId(null);
        setDragOverId(null);
    };

    return (
        <div className="bg-gray-100 border-t border-gray-300 px-2 sm:px-4 py-2 transition-all duration-300">
            <div className="flex items-center space-x-2">
                {/* Worksheet Tabs */}
                <div className="flex items-center space-x-1 flex-1 overflow-x-auto no-scrollbar mask-gradient-right pb-1">
                    {worksheets.map((worksheet) => (
                        <div
                            key={worksheet.id}
                            draggable={editingId !== worksheet.id}
                            onDragStart={(e) => handleDragStart(e, worksheet.id)}
                            onDragOver={(e) => handleDragOver(e, worksheet.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, worksheet.id)}
                            onDragEnd={handleDragEnd}
                            className={`relative group flex-shrink-0 ${activeWorksheetId === worksheet.id
                                ? 'bg-white border-t-2 border-blue-500 shadow-sm'
                                : 'bg-gray-200 hover:bg-gray-300'
                                } ${dragOverId === worksheet.id && draggedId !== worksheet.id
                                    ? 'border-l-2 border-blue-400'
                                    : ''
                                } ${draggedId === worksheet.id ? 'opacity-50' : ''
                                } rounded-t-lg transition-all cursor-pointer`}
                        >
                            <div
                                onClick={() => handleTabClick(worksheet.id)}
                                onDoubleClick={() => handleDoubleClick(worksheet)}
                                className="flex items-center px-3 sm:px-4 py-2 min-w-[100px] sm:min-w-[120px] max-w-[150px] sm:max-w-[200px]"
                            >
                                {editingId === worksheet.id ? (
                                    <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        onBlur={() => handleRenameSubmit(worksheet.id)}
                                        onKeyDown={(e) => handleRenameKeyDown(e, worksheet.id)}
                                        className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none"
                                        autoFocus
                                    />
                                ) : (
                                    <>
                                        <span className="text-sm font-medium text-gray-700 flex-1 truncate" title={worksheet.name}>
                                            {worksheet.name}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setContextMenuId(contextMenuId === worksheet.id ? null : worksheet.id);
                                            }}
                                            className={`ml-2 p-1 rounded transition-opacity ${activeWorksheetId === worksheet.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} hover:bg-gray-300`}
                                            aria-label="Tab Options"
                                        >
                                            {(FiMoreVertical as any)({ size: 14 })}
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Context Menu */}
                            {contextMenuId === worksheet.id && (
                                <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[140px]">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDoubleClick(worksheet);
                                            setContextMenuId(null);
                                        }}
                                        className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors first:rounded-t-lg"
                                    >
                                        {(FiEdit2 as any)({ size: 14 })}
                                        <span>Rename</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(worksheet.id);
                                        }}
                                        className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors last:rounded-b-lg"
                                    >
                                        {(FiTrash2 as any)({ size: 14 })}
                                        <span>Delete</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Add Worksheet Button */}
                <button
                    onClick={onWorksheetCreate}
                    className="flex items-center justify-center space-x-1 px-2 sm:px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors flex-shrink-0"
                    title="Add Worksheet"
                    aria-label="Add Worksheet"
                >
                    {(FiPlus as any)({ size: 16 })}
                    <span className="hidden sm:inline text-sm font-medium text-gray-700">Add Sheet</span>
                </button>
            </div>
        </div>
    );
};

export default WorksheetTabs;
