import React, { useEffect, useRef } from 'react';
import { LocaleType, Univer } from '@univerjs/core';
import { defaultTheme } from '@univerjs/design';
import { UniverDocsPlugin } from '@univerjs/docs';
import { UniverDocsUIPlugin } from '@univerjs/docs-ui';
import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula';
import { UniverRenderEnginePlugin } from '@univerjs/engine-render';
import { UniverSheetsPlugin } from '@univerjs/sheets';
import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula';
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui';
import { UniverUIPlugin } from '@univerjs/ui';

// @ts-ignore
import { FUniver } from '@univerjs/core/facade';
import '@univerjs/sheets/facade';
import '@univerjs/ui/facade';
import '@univerjs/sheets-ui/facade';
import '@univerjs/sheets-formula/facade';

// Locales
import DesignEnUS from '@univerjs/design/lib/locale/en-US';
import UIEnUS from '@univerjs/ui/lib/locale/en-US';
import DocsUIEnUS from '@univerjs/docs-ui/lib/locale/en-US';
import SheetsUIEnUS from '@univerjs/sheets-ui/lib/locale/en-US';
import SheetsFormulaEnUS from '@univerjs/sheets-formula/lib/locale/en-US';

// Styles
import '@univerjs/design/lib/index.css';
import '@univerjs/ui/lib/index.css';
import '@univerjs/docs-ui/lib/index.css';
import '@univerjs/sheets-ui/lib/index.css';

export interface ExcelEditorRef {
    save: () => void;
    executeCommand: (id: string, params?: any) => void;
    setZoom: (zoom: number) => void;
    setValue: (value: string) => void;
    getSelection: () => any;
    updateCell: (row: number, col: number, value: any, formula?: string) => void;
}

interface ExcelEditorProps {
    workbookData?: any;
    onCellChange?: (cell: any) => void;
    onCellSelect?: (cell: { row: number; col: number; value: any; formula?: string }) => void;
    onSave?: (data: any) => void;
    readOnly?: boolean;
    ref?: React.Ref<ExcelEditorRef>;
}

