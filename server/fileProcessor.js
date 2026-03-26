const ExcelJS = require('exceljs');
const { EventEmitter } = require('events');

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
            // 'application/vnd.ms-excel', // Legacy .xls not supported by ExcelJS for loading
        ];

        if (file && !allowedMimeTypes.includes(file.mimetype)) {
            errors.push('Invalid file type. Only Modern Excel files (.xlsx) are supported at this time.');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }
}

module.exports = FileProcessor;
