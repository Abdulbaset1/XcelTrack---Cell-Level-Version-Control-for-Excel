/**
 * websocketServer.js
 * 
 * Real-time collaboration module for XcelTrack.
 * Handles: user presence, cursor tracking, cell edits,
 * conflict detection (2-second window), typing indicators,
 * and conflict resolution.
 * 
 * Based on backend design by Maleeha Batool.
 * Adapted and integrated by Rehana / Basit to match existing
 * project conventions (kebab-case events, existing DB schema).
 */

const { logger } = require('./logger');

// ─────────────────────────────────────────────
// In-Memory State
// ─────────────────────────────────────────────

// { workbookId: Set<{socketId, userId, userName, color}> }
const workbookUsers = new Map();

// Conflict detection window (ms). Two users editing same cell within this window = conflict.
const CONFLICT_WINDOW_MS = 2000;

// { workbookId: { cellAddress: { lastUserId, lastSocketId, lastTimestamp } } }
const cellState = {};

const USER_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
let colorIndex = 0;
function getNextColor() {
    const color = USER_COLORS[colorIndex % USER_COLORS.length];
    colorIndex++;
    return color;
}

function toCellAddress(row, col) {
    let colNumber = Number(col) + 1;
    let colLetters = '';

    while (colNumber > 0) {
        const remainder = (colNumber - 1) % 26;
        colLetters = String.fromCharCode(65 + remainder) + colLetters;
        colNumber = Math.floor((colNumber - 1) / 26);
    }

    return `${colLetters}${Number(row) + 1}`;
}

// ─────────────────────────────────────────────
// Helper: Serialize users set to array
// ─────────────────────────────────────────────
function getUsersArray(workbookId) {
    if (!workbookUsers.has(workbookId)) return [];
    return Array.from(workbookUsers.get(workbookId));
}

