const ExcelJS = require('exceljs');
const XLSX = require('xlsx');
const { EventEmitter } = require('events');
const path = require('path');

class FileProcessor extends EventEmitter {
    constructor() {
        super();
        this.CHUNK_SIZE = 1000; // Process 1000 cells at a time
    }

    /**
     * Process Excel file with streaming and chunking
     * @param {Buffer} fileBuffer - Excel file buffer
     * @param {string} fileName - Original file name
     * @returns {Promise<Object>} - Parsed workbook data
     */
    async processExcelFile(fileBuffer, fileName) {
        try {
            this.emit('progress', { stage: 'loading', percent: 0 });

            const ext = path.extname(fileName || '').toLowerCase();
            if (ext === '.xls') {
                return this.processXlsFile(fileBuffer, fileName);
            }

            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(fileBuffer);

            this.emit('progress', { stage: 'loading', percent: 20 });

            const sheets = [];
            let sheetIndex = 0;

            // Process each worksheet
            for (const worksheet of workbook.worksheets) {
                this.emit('progress', {
                    stage: 'processing',
                    percent: 20 + (sheetIndex / workbook.worksheets.length) * 60,
                    currentSheet: worksheet.name,
                });

                const sheetData = await this.processWorksheet(worksheet, sheetIndex);
                sheets.push(sheetData);
                sheetIndex++;
            }

            this.emit('progress', { stage: 'finalizing', percent: 90 });

            const result = {
                name: fileName,
                sheets: sheets,
                totalSheets: sheets.length,
                totalCells: sheets.reduce((sum, sheet) => sum + sheet.cellCount, 0),
            };

            this.emit('progress', { stage: 'complete', percent: 100 });
            this.emit('complete', result);

            return result;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    processXlsFile(fileBuffer, fileName) {
        this.emit('progress', { stage: 'loading', percent: 10 });

        const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellFormula: true, cellDates: true });
        const sheets = [];
        let totalCells = 0;

        workbook.SheetNames.forEach((sheetName, index) => {
            const worksheet = workbook.Sheets[sheetName];
            const ref = worksheet['!ref'] || 'A1:A1';
            const range = XLSX.utils.decode_range(ref);

            const cells = [];
            let cellCount = 0;

            for (let row = range.s.r; row <= range.e.r; row++) {
                for (let col = range.s.c; col <= range.e.c; col++) {
                    const address = XLSX.utils.encode_cell({ r: row, c: col });
                    const cell = worksheet[address];
                    if (!cell) continue;

                    const value = cell.v ?? null;
                    const formula = cell.f ?? null;

                    cells.push({
                        row,
                        col,
                        address,
                        value,
                        formula,
                        style: {},
                    });
                    cellCount++;
                }
            }

            totalCells += cellCount;
            sheets.push({
                name: sheetName,
                order: index,
                data: worksheet,
                cells,
                cellCount,
                rowCount: range.e.r + 1,
                columnCount: range.e.c + 1,
            });
        });

        const result = {
            name: fileName,
            sheets,
            totalSheets: sheets.length,
            totalCells,
        };

        this.emit('progress', { stage: 'complete', percent: 100 });
        this.emit('complete', result);
        return result;
    }

