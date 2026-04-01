/**
 * websocketServer.js
 * 
 * Real-time collaboration module for XcelTrack.
 * Handles: user presence, cursor tracking, cell edits,
 * conflict detection (DB-backed cell versioning), typing indicators,
 * and conflict resolution.
 * 
 * Conflict detection strategy:
 *   1. Primary: Compare incoming baseCellVersion vs current DB cell_version.
 *      If base < server AND values differ → conflict.
 *   2. Fallback: If no base version provided, check if a different user
 *      edited the same cell since last server write AND values differ.
 *   3. Same-value bypass: If incoming value/formula matches current DB
 *      value/formula exactly → no conflict, treat as no-op.
 *   4. Pending conflict reuse: If a pending conflict already exists for
 *      the same cell, update it instead of creating a duplicate.
 *   5. On conflict: persist conflict row first, then notify via socket.
 *      The incoming edit is NOT written to the cells table.
 */

const { logger } = require('./logger');

// ─────────────────────────────────────────────
// In-Memory State
// ─────────────────────────────────────────────

// { workbookId: Set<{socketId, userId, userName, color}> }
const workbookUsers = new Map();

// { workbookId: { cellAddress: { lastUserId, lastSocketId, lastTimestamp, lastValue, lastFormula } } }
const cellState = {};

// Track emitted conflict IDs to avoid duplicate socket notifications
const emittedConflictIds = new Set();

const USER_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
const CONFLICT_WINDOW_MS = Number(process.env.CONFLICT_WINDOW_MS || 10000);
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

function toWorkbookKey(workbookId) {
    return String(workbookId);
}

// ─────────────────────────────────────────────
// Helper: Serialize users set to array
// ─────────────────────────────────────────────
function getUsersArray(workbookId) {
    const workbookKey = toWorkbookKey(workbookId);
    if (!workbookUsers.has(workbookKey)) return [];
    return Array.from(workbookUsers.get(workbookKey));
}