// ─────────────────────────────────────────────
// Main init function
// ─────────────────────────────────────────────
function initWebSocket(io, pool) {
    io.on('connection', (socket) => {
        logger.info('WebSocket client connected', { socketId: socket.id });

        // ── JOIN WORKBOOK ──────────────────────────────────────────────────
        socket.on('join-workbook', ({ workbookId, userId, userName }) => {
            const room = `workbook-${workbookId}`;
            socket.join(room);

            const color = getNextColor();
            const userInfo = { socketId: socket.id, userId, userName, color };

            if (!workbookUsers.has(workbookId)) {
                workbookUsers.set(workbookId, new Set());
            }
            workbookUsers.get(workbookId).add(userInfo);

            // Tell others this user joined
            socket.to(room).emit('user-joined', userInfo);

            // Send current users to the new joiner
            socket.emit('current-users', getUsersArray(workbookId));

            logger.info('User joined workbook', { userName, userId, workbookId });
        });

        // ── LEAVE WORKBOOK ─────────────────────────────────────────────────
        socket.on('leave-workbook', ({ workbookId, userId }) => {
            _removeUserFromWorkbook(socket, io, workbookId, userId);
        });

        // ── CURSOR MOVE ────────────────────────────────────────────────────
        socket.on('cursor-move', ({ workbookId, position }) => {
            const room = `workbook-${workbookId}`;
            socket.to(room).emit('cursor-update', {
                socketId: socket.id,
                position, // { row, col, worksheetId }
            });
        });

        // ── CELL SELECTION ─────────────────────────────────────────────────
        socket.on('cell-select', ({ workbookId, selection }) => {
            const room = `workbook-${workbookId}`;
            socket.to(room).emit('cell-selection-update', {
                socketId: socket.id,
                selection, // { startRow, startCol, endRow, endCol, worksheetId }
            });
        });

        // ── TYPING INDICATOR ───────────────────────────────────────────────
        socket.on('typing', ({ workbookId, cell }) => {
            const room = `workbook-${workbookId}`;
            // Find user info to send with event
            const userInfo = _findUserInWorkbook(workbookId, socket.id);
            socket.to(room).emit('typing', { cell, user: userInfo });
        });

        socket.on('stop-typing', ({ workbookId, cell }) => {
            const room = `workbook-${workbookId}`;
            const userInfo = _findUserInWorkbook(workbookId, socket.id);
            socket.to(room).emit('stop-typing', { cell, user: userInfo });
        });

        // ── CELL EDIT WITH CONFLICT DETECTION ─────────────────────────────
        socket.on('cell-edit', async ({ workbookId, cellData }) => {
            const room = `workbook-${workbookId}`;

            // cellData: { row, col, value, formula, worksheetId }
            // Build a unique cell address string for conflict tracking
            const cellAddress = `${cellData.worksheetId}:${cellData.row}:${cellData.col}`;
            const now = Date.now();

            if (!cellState[workbookId]) cellState[workbookId] = {};

            const currentState = cellState[workbookId][cellAddress];

            // ── Conflict Check ─────────────────────────────────────────────
            // We allow conflicts between different SOCKETS even for the same user, 
            // since users often test by opening two tabs of the same account.
            if (
                currentState &&
                currentState.lastSocketId !== socket.id &&
                (now - currentState.lastTimestamp) < CONFLICT_WINDOW_MS
            ) {
                logger.warn('Cell edit conflict detected', {
                    workbookId,
                    cellAddress,
                    user1: currentState.lastUserId,
                    user2: socket.id,
                });

                const conflictingUserInfo = _findUserInWorkbook(workbookId, currentState.lastSocketId);
                const currentUserInfo = _findUserInWorkbook(workbookId, socket.id);

                // Store conflict in database and get the ID
                let conflictId = null;
                try {
                    const result = await pool.query(
                        `INSERT INTO conflicts 
                            (workbook_id, worksheet_id, row_idx, col_idx, user1_id, user1_value, user2_id, user2_value, status)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
                         RETURNING id`,
                        [
                            workbookId,
                            cellData.worksheetId,
                            cellData.row,
                            cellData.col,
                            currentState.lastUserId,
                            currentState.lastValue ?? null,
                            socket.handshake.auth?.userId ?? socket.id,
                            cellData.value ?? null,
                        ]
                    );
                    conflictId = result.rows[0].id;
                } catch (err) {
                    logger.error('Failed to store conflict in DB', { error: err.message });
                }

                // Notify BOTH users in the room about the conflict
                io.to(room).emit('cell-conflict', {
                    conflictId,
                    cell: cellAddress,
                    cellData,
                    user: currentUserInfo,
                    conflictingUser: conflictingUserInfo,
                    conflictingValue: currentState.lastValue,
                    serverDetected: true,
                });
            } else {
                // ── No Conflict — Regular Broadcast ───────────────────────
                // Update in-memory state
                cellState[workbookId][cellAddress] = {
                    lastUserId: socket.handshake.auth?.userId ?? socket.id,
                    lastSocketId: socket.id,
                    lastTimestamp: now,
                    lastValue: cellData.value,
                    lastFormula: cellData.formula,
                };

                // Persist latest edited cell so future loads and commits reflect user activity
                try {
                    const worksheetId = Number(cellData.worksheetId);
                    const row = Number(cellData.row);
                    const col = Number(cellData.col);
                    const address = toCellAddress(row, col);

                    if (!Number.isNaN(worksheetId) && !Number.isNaN(row) && !Number.isNaN(col)) {
                        await pool.query(
                            `INSERT INTO cells (worksheet_id, row_idx, col_idx, address, value, formula, style)
                             VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::jsonb, '{}'::jsonb))
                             ON CONFLICT (worksheet_id, row_idx, col_idx)
                             DO UPDATE SET value = EXCLUDED.value, formula = EXCLUDED.formula`,
                            [
                                worksheetId,
                                row,
                                col,
                                address,
                                cellData.value ?? null,
                                cellData.formula ?? null,
                                null,
                            ]
                        );

                        await pool.query(
                            'UPDATE workbooks SET updated_at = NOW() WHERE id = $1',
                            [workbookId]
                        );
                    }
                } catch (err) {
                    logger.error('Failed to persist cell edit', {
                        workbookId,
                        cellAddress,
                        error: err.message,
                    });
                }

                // Broadcast to OTHER users only
                socket.to(room).emit('cell-changed', {
                    socketId: socket.id,
                    cellData,
                    user: _findUserInWorkbook(workbookId, socket.id)
                });
            }
        });

        // ── CONFLICT RESOLUTION ────────────────────────────────────────────
        socket.on('resolve-conflict', async ({ conflictId, resolution, resolvedValue, resolvedBy, workbookId, cellData }) => {
            const room = `workbook-${workbookId}`;

            try {
                const worksheetId = Number(cellData?.worksheetId);
                const row = Number(cellData?.row);
                const col = Number(cellData?.col);

                if (!Number.isNaN(worksheetId) && !Number.isNaN(row) && !Number.isNaN(col)) {
                    const address = toCellAddress(row, col);
                    await pool.query(
                        `INSERT INTO cells (worksheet_id, row_idx, col_idx, address, value, formula, style)
                         VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::jsonb, '{}'::jsonb))
                         ON CONFLICT (worksheet_id, row_idx, col_idx)
                         DO UPDATE SET value = EXCLUDED.value`,
                        [
                            worksheetId,
                            row,
                            col,
                            address,
                            resolvedValue ?? null,
                            cellData?.formula ?? null,
                            null,
                        ]
                    );
                }

                await pool.query(
                    `UPDATE conflicts SET status = 'resolved', resolved_by = $1, resolved_at = NOW(), resolution = $2
                     WHERE id = $3`,
                    [resolvedBy, resolution, conflictId]
                );

                await pool.query(
                    'UPDATE workbooks SET updated_at = NOW() WHERE id = $1',
                    [workbookId]
                );

                // Notify all users in the workbook that the conflict is resolved
                io.to(room).emit('conflict-resolved', {
                    conflictId,
                    resolution,
                    resolvedValue,
                    resolvedBy,
                    cellData // So others know which cell to update
                });

                logger.info('Conflict resolved', { conflictId, resolution, resolvedBy, resolvedValue });
            } catch (err) {
                logger.error('Failed to resolve conflict in DB', { error: err.message, conflictId });
            }
        });

        // ── DISCONNECT ─────────────────────────────────────────────────────
        socket.on('disconnect', () => {
            logger.info('WebSocket client disconnected', { socketId: socket.id });

            // Remove from all workbooks they were in
            workbookUsers.forEach((users, workbookId) => {
                const userToRemove = Array.from(users).find(u => u.socketId === socket.id);
                if (userToRemove) {
                    users.delete(userToRemove);
                    io.to(`workbook-${workbookId}`).emit('user-left', {
                        socketId: socket.id,
                        userId: userToRemove.userId,
                    });
                }
            });
        });
    });

    logger.info('WebSocket collaboration server initialized');
}

// ─────────────────────────────────────────────
// Internal Helpers
// ─────────────────────────────────────────────
function _removeUserFromWorkbook(socket, io, workbookId, userId) {
    const room = `workbook-${workbookId}`;
    socket.leave(room);

    if (workbookUsers.has(workbookId)) {
        const users = workbookUsers.get(workbookId);
        const userToRemove = Array.from(users).find(u => u.socketId === socket.id);
        if (userToRemove) {
            users.delete(userToRemove);
            socket.to(room).emit('user-left', { socketId: socket.id, userId });
        }
    }

    logger.info('User left workbook', { userId, workbookId });
}

function _findUserInWorkbook(workbookId, socketId) {
    if (!workbookUsers.has(workbookId)) return null;
    return Array.from(workbookUsers.get(workbookId)).find(u => u.socketId === socketId) || null;
}

module.exports = { initWebSocket };