const ExcelEditor = React.forwardRef<ExcelEditorRef, ExcelEditorProps>(({
    workbookData,
    onCellChange,
    onCellSelect,
    onSave,
    readOnly = false,
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const univerRef = useRef<Univer | null>(null);
    const fUniverRef = useRef<FUniver | null>(null);
    const isInitialized = useRef(false); // Tracks if Univer has been initialized

    // Keep callbacks in refs to avoid re-triggering effect when they change
    const onCellChangeRef = useRef(onCellChange);
    const onCellSelectRef = useRef(onCellSelect);
    const onSaveRef = useRef(onSave);

    useEffect(() => {
        onCellChangeRef.current = onCellChange;
        onCellSelectRef.current = onCellSelect;
        onSaveRef.current = onSave;
    }, [onCellChange, onCellSelect, onSave]);

    useEffect(() => {
        // Only initialize once
        if (!containerRef.current || isInitialized.current) {
            return;
        }

        let univer: Univer;
        let fUniver: any;

        try {
            // Build locale bundle
            const localeBundle = {
                ...DesignEnUS,
                ...UIEnUS,
                ...DocsUIEnUS,
                ...SheetsUIEnUS,
                ...SheetsFormulaEnUS,
            };

            // 1. Create Univer instance
            univer = new Univer({
                theme: defaultTheme,
                locale: LocaleType.EN_US,
                locales: {
                    [LocaleType.EN_US]: localeBundle,
                    'en-US': localeBundle,
                },
            });

            // 2. Core rendering and formula engine
            univer.registerPlugin(UniverRenderEnginePlugin);
            univer.registerPlugin(UniverFormulaEnginePlugin);

            // 3. UI Workbench
            univer.registerPlugin(UniverUIPlugin, {
                container: containerRef.current!,
                header: true,
                toolbar: true,
                footer: true,
            });

            // 4. Docs Core & UI (provides cell editor service)
            univer.registerPlugin(UniverDocsPlugin, { hasScroll: false });
            univer.registerPlugin(UniverDocsUIPlugin);

            // 5. Sheets Core & Formula
            univer.registerPlugin(UniverSheetsPlugin);
            univer.registerPlugin(UniverSheetsFormulaPlugin);

            // 6. Sheets UI
            univer.registerPlugin(UniverSheetsUIPlugin);

            // 9. Initialize facade API
            fUniver = FUniver.newAPI(univer);
            univerRef.current = univer;
            fUniverRef.current = fUniver;

            // 8. Create workbook via Facade
            const defaultWorkbookData = workbookData || {
                id: 'workbook-01',
                name: 'New Workbook',
                sheetOrder: ['sheet-01'],
                appVersion: '0.1.0',
                sheets: {
                    'sheet-01': {
                        id: 'sheet-01',
                        name: 'Sheet1',
                        cellData: {
                            0: {
                                0: { v: 'Welcome to XcelTrack!', s: { ff: 'Arial', fs: 14, bl: 1 } },
                            },
                        },
                        rowCount: 1000,
                        columnCount: 26,
                    },
                },
            };

            fUniver.createWorkbook(defaultWorkbookData);

            // Debug: Expose and log available events
            (window as any).fUniver = fUniver;
            if (fUniver.Event) {
                console.log('[ExcelEditor] Available events:', Object.keys(fUniver.Event));
            } else {
                console.warn('[ExcelEditor] fUniver.Event is undefined');
            }

            console.log('[ExcelEditor] UniverJS initialized successfully');

            // 10. Selection change listener
            // Use string literal "SelectionChanged" if the constant is missing/empty
            const selectionEventName = fUniver.Event?.SelectionChanged || 'SelectionChanged';
            const selectionSub = fUniver.addEvent(selectionEventName, (params: any) => {
                try {
                    const { selections } = params;
                    if (selections && selections.length > 0 && onCellSelectRef.current) {
                        const range = selections[0];
                        const row = range.startRow;
                        const col = range.startColumn;

                        const activeWorkbook = fUniver.getActiveWorkbook();
                        if (activeWorkbook) {
                            const activeSheet = activeWorkbook.getActiveSheet();
                            if (activeSheet) {
                                const cellData = activeSheet.getRange(row, col).getValue() as any;
                                const valueStr = (cellData && typeof cellData === 'object' && cellData.v !== undefined)
                                    ? String(cellData.v)
                                    : (cellData || '');
                                const formulaStr = (cellData && typeof cellData === 'object' && cellData.f)
                                    ? String(cellData.f)
                                    : '';

                                onCellSelectRef.current({ row, col, value: valueStr, formula: formulaStr });
                            }
                        }
                    }
                } catch (e) {
                    console.error('[ExcelEditor] SelectionChanged error:', e);
                }
            });

            // 11. Cell value change listener
            // Use string literal "CommandExecuted" if the constant is missing/empty
            const commandEventName = fUniver.Event?.CommandExecuted || 'CommandExecuted';
            const commandSub = fUniver.addEvent(commandEventName, (command: any) => {
                try {
                    if (command.id !== 'sheet.command.set-range-values' || !onCellChangeRef.current) return;

                    const params = command.params;
                    if (!params || !params.value) return;

                    const matrix = params.value;
                    let rowIdx: string | undefined;
                    let colIdx: string | undefined;
                    let rawValue: any;

                    if (typeof matrix === 'object' && matrix !== null) {
                        const rowKeys = Object.keys(matrix);
                        if (rowKeys.length > 0) {
                            if (rowKeys.includes('v') || rowKeys.includes('f')) {
                                rawValue = matrix;
                            } else {
                                rowIdx = rowKeys[0];
                                const colKeys = matrix[rowIdx] ? Object.keys(matrix[rowIdx]) : [];
                                if (colKeys.length > 0) {
                                    colIdx = colKeys[0];
                                    rawValue = matrix[rowIdx][colIdx];
                                }
                            }
                        }
                    }

                    let value = '';
                    let formula = '';
                    if (rawValue !== null && rawValue !== undefined) {
                        if (typeof rawValue === 'object') {
                            value = rawValue.v !== undefined ? String(rawValue.v) : '';
                            formula = rawValue.f || '';
                        } else {
                            value = String(rawValue);
                        }
                    }

                    let row = rowIdx ? parseInt(rowIdx) : NaN;
                    let col = colIdx ? parseInt(colIdx) : NaN;

                    if (isNaN(row) || isNaN(col)) {
                        const wb = fUniver.getActiveWorkbook();
                        const sh = wb?.getActiveSheet();
                        const sel = sh?.getSelection();
                        if (sel) {
                            const rng = sel.getActiveRange();
                            if (rng) {
                                const r = rng.getRange();
                                row = r.startRow;
                                col = r.startColumn;
                            }
                        }
                    }

                    if (!isNaN(row) && !isNaN(col)) {
                        onCellChangeRef.current({ row, col, value, formula });
                    }
                } catch (e) {
                    console.error('[ExcelEditor] CommandExecuted error:', e);
                }
            });

            isInitialized.current = true;

            // --- Editing fix: forward dblclick / keystrokes into the active cell value ---
            // Instead of relying on internal Univer edit commands (which can change
            // between versions), we directly mutate the active cell's value when the
            // user types while a cell is selected.
            const applyCharToActiveCell = (ch: string) => {
                const wb = fUniverRef.current?.getActiveWorkbook();
                const sh = wb?.getActiveSheet();
                const range = sh?.getSelection()?.getActiveRange();
                if (!range) return;

                const current = range.getValue() as any;
                let currentText = '';
                if (current != null) {
                    if (typeof current === 'object' && current.v !== undefined) {
                        currentText = String(current.v ?? '');
                    } else {
                        currentText = String(current);
                    }
                }

                const next = `${currentText}${ch}`;
                range.setValue(next);
            };

            const clearActiveCell = () => {
                const wb = fUniverRef.current?.getActiveWorkbook();
                const sh = wb?.getActiveSheet();
                const range = sh?.getSelection()?.getActiveRange();
                range?.setValue('');
            };

            // Double-click on the canvas – keep default Univer behaviour, but
            // ensure the container has focus so subsequent key presses work.
            const onCanvasDblClick = (e: MouseEvent) => {
                const target = e.target as HTMLElement;
                if (target.tagName === 'CANVAS' || containerRef.current?.contains(target)) {
                    if (containerRef.current) {
                        containerRef.current.focus();
                    }
                }
            };
            containerRef.current!.addEventListener('dblclick', onCanvasDblClick);

            // Window keydown → if a printable key is pressed while a cell is selected and
            // the user is NOT already typing in an input/textarea, directly update
            // the active cell's value so users can "just type" like in Excel.
            const onWindowKeyDown = (e: KeyboardEvent) => {
                const activeEl = document.activeElement;
                const isTypingInInput =
                    activeEl && (
                        activeEl.tagName === 'INPUT' ||
                        activeEl.tagName === 'TEXTAREA' ||
                        (activeEl as HTMLElement).isContentEditable
                    );
                if (isTypingInInput) return;

                // Handle backspace/delete to clear the active cell
                if (e.key === 'Backspace' || e.key === 'Delete') {
                    clearActiveCell();
                    return;
                }

                // Printable characters (single char, no ctrl/meta/alt)
                const isPrintable = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
                if (isPrintable) {
                    applyCharToActiveCell(e.key);
                }
            };
            window.addEventListener('keydown', onWindowKeyDown);
            // -----------------------------------------------------------------------

            // Auto-focus the container so pointer events reach Univer immediately
            setTimeout(() => {
                if (containerRef.current) {
                    containerRef.current.focus();
                }
            }, 300);

            return () => {
                try { containerRef.current?.removeEventListener('dblclick', onCanvasDblClick); } catch (e) { }
                try { window.removeEventListener('keydown', onWindowKeyDown); } catch (e) { }
                try { selectionSub.dispose(); } catch (e) { }
                try { commandSub.dispose(); } catch (e) { }
                try { univer.dispose(); } catch (e) { }
                univerRef.current = null;
                fUniverRef.current = null;
                isInitialized.current = false;
                if ((window as any).fUniver) delete (window as any).fUniver;
            };
        } catch (err) {
            console.error('[ExcelEditor] Initialization failed:', err);
            isInitialized.current = false;
        }
    }, [workbookData]); // eslint-disable-line react-hooks/exhaustive-deps

    // Removed manual handlers; UniverJS should handle focus/editing natively if initialized correctly.
    // Fallback focus check if needed can be added here.

    // Expose methods
    React.useImperativeHandle(ref, () => ({
        save: () => {
            if (fUniverRef.current && onSaveRef.current) {
                const wb = fUniverRef.current.getActiveWorkbook();
                if (wb) {
                    // Use internal snapshot method
                    const data = (wb as any).save?.() ?? (wb as any).getSnapshot?.();
                    if (data) onSaveRef.current(data);
                }
            }
        },
        executeCommand: (id: string, params?: any) => {
            fUniverRef.current?.executeCommand(id, params);
        },
        setZoom: (zoom: number) => {
            if (fUniverRef.current) {
                try {
                    const wb = fUniverRef.current.getActiveWorkbook();
                    const sh = wb?.getActiveSheet();
                    if (sh && wb) {
                        // Correct command ID in UniverJS 0.15.x
                        fUniverRef.current.executeCommand('sheet.operation.set-zoom-ratio', {
                            zoomRatio: zoom / 100,
                            unitId: wb.getId(),
                            subUnitId: sh.getSheetId()
                        });
                    }
                } catch (e) {
                    console.warn('[ExcelEditor] setZoom failed:', e);
                }
            }
        },
        setFormat: (format: any) => {
            try {
                const wb = fUniverRef.current?.getActiveWorkbook();
                const sh = wb?.getActiveSheet();
                const range = sh?.getSelection()?.getActiveRange();
                if (!range) return;

                if (format.bold !== undefined) {
                    const currentStyle = range.getTextStyle();
                    range.setTextStyle({ bl: format.bold ? 1 : 0 });
                }
                if (format.italic !== undefined) {
                    range.setTextStyle({ it: format.italic ? 1 : 0 });
                }
                if (format.underline !== undefined) {
                    range.setTextStyle({ ul: { s: format.underline ? 1 : 0 } });
                }
                if (format.fontSize) {
                    range.setTextStyle({ fs: parseInt(format.fontSize) });
                }
                if (format.fontFamily) {
                    range.setTextStyle({ ff: format.fontFamily });
                }
                if (format.alignment) {
                    const alignmentMap: Record<string, number> = {
                        left: 1, center: 2, right: 3,
                    };
                    range.setHorizontalAlignment(alignmentMap[format.alignment] || 1);
                }
            } catch (e) {
                console.warn('[ExcelEditor] setFormat failed:', e);
            }
        },
        setValue: (value: string) => {
            const wb = fUniverRef.current?.getActiveWorkbook();
            const sh = wb?.getActiveSheet();
            const range = sh?.getSelection()?.getActiveRange();
            range?.setValue(value);
        },
        getSelection: () => {
            const wb = fUniverRef.current?.getActiveWorkbook();
            const sh = wb?.getActiveSheet();
            const range = sh?.getSelection()?.getActiveRange();
            if (range) {
                return {
                    row: range.getRow(),
                    col: range.getColumn(),
                    rowCount: range.getHeight(),
                    colCount: range.getWidth()
                };
            }
            return null;
        },
        updateCell: (row: number, col: number, value: any, formula?: string) => {
            const wb = fUniverRef.current?.getActiveWorkbook();
            const sh = wb?.getActiveSheet();
            const range = sh?.getRange(row, col);
            if (range) {
                range.setValue(formula ?? value);
            }
        },
    }));

    return (
        <div className="excel-editor-container h-full flex flex-col">
            <div
                ref={containerRef}
                id="univer-container"
                tabIndex={0}
                onClick={() => {
                    if (containerRef.current) {
                        containerRef.current.focus();
                    }
                }}
                style={{
                    width: '100%',
                    height: '800px',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0 0 0.75rem 0.75rem',
                    backgroundColor: 'white',
                    boxShadow: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
                    outline: 'none',
                    cursor: 'default',
                }}
            />
        </div>
    );
});

ExcelEditor.displayName = 'ExcelEditor';
export default ExcelEditor;
