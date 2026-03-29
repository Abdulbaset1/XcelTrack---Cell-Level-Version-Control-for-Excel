import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ExcelEditor, { ExcelEditorRef } from '../components/ExcelEditor';
import EditorToolbar from '../components/EditorToolbar';
import FormulaBar from '../components/FormulaBar';
import ZoomControls from '../components/ZoomControls';
import WorksheetTabs from '../components/WorksheetTabs';
import FileUploadModal from '../components/FileUploadModal';
import CollaborativeCursors from '../components/CollaborativeCursors';
import WhosEditingSidebar from '../components/WhosEditingSidebar';
import VersionHistoryTimeline from '../components/VersionHistoryTimeline';
import RollbackModal from '../components/RollbackModal';
import SkeletonLoader from '../components/SkeletonLoader';
import { FiChevronLeft, FiChevronRight, FiSidebar } from 'react-icons/fi';
import { Commit } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { uploadWorkbook, getWorkbookData, createCommit, getCommitDetails, getCommitSnapshot, getCommitHistory, createWorksheet, renameWorksheet, deleteWorksheet, reorderWorksheets } from '../services/api';
import HybridSyncBanner from '../components/HybridSyncBanner';
import ConflictNotificationBanner from '../components/ConflictNotificationBanner';
import ConflictResolutionViewer from '../components/ConflictResolutionViewer';
import CommitDetailViewer from '../components/CommitDetailViewer';