// ─────────────────────────────────────────────
// Main init function
// ─────────────────────────────────────────────
function initWebSocket(io, pool) {
    io.on('connection', (socket) => {
        logger.info('WebSocket client connected', { socketId: socket.id });

        // ── JOIN USER CHANNEL (notifications) ─────────────────────────────
        socket.on('join-user-channel', ({ userId }) => {
            if (!userId) return;
            const room = `user-${userId}`;
            socket.join(room);
            logger.info('User joined notification channel', { userId, socketId: socket.id });
        });

        socket.on('leave-user-channel', ({ userId }) => {
            if (!userId) return;
            const room = `user-${userId}`;
            socket.leave(room);
            logger.info('User left notification channel', { userId, socketId: socket.id });
        });

        // ── JOIN WORKBOOK ──────────────────────────────────────────────────
        socket.on('join-workbook', ({ workbookId, userId, userName }) => {
            const workbookKey = toWorkbookKey(workbookId);
            const room = `workbook-${workbookKey}`;
            socket.join(room);

            socket.data.userId = userId;
            socket.data.userName = userName;

            const color = getNextColor();
            const userInfo = { socketId: socket.id, userId, userName, color };

            if (!workbookUsers.has(workbookKey)) {
                workbookUsers.set(workbookKey, new Set());
            }
            workbookUsers.get(workbookKey).add(userInfo);

            // Tell others this user joined
            socket.to(room).emit('user-joined', userInfo);

            // Send current users to the new joiner
            socket.emit('current-users', getUsersArray(workbookKey));

            logger.info('User joined workbook', { userName, userId, workbookId: workbookKey });
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

        // ══════════════════════════════════════════════════════════════════
        // ── CELL EDIT WITH DB-BACKED CONFLICT DETECTION ───────────────────
        // ══════════════════════════════════════════════════════════════════
        socket.on('cell-edit', async ({ workbookId, cellData }) => {
            const workbookKey = toWorkbookKey(workbookId);
            const room = `workbook-${workbookKey}`;

            // cellData: { row, col, value, formula, worksheetId, baseCellVersion? }
            const worksheetId = Number(cellData.worksheetId);
            const row = Number(cellData.row);
            const col = Number(cellData.col);
            const cellAddress = `${cellData.worksheetId}:${cellData.row}:${cellData.col}`;

            if (!cellState[workbookKey]) cellState[workbookKey] = {};

            const currentUserInfo = _findUserInWorkbook(workbookKey, socket.id);
            const currentEditorId = cellData?.editorId || currentUserInfo?.userId || socket.data?.userId || socket.handshake.auth?.userId || socket.id;
            const incomingValue = cellData?.value ?? '';
            const incomingFormula = cellData?.formula ?? '';
            const baseCellVersion = cellData?.baseCellVersion ?? null;

            // ── 1. Fetch current server state from DB ──────────────────────
            let serverValue = '';
            let serverFormula = '';
            let serverVersion = 0;
            let serverLastEditedBy = null;

            try {
                const serverCell = await pool.query(
                    'SELECT value, formula, cell_version, last_edited_by FROM cells WHERE worksheet_id = $1 AND row_idx = $2 AND col_idx = $3',
                    [worksheetId, row, col]
                );
                if (serverCell.rows.length > 0) {
                    serverValue = serverCell.rows[0].value ?? '';
                    serverFormula = serverCell.rows[0].formula ?? '';
                    serverVersion = serverCell.rows[0].cell_version ?? 1;
                    serverLastEditedBy = serverCell.rows[0].last_edited_by;
                }
            } catch (dbErr) {
                logger.error('Failed to fetch server cell state', {
                    error: dbErr.message,
                    workbookId,
                    cellAddress,
                });
                // If DB read fails, fall back to in-memory only
            }

            // ── 2. Same-value bypass ───────────────────────────────────────
            // If incoming value/formula matches current server state exactly,
            // treat as no-op — no conflict, no DB write needed.
            if (
                String(incomingValue) === String(serverValue) &&
                String(incomingFormula) === String(serverFormula)
            ) {
                // Update in-memory state so conflict tracking stays fresh
                const currentResolvedUserId = _resolveUserIdForWorkbook(workbookKey, currentEditorId) || currentEditorId;
                cellState[workbookKey][cellAddress] = {
                    lastUserId: currentResolvedUserId,
                    lastSocketId: socket.id,
                    lastTimestamp: Date.now(),
                    lastValue: incomingValue,
                    lastFormula: incomingFormula,
                };
                // No broadcast needed — value hasn't changed
                return;
            }

            // ── 3. Conflict detection ──────────────────────────────────────
            let isConflict = false;
            const currentResolvedUserId = _resolveUserIdForWorkbook(workbookKey, currentEditorId) || currentEditorId;
            const serverResolvedUserId = _resolveUserIdForWorkbook(workbookKey, serverLastEditedBy) || serverLastEditedBy;
            const inMemState = cellState[workbookKey][cellAddress];
            const now = Date.now();

            if (baseCellVersion !== null && baseCellVersion !== undefined) {
                // Primary check: base version is older than current server version
                if (serverVersion > baseCellVersion) {
                    if (
                        serverResolvedUserId &&
                        currentResolvedUserId &&
                        String(serverResolvedUserId) === String(currentResolvedUserId)
                    ) {
                        logger.info('Skipped stale-version conflict for same editor', {
                            workbookId: workbookKey,
                            cellAddress,
                            baseCellVersion,
                            serverVersion,
                            editor: currentResolvedUserId,
                        });
                    } else {
                        isConflict = true;
                        logger.info('Conflict detected via base version check', {
                            workbookId: workbookKey,
                            cellAddress,
                            baseCellVersion,
                            serverVersion,
                            editor: currentEditorId,
                        });
                    }
                }
            } else {
                // Fallback: different user edited same cell since last write
                const latestEditorId = inMemState?.lastUserId || serverLastEditedBy;
                const latestResolvedUserId = _resolveUserIdForWorkbook(workbookKey, latestEditorId) || latestEditorId;
                if (
                    latestEditorId &&
                    String(latestResolvedUserId) !== String(currentResolvedUserId) &&
                    String(latestEditorId) !== String(socket.id) &&
                    (
                        String(serverValue) !== String(incomingValue) ||
                        String(serverFormula) !== String(incomingFormula)
                    )
                ) {
                    isConflict = true;
                    logger.info('Conflict detected via fallback (different user)', {
                        workbookId: workbookKey,
                        cellAddress,
                        lastEditor: latestResolvedUserId,
                        currentEditor: currentEditorId,
                    });
                }
            }

            // Testing window: if another user edited this same cell very recently,
            // treat incoming different value as conflict even when versions match.
            if (!isConflict && inMemState) {
                const recentDifferentEditor =
                    inMemState.lastUserId &&
                    String(inMemState.lastUserId) !== String(currentResolvedUserId) &&
                    now - Number(inMemState.lastTimestamp || 0) <= CONFLICT_WINDOW_MS;

                if (
                    recentDifferentEditor &&
                    (
                        String(serverValue) !== String(incomingValue) ||
                        String(serverFormula) !== String(incomingFormula)
                    )
                ) {
                    isConflict = true;
                    logger.info('Conflict detected via recent edit window', {
                        workbookId: workbookKey,
                        cellAddress,
                        windowMs: CONFLICT_WINDOW_MS,
                        previousEditor: inMemState.lastUserId,
                        currentEditor: currentResolvedUserId,
                        elapsedMs: now - Number(inMemState.lastTimestamp || 0),
                    });
                }
            }

            // ── 4. CONFLICT PATH ───────────────────────────────────────────
            if (isConflict) {
                logger.warn('Cell edit conflict detected', {
                    workbookId: workbookKey,
                    cellAddress,
                    serverVersion,
                    baseCellVersion,
                    serverValue,
                    incomingValue,
                    editor: currentEditorId,
                    serverLastEditedBy,
                });

                const conflictingUserInfo = _findUserByUserId(workbookKey, serverResolvedUserId);

                // Check for existing pending conflict (reuse — no duplicates)
                let conflictId = null;
                try {
                    const existingConflict = await pool.query(
                        `SELECT id FROM conflicts
                         WHERE workbook_id = $1
                           AND worksheet_id = $2
                           AND row_idx = $3
                           AND col_idx = $4
                           AND status = 'pending'
                         ORDER BY created_at DESC
                         LIMIT 1`,
                        [workbookKey, worksheetId, row, col]
                    );

                    if (existingConflict.rows.length > 0) {
                        // Reuse existing pending conflict — update with new incoming data
                        conflictId = existingConflict.rows[0].id;
                        await pool.query(
                            `UPDATE conflicts
                             SET user2_id = $1,
                                 user2_value = $2,
                                 base_cell_version = $3
                             WHERE id = $4`,
                            [currentEditorId, incomingValue, baseCellVersion, conflictId]
                        );
                        logger.info('Reused existing pending conflict', { conflictId, cellAddress });
                    } else {
                        // Create new conflict
                        const result = await pool.query(
                            `INSERT INTO conflicts
                                (workbook_id, worksheet_id, row_idx, col_idx,
                                 user1_id, user1_value,
                                 user2_id, user2_value,
                                 status, base_cell_version)
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)
                             RETURNING id`,
                            [
                                workbookKey,
                                worksheetId,
                                row,
                                col,
                                serverResolvedUserId || 'unknown',
                                serverValue,
                                currentResolvedUserId,
                                incomingValue,
                                baseCellVersion,
                            ]
                        );
                        conflictId = result.rows[0].id;
                        logger.info('Created new conflict', { conflictId, cellAddress });
                    }
                } catch (err) {
                    logger.error('Failed to store conflict in DB', { error: err.message, cellAddress });
                }

                // ── Do NOT persist the incoming edit to cells table ─────────
                // The cell keeps its current server value until resolution.

                // ── Emit conflict notification ──────────────────────────────
                if (!conflictId || !emittedConflictIds.has(conflictId)) {
                    if (conflictId) {
                        emittedConflictIds.add(conflictId);
                    }

                    io.to(room).emit('cell-conflict', {
                        conflictId,
                        cell: cellAddress,
                        cellData: {
                            ...cellData,
                            value: incomingValue,
                        },
                        user: currentUserInfo,
                        conflictingUser: conflictingUserInfo || {
                            userId: serverResolvedUserId || 'unknown',
                            userName: serverResolvedUserId || 'Another user',
                            color: '#EF4444',
                        },
                        conflictingValue: serverValue,
                        serverVersion,
                        serverDetected: true,
                    });
                }

                // ── Acknowledge sender that edit was rejected ───────────────
                socket.emit('cell-edit-rejected', {
                    conflictId,
                    cellAddress,
                    reason: 'conflict',
                    serverValue,
                    serverFormula,
                    serverVersion,
                    cellData,
                });

                return; // Do NOT proceed to persist or broadcast
            }

            // ══════════════════════════════════════════════════════════════
            // ── 5. NO CONFLICT — Regular Persist & Broadcast ─────────────
            // ══════════════════════════════════════════════════════════════

            // Update in-memory state
            cellState[workbookKey][cellAddress] = {
                lastUserId: currentResolvedUserId,
                lastSocketId: socket.id,
                lastTimestamp: Date.now(),
                lastValue: incomingValue,
                lastFormula: incomingFormula,
            };

            // Persist to DB with cell_version increment
            let newCellVersion = serverVersion + 1;
            try {
                const address = toCellAddress(row, col);

                if (!Number.isNaN(worksheetId) && !Number.isNaN(row) && !Number.isNaN(col)) {
                    const upsertResult = await pool.query(
                        `INSERT INTO cells (worksheet_id, row_idx, col_idx, address, value, formula, style, cell_version, last_edited_by)
                         VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::jsonb, '{}'::jsonb), 1, $8)
                         ON CONFLICT (worksheet_id, row_idx, col_idx)
                         DO UPDATE SET
                            value = EXCLUDED.value,
                            formula = EXCLUDED.formula,
                            cell_version = cells.cell_version + 1,
                            last_edited_by = EXCLUDED.last_edited_by
                         RETURNING cell_version`,
                        [
                            worksheetId,
                            row,
                            col,
                            address,
                            cellData.value ?? null,
                            cellData.formula ?? null,
                            null,
                            currentResolvedUserId,
                        ]
                    );

                    if (upsertResult.rows.length > 0) {
                        newCellVersion = upsertResult.rows[0].cell_version;
                    }

                    await pool.query(
                        'UPDATE workbooks SET updated_at = NOW() WHERE id = $1',
                        [workbookKey]
                    );
                }
            } catch (err) {
                logger.error('Failed to persist cell edit', {
                    workbookId: workbookKey,
                    cellAddress,
                    error: err.message,
                });
            }

            // Broadcast to OTHER users only (include new cell version)
            socket.to(room).emit('cell-changed', {
                socketId: socket.id,
                cellData: {
                    ...cellData,
                    cellVersion: newCellVersion,
                },
                user: _findUserInWorkbook(workbookKey, socket.id),
            });

            // Acknowledge sender with the new cell version
            socket.emit('cell-edit-accepted', {
                cellAddress,
                cellVersion: newCellVersion,
                cellData,
            });
        });

        // ── CONFLICT RESOLUTION ────────────────────────────────────────────
        socket.on('resolve-conflict', async ({ conflictId, resolution, resolvedValue, resolvedBy, workbookId, cellData }) => {
            const workbookKey = toWorkbookKey(workbookId);
            const room = `workbook-${workbookKey}`;

            try {
                const worksheetId = Number(cellData?.worksheetId);
                const row = Number(cellData?.row);
                const col = Number(cellData?.col);

                let newCellVersion = 1;

                if (!Number.isNaN(worksheetId) && !Number.isNaN(row) && !Number.isNaN(col)) {
                    const address = toCellAddress(row, col);
                    const upsertResult = await pool.query(
                        `INSERT INTO cells (worksheet_id, row_idx, col_idx, address, value, formula, style, cell_version, last_edited_by)
                         VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::jsonb, '{}'::jsonb), 1, $8)
                         ON CONFLICT (worksheet_id, row_idx, col_idx)
                         DO UPDATE SET
                            value = EXCLUDED.value,
                            cell_version = cells.cell_version + 1,
                            last_edited_by = EXCLUDED.last_edited_by
                         RETURNING cell_version`,
                        [
                            worksheetId,
                            row,
                            col,
                            address,
                            resolvedValue ?? null,
                            cellData?.formula ?? null,
                            null,
                            resolvedBy,
                        ]
                    );

                    if (upsertResult.rows.length > 0) {
                        newCellVersion = upsertResult.rows[0].cell_version;
                    }
                }

                await pool.query(
                    `UPDATE conflicts SET status = 'resolved', resolved_by = $1, resolved_at = NOW(), resolution = $2
                     WHERE id = $3`,
                    [resolvedBy, resolution, conflictId]
                );

                emittedConflictIds.delete(conflictId);

                await pool.query(
                    'UPDATE workbooks SET updated_at = NOW() WHERE id = $1',
                    [workbookKey]
                );

                // Update in-memory state
                const cellAddress = `${cellData?.worksheetId}:${cellData?.row}:${cellData?.col}`;
                if (!cellState[workbookKey]) cellState[workbookKey] = {};
                cellState[workbookKey][cellAddress] = {
                    lastUserId: resolvedBy,
                    lastSocketId: socket.id,
                    lastTimestamp: Date.now(),
                    lastValue: resolvedValue,
                    lastFormula: cellData?.formula,
                };

                // Notify all users in the workbook that the conflict is resolved
                io.to(room).emit('conflict-resolved', {
                    conflictId,
                    resolution,
                    resolvedValue,
                    resolvedBy,
                    cellData: {
                        ...cellData,
                        cellVersion: newCellVersion,
                    },
                });

                logger.info('Conflict resolved', { conflictId, resolution, resolvedBy, resolvedValue, newCellVersion });
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
    const workbookKey = toWorkbookKey(workbookId);
    const room = `workbook-${workbookKey}`;
    socket.leave(room);

    if (workbookUsers.has(workbookKey)) {
        const users = workbookUsers.get(workbookKey);
        const userToRemove = Array.from(users).find(u => u.socketId === socket.id);
        if (userToRemove) {
            users.delete(userToRemove);
            socket.to(room).emit('user-left', { socketId: socket.id, userId });
        }
    }

    logger.info('User left workbook', { userId, workbookId: workbookKey });
}

function _findUserInWorkbook(workbookId, socketId) {
    const workbookKey = toWorkbookKey(workbookId);
    if (!workbookUsers.has(workbookKey)) return null;
    return Array.from(workbookUsers.get(workbookKey)).find(u => u.socketId === socketId) || null;
}

function _findUserByUserId(workbookId, userId) {
    const workbookKey = toWorkbookKey(workbookId);
    if (!workbookUsers.has(workbookKey) || !userId) return null;
    return Array.from(workbookUsers.get(workbookKey)).find(u => u.userId === userId) || null;
}

function _resolveUserIdForWorkbook(workbookId, editorIdentifier) {
    if (!editorIdentifier) return null;

    const directUser = _findUserByUserId(workbookId, editorIdentifier);
    if (directUser?.userId) return directUser.userId;

    const bySocket = _findUserInWorkbook(workbookId, editorIdentifier);
    if (bySocket?.userId) return bySocket.userId;

    return null;
}

module.exports = { initWebSocket };