    /**
     * Process a single worksheet
     * @param {ExcelJS.Worksheet} worksheet
     * @param {number} order
     * @returns {Promise<Object>}
     */
    async processWorksheet(worksheet, order) {
        const cells = [];
        let cellCount = 0;

        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell, colNumber) => {
                let cellValue = cell.value;
                let formula = null;

                // Handle formula cells
                if (cell.type === ExcelJS.ValueType.Formula) {
                    cellValue = cell.result;
                    formula = cell.formula;
                } else if (typeof cellValue === 'object' && cellValue !== null) {
                    // Handle rich text and other complex values
                    if (cellValue.richText) {
                        cellValue = cellValue.richText.map(t => t.text).join('');
                    } else {
                        cellValue = JSON.stringify(cellValue);
                    }
                }

                // Extract cell styling
                const style = {
                    font: cell.font,
                    alignment: cell.alignment,
                    fill: cell.fill,
                    border: cell.border,
                    numFmt: cell.numFmt,
                };

                cells.push({
                    row: rowNumber - 1,
                    col: colNumber - 1,
                    address: cell.address,
                    value: cellValue,
                    formula: formula,
                    style: style,
                });

                cellCount++;

                // Emit progress for large sheets
                if (cellCount % this.CHUNK_SIZE === 0) {
                    this.emit('chunk-processed', {
                        worksheet: worksheet.name,
                        cellsProcessed: cellCount,
                    });
                }
            });
        });

        return {
            name: worksheet.name,
            order: order,
            data: worksheet,
            cells: cells,
            cellCount: cellCount,
            rowCount: worksheet.rowCount,
            columnCount: worksheet.columnCount,
        };
    }

    /**
     * Insert cells in batches for better performance
     * @param {Object} client - Database client
     * @param {Array} cells - Array of cell data
     * @param {number} worksheetId - Worksheet ID
     * @param {number} commitId - Commit ID
     */
    async insertCellsBatch(client, cells, worksheetId, commitId) {
        const BATCH_SIZE = 500;
        let processed = 0;

        for (let i = 0; i < cells.length; i += BATCH_SIZE) {
            const batch = cells.slice(i, i + BATCH_SIZE);

            // Build bulk insert query
            const cellValues = [];
            const cellVersionValues = [];
            const cellParams = [];
            const versionParams = [];

            batch.forEach((cell, idx) => {
                const baseIdx = idx * 7;
                cellValues.push(
                    `($${baseIdx + 1}, $${baseIdx + 2}, $${baseIdx + 3}, $${baseIdx + 4}, $${baseIdx + 5}, $${baseIdx + 6}, $${baseIdx + 7})`
                );
                cellParams.push(
                    worksheetId,
                    cell.row,
                    cell.col,
                    cell.address,
                    cell.value,
                    cell.formula,
                    JSON.stringify(cell.style)
                );
            });

            // Insert cells
            const cellQuery = `
                INSERT INTO cells (worksheet_id, row_idx, col_idx, address, value, formula, style)
                VALUES ${cellValues.join(', ')}
                ON CONFLICT (worksheet_id, row_idx, col_idx) 
                DO UPDATE SET value = EXCLUDED.value, formula = EXCLUDED.formula, style = EXCLUDED.style
                RETURNING id
            `;

            const cellResult = await client.query(cellQuery, cellParams);

            // Insert cell versions
            for (let j = 0; j < cellResult.rows.length; j++) {
                const cellId = cellResult.rows[j].id;
                const cell = batch[j];

                await client.query(
                    'INSERT INTO cell_versions (commit_id, cell_id, value, formula, style) VALUES ($1, $2, $3, $4, $5)',
                    [commitId, cellId, cell.value, cell.formula, JSON.stringify(cell.style)]
                );

                // Populate commit_changes for the initial commit (all 'added')
                await client.query(
                    `INSERT INTO commit_changes (commit_id, cell_id, change_type, new_value, new_formula)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [commitId, cellId, 'added', cell.value, cell.formula]
                );
            }

            processed += batch.length;
            this.emit('batch-inserted', {
                processed,
                total: cells.length,
                percent: Math.round((processed / cells.length) * 100),
            });
        }

        return processed;
    }

    /**
     * Validate file before processing
     * @param {Object} file - Multer file object
     * @param {number} maxSize - Maximum file size in bytes
     * @returns {Object} - Validation result
     */
    validateFile(file, maxSize = 50 * 1024 * 1024) {
        const errors = [];

        if (!file) {
            errors.push('No file provided');
        }

        if (file && file.size > maxSize) {
            errors.push(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
        }

        const allowedMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
        ];

        const allowedExtensions = ['.xlsx', '.xls'];
        const ext = file?.originalname ? path.extname(file.originalname).toLowerCase() : '';

        if (file && !allowedMimeTypes.includes(file.mimetype) && !allowedExtensions.includes(ext)) {
            errors.push('Invalid file type. Only Excel files (.xlsx, .xls) are supported.');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }
}
module.exports = FileProcessor;