const Editor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editorRef = React.useRef<ExcelEditorRef>(null);
  const { user } = useAuth();
  const { showToast } = useToast();
  const { joinWorkbook, leaveWorkbook, sendCursorMove, sendCellEdit, activeUsers, cursors, onCellChange, onConflict, onConflictResolved, resolveConflict } = useWebSocket();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [workbookData, setWorkbookData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState('A1');
  const [cellFormula, setCellFormula] = useState('');
  const [zoom, setZoom] = useState(100);
  const [worksheets, setWorksheets] = useState([
    { id: 'sheet-01', name: 'Sheet1', position: 0 },
  ]);
  const [activeWorksheetId, setActiveWorksheetId] = useState('sheet-01');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(true);
  const [selectedCommitForRollback, setSelectedCommitForRollback] = useState<Commit | null>(null);
  const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'offline' | 'error' | 'synced'>('synced');
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [isConflictViewerOpen, setIsConflictViewerOpen] = useState(false);
  const [selectedCommitDetails, setSelectedCommitDetails] = useState<any | null>(null);
  const [, setIsCommitDetailsLoading] = useState(false);
  const [baseCommitId, setBaseCommitId] = useState<number | null>(null);
  const [hasLocalEdits, setHasLocalEdits] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const fetchWorkbook = React.useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching workbook:', id);
      const data = await getWorkbookData(id);
      console.log('Workbook loaded:', data);
      setWorkbookData(data);

      try {
        const history = await getCommitHistory(parseInt(id), 1, 0);
        const latestCommit = history.commits?.[0];
        setBaseCommitId(latestCommit ? latestCommit.id : null);
      } catch (historyError) {
        console.warn('Unable to fetch latest commit for base version check:', historyError);
      }

      // Update worksheets state from loaded data if needed
      if (data.sheets) {
        const loadedSheets = Object.values(data.sheets).map((sheet: any) => ({
          id: sheet.id,
          name: sheet.name,
          position: 0 // logic to determine position
        }));
        setWorksheets(loadedSheets);
        if (loadedSheets.length > 0) setActiveWorksheetId(loadedSheets[0].id);
      }
    } catch (error) {
      console.error('Error fetching workbook:', error);
      setError('Failed to load workbook. Please try again.');
      showToast('Failed to load workbook', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [id, showToast]);

  // Fetch workbook data when ID changes
  useEffect(() => {
    fetchWorkbook();
  }, [fetchWorkbook]);

  // Join workbook room for collaboration
  useEffect(() => {
    if (id && user) {
      const workbookId = parseInt(id);
      const userName = user.displayName || user.email || 'Anonymous';
      joinWorkbook(workbookId, user.uid, userName);

      return () => {
        leaveWorkbook(workbookId, user.uid);
      };
    }
  }, [id, user, joinWorkbook, leaveWorkbook]);

  // Listen for cell changes from other users
  useEffect(() => {
    if (!id) return;

    onCellChange((data: any) => {
      console.log('Cell changed by another user:', data);
      if (editorRef.current && data.cellData) {
        const { row, col, value, formula } = data.cellData;
        editorRef.current.updateCell(row, col, value, formula);
      }
    });
  }, [id, onCellChange, showToast]);

  // Listen for real-time conflicts from other users
  useEffect(() => {
    if (!id) return;
    onConflict((data) => {
      console.warn('Conflict received via WebSocket:', data);
      setConflicts((prev) => [...prev, data]);
      setIsConflictViewerOpen(true);
      // Mark sync status as error only when an actual conflict is reported
      setSyncStatus('error');
      showToast('⚠️ A conflict was detected! Please resolve it.', 'warning');
    });
  }, [id, onConflict, showToast]);

  // Listen for conflict resolutions from other users
  useEffect(() => {
    if (!id) return;
    onConflictResolved((data) => {
      console.log('Conflict resolved by collaborator:', data);

      // Update the local Excel sheet with the resolved value
      if (editorRef.current && data.cellData) {
        const { row, col, worksheetId } = data.cellData;
        if (worksheetId === activeWorksheetId) {
          editorRef.current.updateCell(row, col, data.resolvedValue);
        }
      }

      setConflicts((prev) => prev.filter((c: any) => c.conflictId !== data.conflictId));
      showToast('Conflict resolved by a collaborator', 'success');
    });
  }, [id, onConflictResolved, showToast, conflicts.length, activeWorksheetId]);

  const handleCellChange = React.useCallback((cell: any) => {
    console.log('Cell changed:', cell);
    setHasLocalEdits(true);

    // Broadcast cell change to other users
    if (id && user) {
      sendCellEdit(parseInt(id), {
        row: cell.row || 0,
        col: cell.col || 0,
        value: cell.value || '',
        formula: cell.formula,
        worksheetId: activeWorksheetId,
      });
    }
  }, [id, user, sendCellEdit, activeWorksheetId]);


  const handleSave = React.useCallback(async (data: any) => {
    console.log('Saving workbook:', data);

    if (!id || !user) {
      showToast('Cannot save: missing workbook ID or user', 'error');
      return;
    }

    if (conflicts.length > 0) {
      setSyncStatus('error');
      setIsConflictViewerOpen(true);
      showToast('Resolve active conflicts before saving', 'warning');
      return;
    }

    const workbookId = parseInt(id || '0');

    try {
      const latestHistory = await getCommitHistory(workbookId, 1, 0);
      const latestCommit = latestHistory.commits?.[0];

      if (
        hasLocalEdits &&
        baseCommitId !== null &&
        latestCommit &&
        latestCommit.id !== baseCommitId
      ) {
        setSyncStatus('error');
        showToast('A newer version exists. Refresh or review history before saving.', 'warning');
        return;
      }
    } catch (versionCheckError) {
      console.warn('Could not verify latest commit before save:', versionCheckError);
    }

    setSyncStatus('syncing');
    try {
      // Create a commit for this save
      const commitResponse = await createCommit(
        workbookId,
        user.uid,
        'Manual save'
      );

      const savedCommit = commitResponse.commit;

      setSyncStatus('synced');
      setBaseCommitId(savedCommit?.id ?? baseCommitId);
      setHasLocalEdits(false);
      showToast(`Saved! Commit: ${savedCommit.hash.substring(0, 8)}`, 'success');
      // Refresh history if sidebar is open
      if (showVersionHistory) {
        // This is a bit hacky, but history timeline refreshes on workbookId change or manual trigger
        // Since workbookId hasn't changed, we might need a refresh trigger in the timeline
      }
    } catch (error) {
      console.error('Error saving workbook:', error);
      setSyncStatus('error');
      showToast('Failed to save workbook', 'error');
    }
  }, [id, user, showToast, showVersionHistory, conflicts.length, hasLocalEdits, baseCommitId]);

  const handleCommitSelect = async (commit: Commit) => {
    setIsCommitDetailsLoading(true);
    try {
      const details = await getCommitDetails(commit.id);
      setSelectedCommitDetails(details);
    } catch (err) {
      console.error('Error fetching commit details:', err);
      showToast('Failed to load commit details', 'error');
    } finally {
      setIsCommitDetailsLoading(false);
    }
  };

  const handleResolveConflicts = (resolutionData: any) => {
    console.log('Resolving conflicts:', resolutionData);

    // Broadcast resolution via WebSocket so other collaborators are notified
    if (id && user && resolutionData) {
      // Loop through each resolved cell
      Object.entries(resolutionData).forEach(([cellRef, data]: [string, any]) => {
        // Find the original conflict object to get its ID and cell coordinates
        const conflictObj = conflicts.find(c => c.cell === cellRef);
        if (!conflictObj) return;

        const { conflictId, cellData } = conflictObj;
        const { row, col, worksheetId } = cellData;

        // 1. Update the local Excel editor immediately
        if (editorRef.current && worksheetId === activeWorksheetId) {
          editorRef.current.updateCell(row, col, data.value);
        }

        // 2. Clear from local conflict state
        setConflicts(prev => prev.filter(c => c.conflictId !== conflictId));

        // 3. Inform server+others
        resolveConflict(conflictId, data.choice, data.value, user.uid, parseInt(id), cellData);
      });
    }

    showToast('Conflicts resolved successfully', 'success');
  };

  // Whenever all conflicts are cleared (resolved or dismissed), return to
  // a healthy sync state and close the conflict viewer/banner.
  useEffect(() => {
    if (conflicts.length === 0) {
      setIsConflictViewerOpen(false);
      setSyncStatus('synced');
    }
  }, [conflicts.length]);

  const handleCellSelect = React.useCallback((cell: any) => {
    const address = `${String.fromCharCode(65 + cell.col)}${cell.row + 1}`;
    setSelectedCell(address);
    setCellFormula(cell.formula || (cell.value !== null && cell.value !== undefined ? String(cell.value) : ''));

    // Broadcast cursor move to others
    if (id && user) {
      sendCursorMove(parseInt(id), {
        row: cell.row,
        col: cell.col,
        worksheetId: activeWorksheetId
      });
    }
  }, [id, user, sendCursorMove, activeWorksheetId]);

  const handleFileSelect = async (file: File) => {
    console.log('File selected:', file.name);

    if (!user) {
      showToast('You must be logged in to upload files', 'warning');
      return;
    }

    try {
      const response = await uploadWorkbook(file, user.uid);
      console.log('Upload success:', response);
      showToast('Workbook uploaded successfully!', 'success');
      setIsUploadModalOpen(false);
      if (response.workbook && response.workbook.id) {
        navigate(`/editor/${response.workbook.id}`);
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      showToast(error.message || 'Failed to upload workbook', 'error');
    }
  };

  const handleFormatChange = (format: any) => {
    console.log('Format changed:', format);

    // Map format changes to Univer commands
    if (format.bold !== undefined) {
      editorRef.current?.executeCommand('sheet.command.set-range-bold', { value: format.bold });
    }
    if (format.italic !== undefined) {
      editorRef.current?.executeCommand('sheet.command.set-range-italic', { value: format.italic });
    }
    if (format.underline !== undefined) {
      editorRef.current?.executeCommand('sheet.command.set-range-underline', { value: format.underline });
    }
    if (format.fontSize) {
      editorRef.current?.executeCommand('sheet.command.set-range-font-size', { value: parseInt(format.fontSize) });
    }
    if (format.fontFamily) {
      editorRef.current?.executeCommand('sheet.command.set-range-font-family', { value: format.fontFamily });
    }
    if (format.alignment) {
      const alignmentMap: Record<string, number> = {
        left: 1,
        center: 2,
        right: 3,
      };
      editorRef.current?.executeCommand('sheet.command.set-range-horizontal-alignment', {
        value: alignmentMap[format.alignment] || 1,
      });
    }
  };

  const handleFormulaChange = (formula: string) => {
    setCellFormula(formula);
  };

  const handleFormulaSubmit = (formula: string) => {
    console.log('Formula submitted:', formula);
    editorRef.current?.setValue(formula);
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    console.log('Zoom changed:', newZoom);
    editorRef.current?.setZoom(newZoom);
  };

  const handleWorksheetCreate = async () => {
    if (!id) return;
    try {
      const newSheet = await createWorksheet(id, `Sheet${worksheets.length + 1}`, worksheets.length);
      setWorksheets([...worksheets, {
        id: newSheet.id.toString(),
        name: newSheet.name,
        position: newSheet.sheet_order
      }]);
      setActiveWorksheetId(newSheet.id.toString());
      showToast('New worksheet created', 'success');
    } catch (err) {
      console.error('Error creating worksheet:', err);
      showToast('Failed to create worksheet', 'error');
    }
  };

  const handleWorksheetRename = async (worksheetId: string, newName: string) => {
    if (!id) return;
    try {
      await renameWorksheet(id, worksheetId, newName);
      setWorksheets(
        worksheets.map((ws) =>
          ws.id === worksheetId ? { ...ws, name: newName } : ws
        )
      );
      showToast('Worksheet renamed', 'success');
    } catch (err) {
      console.error('Error renaming worksheet:', err);
      showToast('Failed to rename worksheet', 'error');
    }
  };

  const handleWorksheetDelete = async (worksheetId: string) => {
    if (!id || worksheets.length <= 1) return;
    try {
      await deleteWorksheet(id, worksheetId);
      const newWorksheets = worksheets.filter((ws) => ws.id !== worksheetId);
      setWorksheets(newWorksheets);
      if (activeWorksheetId === worksheetId) {
        setActiveWorksheetId(newWorksheets[0].id);
      }
      showToast('Worksheet deleted', 'success');
    } catch (err) {
      console.error('Error deleting worksheet:', err);
      showToast('Failed to delete worksheet', 'error');
    }
  };

  const handleWorksheetReorder = async (reorderedWorksheets: any[]) => {
    if (!id) return;
    try {
      setWorksheets(reorderedWorksheets);
      const orders = reorderedWorksheets.map((ws, index) => ({ id: ws.id, order: index }));
      await reorderWorksheets(id, orders);
      showToast('Sheets reordered', 'success');
    } catch (err) {
      console.error('Error reordering worksheets:', err);
      showToast('Failed to save sheet order', 'error');
      // Revert in case of failure?
      fetchWorkbook();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Skeleton Toolbar */}
        <div className="bg-white border-b border-gray-200 p-2 flex items-center space-x-2">
          <SkeletonLoader width="100px" height="36px" />
          <SkeletonLoader width="100px" height="36px" />
          <div className="flex-1" />
          <SkeletonLoader width="150px" height="36px" />
        </div>

        {/* Skeleton Formula Bar */}
        <div className="bg-white border-b border-gray-200 p-2 flex items-center space-x-2">
          <SkeletonLoader width="80px" height="32px" />
          <SkeletonLoader width="100%" height="32px" />
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 p-6">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 flex justify-end">
                <SkeletonLoader width="120px" height="30px" />
              </div>
              <div className="flex-1 p-4">
                <SkeletonLoader width="100%" height="100%" />
              </div>
              <div className="p-2 border-t border-gray-200 flex space-x-2">
                <SkeletonLoader width="80px" height="30px" />
                <SkeletonLoader width="80px" height="30px" />
                <SkeletonLoader width="80px" height="30px" />
              </div>
            </div>
          </div>

          {/* Skeleton Sidebar */}
          <div className="w-80 bg-white border-l border-gray-200 p-4">
            <SkeletonLoader width="100%" height="40px" className="mb-4" />
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <SkeletonLoader shape="circle" width="32px" height="32px" />
                <div className="flex-1">
                  <SkeletonLoader width="60%" height="16px" className="mb-1" />
                  <SkeletonLoader width="40%" height="12px" />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <SkeletonLoader shape="circle" width="32px" height="32px" />
                <div className="flex-1">
                  <SkeletonLoader width="60%" height="16px" className="mb-1" />
                  <SkeletonLoader width="40%" height="12px" />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <SkeletonLoader shape="circle" width="32px" height="32px" />
                <div className="flex-1">
                  <SkeletonLoader width="60%" height="16px" className="mb-1" />
                  <SkeletonLoader width="40%" height="12px" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center border border-gray-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Failed to Load Workbook</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => fetchWorkbook()}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Editor Toolbar */}
      <EditorToolbar
        onSave={handleSave}
        onUpload={() => setIsUploadModalOpen(true)}
        onFormatChange={handleFormatChange}
      />

      {/* Hybrid Sync Banner */}
      <HybridSyncBanner
        status={syncStatus}
        onRetry={() => setIsConflictViewerOpen(true)}
      />

      {/* Conflict Notification Banner */}
      <ConflictNotificationBanner
        conflicts={conflicts}
        onResolve={() => setIsConflictViewerOpen(true)}
        onDismiss={() => setConflicts([])}
      />

      {/* Formula Bar */}
      <FormulaBar
        selectedCell={selectedCell}
        cellFormula={cellFormula}
        onFormulaChange={handleFormulaChange}
        onFormulaSubmit={handleFormulaSubmit}
      />

      {/* Main Container for Side-by-Side Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Editor Area */}
        <div className="flex-1 overflow-hidden p-6 transition-all duration-300">
          <div className="max-w-full mx-auto h-full flex flex-col">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden flex-1 flex flex-col">
              {/* Zoom Controls */}
              <div className="flex justify-end p-4 border-b border-gray-200">
                <ZoomControls
                  initialZoom={zoom}
                  onZoomChange={handleZoomChange}
                />
              </div>

              {/* Excel Editor Wrapper */}
              <div className="p-4 flex-1 relative z-10 min-h-[500px]">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex flex-col items-center text-gray-400">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mb-4"></div>
                      <p>Loading spreadsheet engine...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <ExcelEditor
                      ref={editorRef}
                      workbookData={workbookData}
                      onCellSelect={handleCellSelect}
                      onCellChange={handleCellChange}
                      onSave={handleSave}
                    />

                    {/* Collaborative Cursors Overlay - Placed exactly over the editor canvas */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 top-4 left-4 right-4 bottom-4">
                      <CollaborativeCursors
                        cursors={Array.from(cursors.values()).map((cursor: any) => ({
                          userId: cursor.socketId,
                          userName: activeUsers.find((u: any) => u.socketId === cursor.socketId)?.userName || 'Unknown',
                          color: activeUsers.find((u: any) => u.socketId === cursor.socketId)?.color || '#000',
                          cellReference: `${String.fromCharCode(65 + cursor.position.col)}${cursor.position.row + 1}`,
                          position: { x: cursor.position.col * 100, y: cursor.position.row * 25 }
                        }))}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Worksheet Tabs */}
              <WorksheetTabs
                worksheets={worksheets}
                activeWorksheetId={activeWorksheetId}
                onWorksheetChange={setActiveWorksheetId}
                onWorksheetCreate={handleWorksheetCreate}
                onWorksheetRename={handleWorksheetRename}
                onWorksheetDelete={handleWorksheetDelete}
                onWorksheetReorder={handleWorksheetReorder}
              />
            </div>
          </div>
        </div>

        {/* Sidebar Toggle Button (When Closed) */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border border-gray-200 p-2 rounded-l-md shadow-md z-20 hover:bg-gray-50 transition-all flex items-center justify-center"
            title="Open Sidebar"
          >
            {React.createElement(FiChevronLeft as any, { size: 20, className: 'text-gray-600' })}
          </button>
        )}

        {/* Right Sidebar - Collaboration & Version History */}
        <div
          className={`bg-white border-l border-gray-200 flex flex-col shadow-xl transition-all duration-300 ease-in-out relative z-10 ${isSidebarOpen ? 'w-80 opacity-100 animate-in' : 'w-0 opacity-0 overflow-hidden border-none'
            }`}
        >
          {isSidebarOpen && (
            <>
              {/* Sidebar Header/Close Button */}
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  {React.createElement(FiSidebar as any, { size: 16, className: 'text-gray-500' })}
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Workspace</span>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                  title="Close Sidebar"
                >
                  {React.createElement(FiChevronRight as any, { size: 18, className: 'text-gray-500' })}
                </button>
              </div>

              {/* Sidebar Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => { setShowCollaborators(true); setShowVersionHistory(false); }}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${showCollaborators ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  Users ({activeUsers.length})
                </button>
                <button
                  onClick={() => { setShowVersionHistory(true); setShowCollaborators(false); }}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${showVersionHistory ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  History
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto">
                {showCollaborators && (
                  <WhosEditingSidebar
                    isOpen={true}
                    users={activeUsers.map((u: any) => ({
                      id: u.userId,
                      name: u.userName,
                      email: 'Collaborator',
                      color: u.color,
                      lastActive: new Date()
                    }))}
                  />
                )}

                {showVersionHistory && id && (
                  <div className="flex flex-col h-full">
                    {!selectedCommitDetails ? (
                      <VersionHistoryTimeline
                        workbookId={parseInt(id)}
                        onCommitSelect={handleCommitSelect}
                      />
                    ) : (
                      <div className="flex flex-col h-full bg-white overflow-y-auto">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                          <button
                            onClick={() => setSelectedCommitDetails(null)}
                            className="text-blue-600 text-sm font-medium hover:underline"
                          >
                            &larr; Back to History
                          </button>
                        </div>
                        <CommitDetailViewer
                          commit={{
                            id: selectedCommitDetails.commit.id.toString(),
                            message: selectedCommitDetails.commit.message,
                            user: selectedCommitDetails.commit.user_id,
                            timestamp: new Date(selectedCommitDetails.commit.timestamp),
                            changes: selectedCommitDetails.changes.map((c: any) => ({
                              cellReference: c.address,
                              changeType: c.change_type || 'modified',
                              oldValue: c.old_value,
                              newValue: c.new_value,
                              oldFormula: c.old_formula,
                              newFormula: c.new_formula
                            }))
                          }}
                          onClose={() => setSelectedCommitDetails(null)}
                          onRevert={() => {
                            setSelectedCommitForRollback(selectedCommitDetails.commit);
                            setIsRollbackModalOpen(true);
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Conflict Resolution Modal Overlay */}
      {isConflictViewerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <ConflictResolutionViewer
              conflicts={conflicts.map((c: any) => {
                const isTriggerer = user?.uid === c.user?.userId;
                return {
                  cellKey: c.cell,
                  cellReference: `${String.fromCharCode(65 + c.cellData.col)}${c.cellData.row + 1}`,
                  yourValue: isTriggerer ? c.cellData.value : c.conflictingValue,
                  yourFormula: isTriggerer ? c.cellData.formula : '', // Simplified for now
                  theirValue: isTriggerer ? c.conflictingValue : c.cellData.value,
                  theirFormula: isTriggerer ? '' : c.cellData.formula,
                  theirUser: isTriggerer ? (c.conflictingUser?.userName || 'Collaborator') : (c.user?.userName || 'Collaborator'),
                  theirColor: isTriggerer ? (c.conflictingUser?.color || '#FF0000') : (c.user?.color || '#FF0000')
                };
              })}
              onResolve={handleResolveConflicts}
              onCancel={() => setIsConflictViewerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFileSelect={handleFileSelect}
      />
      {/* Rollback Modal */}
      {selectedCommitForRollback && (
        <RollbackModal
          isOpen={isRollbackModalOpen}
          workbookId={parseInt(id || '0')}
          commitId={selectedCommitForRollback.id}
          userId={user?.uid || ''}
          commitMessage={selectedCommitForRollback.message || 'Auto-save'}
          commitDate={selectedCommitForRollback.timestamp}
          changesCount={selectedCommitForRollback.changes_count || 0}
          onConfirm={() => {
            setIsRollbackModalOpen(false);
            setSelectedCommitDetails(null);
            fetchWorkbook();
            showToast('Workbook reverted to selected version', 'success');
          }}
          onCancel={() => setIsRollbackModalOpen(false)}
          onPreview={async (cid) => {
            showToast(`Loading preview for version ${cid}...`, 'info');
            try {
              const snapshot = await getCommitSnapshot(cid);
              setWorkbookData(snapshot);
              setIsRollbackModalOpen(false);
              showToast('Preview loaded. Click "Confirm Rollback" to make this permanent.', 'info');
            } catch (err) {
              console.error('Error loading preview:', err);
              showToast('Failed to load preview', 'error');
            }
          }}
        />
      )}
    </div>
  );
};

export default Editor;