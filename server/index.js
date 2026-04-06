const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
const admin = require('./firebaseAdmin');
const nodemailer = require('nodemailer');
require('dotenv').config();
const multer = require('multer');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Import optimization modules
const { logger, requestLogger } = require('./logger');
const { cache, closeRedis } = require('./cache');
const {
    generalLimiter,
    authLimiter,
    otpLimiter,
    uploadLimiter,
    adminLimiter,
    commitLimiter,
    aiLimiter,
} = require('./rateLimiter');
const FileProcessor = require('./fileProcessor');
const DiffEngine = require('./diffEngine');
const AIService = require('./aiService');
const { initWebSocket } = require('./websocketServer');

const app = express();
const port = process.env.PORT || 5000;

// Create HTTP server for Socket.io
const http = require('http');
const server = http.createServer(app);

// Initialize Socket.io
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors());
app.use(express.json());
app.use(requestLogger); // HTTP request logging

// Add request ID for tracking
app.use((req, res, next) => {
    req.id = crypto.randomUUID();
    next();
});

// Postgres Configuration with Optimized Connection Pooling
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    max: 20, // Maximum number of clients in the pool
    min: 5, // Minimum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Pool event listeners for monitoring
pool.on('connect', () => {
    console.log('New client connected to the pool');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

pool.on('remove', () => {
    console.log('Client removed from pool');
});

// Email Configuration
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// Test DB Connection
if (process.env.NODE_ENV !== 'test') {
    pool.connect((err, client, release) => {
        if (err) {
            return console.error('Error acquiring client', err.stack);
        }
        client.query('SELECT NOW()', (err, result) => {
            release();
            if (err) {
                return console.error('Error executing query', err.stack);
            }
            console.log('Connected to PostgreSQL Database');
        });
    });
}

// Create tables if they don't exist
const createTables = async () => {
    try {
        // OTP Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS otp_verifications (
                email VARCHAR(255) PRIMARY KEY,
                otp_code VARCHAR(6) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                expires_at TIMESTAMP NOT NULL,
                attempts INT DEFAULT 0
            )
        `);
        console.log('OTP table ready');

        // Users Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                firebase_uid VARCHAR(255) PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255),
                role VARCHAR(20) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('Users table ready');

        // User Settings Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_settings (
                user_id VARCHAR(255) PRIMARY KEY REFERENCES users(firebase_uid) ON DELETE CASCADE,
                auto_save_interval INT DEFAULT 10,
                version_history_limit INT DEFAULT 50,
                email_alerts BOOLEAN DEFAULT TRUE,
                collaboration_invites BOOLEAN DEFAULT TRUE,
                public_profile BOOLEAN DEFAULT TRUE,
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('User settings table ready');

        // Workbooks Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS workbooks (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                owner_id VARCHAR(255) NOT NULL, 
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('Workbooks table ready');

        await pool.query(`
            ALTER TABLE workbooks
            ADD COLUMN IF NOT EXISTS storage_bytes BIGINT DEFAULT 0
        `);

        // Worksheets Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS worksheets (
                id SERIAL PRIMARY KEY,
                workbook_id INT REFERENCES workbooks(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                sheet_order INT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('Worksheets table ready');

        // Workbook Collaborators Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS workbook_collaborators (
                id SERIAL PRIMARY KEY,
                workbook_id INT REFERENCES workbooks(id) ON DELETE CASCADE,
                user_id VARCHAR(255) REFERENCES users(firebase_uid) ON DELETE CASCADE,
                added_by VARCHAR(255),
                added_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(workbook_id, user_id)
            )
        `);
        console.log('Workbook collaborators table ready');

        // Conflicts Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS conflicts (
                id SERIAL PRIMARY KEY,
                workbook_id INT REFERENCES workbooks(id) ON DELETE CASCADE,
                worksheet_id INT REFERENCES worksheets(id) ON DELETE CASCADE,
                row_idx INT NOT NULL,
                col_idx INT NOT NULL,
                user1_id VARCHAR(255) NOT NULL,
                user1_value TEXT,
                user2_id VARCHAR(255) NOT NULL,
                user2_value TEXT,
                status VARCHAR(20) DEFAULT 'pending', -- pending, resolved
                resolved_by VARCHAR(255),
                resolution TEXT,
                resolved_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('Conflicts table ready');

        await pool.query(`
            ALTER TABLE conflicts
            ADD COLUMN IF NOT EXISTS resolution TEXT
        `);

        // Cells Table (Latest State)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cells (
                id SERIAL PRIMARY KEY,
                worksheet_id INT REFERENCES worksheets(id) ON DELETE CASCADE,
                row_idx INT NOT NULL,
                col_idx INT NOT NULL,
                address VARCHAR(10) NOT NULL,
                value TEXT,
                formula TEXT,
                style JSONB,
                cell_version INT DEFAULT 1,
                last_edited_by VARCHAR(255),
                UNIQUE(worksheet_id, row_idx, col_idx)
            )
        `);
        console.log('Cells table ready');

        // Migration: add cell_version and last_edited_by columns if missing
        await pool.query(`ALTER TABLE cells ADD COLUMN IF NOT EXISTS cell_version INT DEFAULT 1`);
        await pool.query(`ALTER TABLE cells ADD COLUMN IF NOT EXISTS last_edited_by VARCHAR(255)`);

        // Migration: add base_cell_version to conflicts table
        await pool.query(`ALTER TABLE conflicts ADD COLUMN IF NOT EXISTS base_cell_version INT`);

        // Commits Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS commits (
                id SERIAL PRIMARY KEY,
                workbook_id INT REFERENCES workbooks(id) ON DELETE CASCADE,
                user_id VARCHAR(255) NOT NULL,
                message TEXT,
                timestamp TIMESTAMP DEFAULT NOW(),
                hash VARCHAR(64) UNIQUE
            )
        `);
        console.log('Commits table ready');

        // Cell Versions Table (History)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cell_versions (
                id SERIAL PRIMARY KEY,
                commit_id INT REFERENCES commits(id) ON DELETE CASCADE,
                cell_id INT REFERENCES cells(id) ON DELETE CASCADE,
                value TEXT,
                formula TEXT,
                style JSONB
            )
        `);
        console.log('Cell Versions table ready');

        // Commit Changes Table (Optimized Diffs)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS commit_changes (
                id SERIAL PRIMARY KEY,
                commit_id INT REFERENCES commits(id) ON DELETE CASCADE,
                cell_id INT REFERENCES cells(id) ON DELETE CASCADE,
                change_type VARCHAR(20), -- added, modified, deleted
                old_value TEXT,
                new_value TEXT,
                old_formula TEXT,
                new_formula TEXT
            )
        `);
        console.log('Commit changes table ready');

        // Audit Logs Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255),
                user_email VARCHAR(255),
                action VARCHAR(100) NOT NULL,
                details JSONB,
                ip_address VARCHAR(45),
                timestamp TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('Audit logs table ready');

        // Notifications Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) REFERENCES users(firebase_uid) ON DELETE CASCADE,
                type VARCHAR(20) DEFAULT 'info',
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                metadata JSONB,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('Notifications table ready');

        // AI Usage Logs Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ai_usage_logs (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) REFERENCES users(firebase_uid) ON DELETE SET NULL,
                workbook_id INT REFERENCES workbooks(id) ON DELETE SET NULL,
                endpoint VARCHAR(100) NOT NULL,
                provider VARCHAR(50),
                model VARCHAR(100),
                prompt_tokens INT DEFAULT 0,
                completion_tokens INT DEFAULT 0,
                total_tokens INT DEFAULT 0,
                estimated_cost_usd NUMERIC(12, 6) DEFAULT 0,
                status VARCHAR(20) DEFAULT 'success',
                metadata JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('AI usage logs table ready');

        // Create indexes for optimized query performance
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_workbooks_owner_id ON workbooks(owner_id);
            CREATE INDEX IF NOT EXISTS idx_workbooks_updated_at ON workbooks(updated_at DESC);
            CREATE INDEX IF NOT EXISTS idx_workbook_collaborators_workbook_id ON workbook_collaborators(workbook_id);
            CREATE INDEX IF NOT EXISTS idx_workbook_collaborators_user_id ON workbook_collaborators(user_id);
            CREATE INDEX IF NOT EXISTS idx_worksheets_workbook_id ON worksheets(workbook_id);
            CREATE INDEX IF NOT EXISTS idx_cells_worksheet_id ON cells(worksheet_id);
            CREATE INDEX IF NOT EXISTS idx_cells_row_col ON cells(worksheet_id, row_idx, col_idx);
            CREATE INDEX IF NOT EXISTS idx_commits_workbook_id ON commits(workbook_id);
            CREATE INDEX IF NOT EXISTS idx_commits_timestamp ON commits(timestamp DESC);
            CREATE INDEX IF NOT EXISTS idx_commits_workbook_timestamp ON commits(workbook_id, timestamp DESC);
            CREATE INDEX IF NOT EXISTS idx_cell_versions_commit_id ON cell_versions(commit_id);
            CREATE INDEX IF NOT EXISTS idx_cell_versions_cell_id ON cell_versions(cell_id);
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verifications(email);
            CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
            CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
            CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
            CREATE INDEX IF NOT EXISTS idx_ai_usage_user_created ON ai_usage_logs(user_id, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_ai_usage_workbook_created ON ai_usage_logs(workbook_id, created_at DESC);
        `);
        console.log('Database indexes created successfully');

    } catch (err) {
        console.error('Error creating tables:', err);
    }
};

if (process.env.NODE_ENV !== 'test') {
    createTables();
}

const diffEngine = new DiffEngine(pool);
const aiService = new AIService();

// --- Audit Log Helper ---
const logAuditEvent = async (userId, userEmail, action, details, ipAddress) => {
    try {
        await pool.query(
            'INSERT INTO audit_logs (user_id, user_email, action, details, ip_address) VALUES ($1, $2, $3, $4, $5)',
            [userId || null, userEmail || null, action, details ? JSON.stringify(details) : null, ipAddress || null]
        );
    } catch (err) {
        logger.error('Failed to write audit log', { error: err.message, action });
    }
};

const logAiUsage = async ({
    userId,
    workbookId = null,
    endpoint,
    provider = 'heuristic',
    model = 'local-rule-engine',
    usage = {},
    estimatedCostUsd = 0,
    status = 'success',
    metadata = null,
}) => {
    try {
        await pool.query(
            `INSERT INTO ai_usage_logs
                (user_id, workbook_id, endpoint, provider, model, prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd, status, metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                userId || null,
                workbookId || null,
                endpoint,
                provider,
                model,
                usage?.prompt_tokens || 0,
                usage?.completion_tokens || 0,
                usage?.total_tokens || 0,
                estimatedCostUsd || 0,
                status,
                metadata ? JSON.stringify(metadata) : null,
            ]
        );
    } catch (error) {
        logger.warn('Failed to log AI usage', { error: error.message, endpoint, userId });
    }
};

const createNotifications = async ({ userIds = [], type = 'info', title, message, metadata = null }) => {
    if (!title || !message || !Array.isArray(userIds) || userIds.length === 0) return;

    const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
    for (const userId of uniqueUserIds) {
        try {
            const notificationResult = await pool.query(
                `INSERT INTO notifications (user_id, type, title, message, metadata)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, created_at, is_read`,
                [userId, type, title, message, metadata ? JSON.stringify(metadata) : null]
            );

            const insertedNotification = notificationResult.rows[0] || {};
            io.to(`user-${userId}`).emit('notification:new', {
                id: insertedNotification.id,
                user_id: userId,
                userId,
                type,
                title,
                message,
                metadata,
                is_read: insertedNotification.is_read ?? false,
                created_at: insertedNotification.created_at || new Date().toISOString(),
            });
        } catch (notificationError) {
            logger.warn('Failed to create notification', {
                error: notificationError.message,
                userId,
                title,
            });
        }
    }
};

const toCellAddress = (row, col) => {
    let colNumber = Number(col) + 1;
    let colLetters = '';

    while (colNumber > 0) {
        const remainder = (colNumber - 1) % 26;
        colLetters = String.fromCharCode(65 + remainder) + colLetters;
        colNumber = Math.floor((colNumber - 1) / 26);
    }

    return `${colLetters}${Number(row) + 1}`;
};

const parsePagination = (limitRaw, offsetRaw, defaultLimit = null, maxLimit = 200) => {
    const hasLimit = limitRaw !== undefined && limitRaw !== null && limitRaw !== '';
    const hasOffset = offsetRaw !== undefined && offsetRaw !== null && offsetRaw !== '';

    const parsedLimit = hasLimit ? parseInt(limitRaw, 10) : defaultLimit;
    const parsedOffset = hasOffset ? parseInt(offsetRaw, 10) : 0;

    if (parsedLimit !== null && (Number.isNaN(parsedLimit) || parsedLimit <= 0)) {
        return { error: 'limit must be a positive integer' };
    }
    if (Number.isNaN(parsedOffset) || parsedOffset < 0) {
        return { error: 'offset must be a non-negative integer' };
    }

    const effectiveLimit = parsedLimit === null ? null : Math.min(parsedLimit, maxLimit);
    return {
        limit: effectiveLimit,
        offset: parsedOffset,
        hasPagination: hasLimit || hasOffset,
    };
};

const STORAGE_LIMIT_BYTES = 500 * 1024 * 1024;

const getUserStorageUsedBytes = async (dbClient, userId) => {
    const storageResult = await dbClient.query(
        `SELECT COALESCE(
            SUM(
                CASE
                    WHEN COALESCE(w.storage_bytes, 0) > 0 THEN w.storage_bytes
                    ELSE COALESCE(legacy.estimated_bytes, 0)
                END
            ),
            0
        )::bigint AS storage_used_bytes
         FROM workbooks w
         LEFT JOIN (
            SELECT
                ws.workbook_id,
                COALESCE(
                    SUM(
                        OCTET_LENGTH(COALESCE(c.value, '')) +
                        OCTET_LENGTH(COALESCE(c.formula, ''))
                    ),
                    0
                )::bigint AS estimated_bytes
            FROM worksheets ws
            LEFT JOIN cells c ON c.worksheet_id = ws.id
            GROUP BY ws.workbook_id
         ) legacy ON legacy.workbook_id = w.id
         WHERE w.owner_id = $1`,
        [userId]
    );

    const storageRow = storageResult.rows?.[0];
    return Number(storageRow?.storage_used_bytes || 0);
};

const persistUploadedFile = async (file) => {
    const storageMode = (process.env.UPLOAD_STORAGE_MODE || 'db').toLowerCase();
    if (!['db', 'local', 'both'].includes(storageMode)) {
        throw new Error('Invalid UPLOAD_STORAGE_MODE. Expected db, local, or both');
    }

    const shouldWriteLocal = storageMode === 'local' || storageMode === 'both';
    if (!shouldWriteLocal) {
        return { mode: storageMode, localPath: null };
    }

    const uploadsDir = process.env.UPLOADS_DIR
        ? path.resolve(process.env.UPLOADS_DIR)
        : path.resolve(__dirname, 'uploads');

    await fs.promises.mkdir(uploadsDir, { recursive: true });
    const safeName = (file.originalname || 'upload.xlsx').replace(/[^a-zA-Z0-9._-]/g, '_');
    const stampedName = `${Date.now()}-${safeName}`;
    const absolutePath = path.join(uploadsDir, stampedName);
    await fs.promises.writeFile(absolutePath, file.buffer);

    return {
        mode: storageMode,
        localPath: absolutePath,
    };
};

const getRequesterId = (req) => {
    return (
        req.headers['x-user-id'] ||
        req.query?.requester_id ||
        req.body?.requester_id ||
        req.body?.actor_id ||
        req.body?.user_id ||
        req.body?.owner_id ||
        null
    );
};

const requireRequester = async (req, res, next) => {
    try {
        const requesterId = getRequesterId(req);
        if (!requesterId) {
            return res.status(401).json({ error: 'requester_id is required', code: 'REQUESTER_REQUIRED' });
        }

        const requesterResult = await pool.query(
            'SELECT firebase_uid, email, role FROM users WHERE firebase_uid = $1',
            [requesterId]
        );

        if (requesterResult.rows.length === 0) {
            return res.status(401).json({ error: 'Requester not found', code: 'REQUESTER_NOT_FOUND' });
        }

        req.requester = requesterResult.rows[0];
        req.requesterId = requesterResult.rows[0].firebase_uid;
        req.requesterRole = (requesterResult.rows[0].role || 'user').toLowerCase();
        next();
    } catch (error) {
        logger.error('Requester validation failed', { error: error.message });
        res.status(500).json({ error: 'Failed to validate requester' });
    }
};

const requireAdmin = (req, res, next) => {
    if (!req.requesterRole || req.requesterRole !== 'admin') {
        return res.status(403).json({ error: 'Admin role required', code: 'ADMIN_REQUIRED' });
    }
    next();
};

const requireNonViewer = (req, res, next) => {
    if (req.requesterRole === 'viewer') {
        return res.status(403).json({ error: 'Viewer role cannot modify data', code: 'VIEWER_READ_ONLY' });
    }
    next();
};

const loadWorkbookAccess = async (req, res, next) => {
    try {
        const workbookId = parseInt(req.params.id || req.body?.workbook_id, 10);
        if (!workbookId || Number.isNaN(workbookId)) {
            return res.status(400).json({ error: 'Valid workbook ID is required', code: 'INVALID_WORKBOOK_ID' });
        }

        const workbookResult = await pool.query(
            `SELECT
                w.id,
                w.name,
                w.owner_id,
                CASE WHEN wc.user_id IS NOT NULL THEN true ELSE false END as is_collaborator
             FROM workbooks w
             LEFT JOIN workbook_collaborators wc
                ON wc.workbook_id = w.id AND wc.user_id = $2
             WHERE w.id = $1`,
            [workbookId, req.requesterId]
        );

        if (workbookResult.rows.length === 0) {
            return res.status(404).json({ error: 'Workbook not found', code: 'WORKBOOK_NOT_FOUND' });
        }

        const workbook = workbookResult.rows[0];
        const isOwner = workbook.owner_id === req.requesterId;
        const isCollaborator = workbook.is_collaborator === true;
        const isAdmin = req.requesterRole === 'admin';

        req.workbookAccess = {
            workbookId,
            workbook,
            isOwner,
            isCollaborator,
            isAdmin,
            canRead: isOwner || isCollaborator || isAdmin,
            canWrite: (isOwner || isCollaborator || isAdmin) && req.requesterRole !== 'viewer',
        };

        next();
    } catch (error) {
        logger.error('Failed loading workbook access', { error: error.message, requesterId: req.requesterId });
        res.status(500).json({ error: 'Failed to evaluate workbook access' });
    }
};

const requireWorkbookRead = (req, res, next) => {
    if (!req.workbookAccess?.canRead) {
        return res.status(403).json({ error: 'Access denied to workbook', code: 'WORKBOOK_READ_FORBIDDEN' });
    }
    next();
};

const requireWorkbookWrite = (req, res, next) => {
    if (!req.workbookAccess?.canWrite) {
        return res.status(403).json({ error: 'Write access denied for workbook', code: 'WORKBOOK_WRITE_FORBIDDEN' });
    }
    next();
};

const requireWorkbookOwnerOrAdmin = (req, res, next) => {
    if (!req.workbookAccess || (!req.workbookAccess.isOwner && !req.workbookAccess.isAdmin)) {
        return res.status(403).json({ error: 'Owner or admin access required', code: 'OWNER_REQUIRED' });
    }
    next();
};

const requireWorkbookOwner = (req, res, next) => {
    if (!req.workbookAccess?.isOwner) {
        return res.status(403).json({ error: 'Only the workbook owner can perform this action', code: 'OWNER_ONLY_REQUIRED' });
    }
    next();
};

const loadCommitAccess = async (req, res, next) => {
    try {
        const commitId = parseInt(req.params.id || req.params.commitId, 10);
        if (!commitId || Number.isNaN(commitId)) {
            return res.status(400).json({ error: 'Valid commit ID is required', code: 'INVALID_COMMIT_ID' });
        }

        const commitResult = await pool.query(
            `SELECT c.*, w.owner_id,
                    CASE WHEN wc.user_id IS NOT NULL THEN true ELSE false END as is_collaborator
             FROM commits c
             JOIN workbooks w ON w.id = c.workbook_id
             LEFT JOIN workbook_collaborators wc
                ON wc.workbook_id = w.id AND wc.user_id = $2
             WHERE c.id = $1`,
            [commitId, req.requesterId]
        );

        if (commitResult.rows.length === 0) {
            return res.status(404).json({ error: 'Commit not found', code: 'COMMIT_NOT_FOUND' });
        }

        const commit = commitResult.rows[0];
        const isOwner = commit.owner_id === req.requesterId;
        const isCollaborator = commit.is_collaborator === true;
        const isAdmin = req.requesterRole === 'admin';

        if (!(isOwner || isCollaborator || isAdmin)) {
            return res.status(403).json({ error: 'Access denied for commit', code: 'COMMIT_READ_FORBIDDEN' });
        }

        req.commitAccess = { commit, isOwner, isCollaborator, isAdmin };
        next();
    } catch (error) {
        logger.error('Failed loading commit access', { error: error.message, requesterId: req.requesterId });
        res.status(500).json({ error: 'Failed to evaluate commit access' });
    }
};

const loadCellAccess = async (req, res, next) => {
    try {
        const cellId = parseInt(req.params.cellId, 10);
        if (!cellId || Number.isNaN(cellId)) {
            return res.status(400).json({ error: 'Valid cell ID is required', code: 'INVALID_CELL_ID' });
        }

        const cellResult = await pool.query(
            `SELECT c.id, c.worksheet_id, w.id as workbook_id, w.owner_id,
                    CASE WHEN wc.user_id IS NOT NULL THEN true ELSE false END as is_collaborator
             FROM cells c
             JOIN worksheets ws ON ws.id = c.worksheet_id
             JOIN workbooks w ON w.id = ws.workbook_id
             LEFT JOIN workbook_collaborators wc
                ON wc.workbook_id = w.id AND wc.user_id = $2
             WHERE c.id = $1`,
            [cellId, req.requesterId]
        );

        if (cellResult.rows.length === 0) {
            return res.status(404).json({ error: 'Cell not found', code: 'CELL_NOT_FOUND' });
        }

        const cell = cellResult.rows[0];
        const isOwner = cell.owner_id === req.requesterId;
        const isCollaborator = cell.is_collaborator === true;
        const isAdmin = req.requesterRole === 'admin';

        if (!(isOwner || isCollaborator || isAdmin)) {
            return res.status(403).json({ error: 'Access denied for cell history', code: 'CELL_HISTORY_FORBIDDEN' });
        }

        req.cellAccess = {
            cellId,
            worksheetId: cell.worksheet_id,
            workbookId: cell.workbook_id,
            isOwner,
            isCollaborator,
            isAdmin,
        };

        next();
    } catch (error) {
        logger.error('Failed loading cell access', { error: error.message, requesterId: req.requesterId });
        res.status(500).json({ error: 'Failed to evaluate cell access' });
    }
};

// --- OTP Endpoints ---

// Send OTP
app.post('/api/send-otp', otpLimiter, async (req, res) => {
    const { email, name } = req.body;

    if (!email || !name) {
        return res.status(400).json({ error: 'Email and name are required' });
    }

    try {
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Delete any existing OTP for this email
        await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email]);

        // Store OTP in database
        await pool.query(
            'INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES ($1, $2, $3)',
            [email, otp, expiresAt]
        );

        // Send email
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'XcelTrack <noreply@xceltrack.com>',
            to: email,
            subject: 'Verify Your XcelTrack Account - OTP Code',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                        .otp-box { background: white; border: 2px solid #3b82f6; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
                        .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #3b82f6; }
                        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
                        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to XcelTrack!</h1>
                        </div>
                        <div class="content">
                            <p>Hi <strong>${name}</strong>,</p>
                            <p>Thank you for signing up! To complete your registration, please verify your email address using the OTP code below:</p>
                            
                            <div class="otp-box">
                                <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">Your OTP Code</div>
                                <div class="otp-code">${otp}</div>
                                <div style="color: #6b7280; font-size: 12px; margin-top: 10px;">Valid for 10 minutes</div>
                            </div>

                            <div class="warning">
                                <strong>⚠️ Security Notice:</strong> Never share this code with anyone. XcelTrack will never ask for your OTP via phone or email.
                            </div>

                            <p>If you didn't request this code, please ignore this email.</p>
                            
                            <p>Best regards,<br><strong>The XcelTrack Team</strong></p>
                        </div>
                        <div class="footer">
                            <p>This is an automated message, please do not reply.</p>
                            <p>&copy; 2025 XcelTrack. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);

        console.log(`OTP sent to ${email}: ${otp}`); // For development - remove in production
        res.json({ message: 'OTP sent successfully' });

    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
    }
});

// Verify OTP
app.post('/api/verify-otp', otpLimiter, async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
    }

    try {
        // Get OTP record
        const result = await pool.query(
            'SELECT * FROM otp_verifications WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No OTP found for this email. Please request a new one.' });
        }

        const otpRecord = result.rows[0];

        // Check if OTP has expired
        if (new Date() > new Date(otpRecord.expires_at)) {
            await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email]);
            return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
        }

        // Check attempt limit
        if (otpRecord.attempts >= 5) {
            await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email]);
            return res.status(429).json({ error: 'Too many failed attempts. Please request a new OTP.' });
        }

        // Verify OTP
        if (otpRecord.otp_code !== otp) {
            // Increment attempts
            await pool.query(
                'UPDATE otp_verifications SET attempts = attempts + 1 WHERE email = $1',
                [email]
            );
            return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
        }

        // OTP is valid! Delete it from database
        await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email]);

        res.json({ message: 'OTP verified successfully' });

    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ error: 'Failed to verify OTP. Please try again.' });
    }
});

// Password reset and account recovery
app.post('/api/password-reset', authLimiter, async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'email is required', code: 'EMAIL_REQUIRED' });
    }

    try {
        const userResult = await pool.query('SELECT firebase_uid, email FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            await logAuditEvent(null, email, 'PASSWORD_RESET_REQUEST_MISSING_USER', { email }, req.ip);
            return res.status(404).json({ error: 'No account found for this email', code: 'USER_NOT_FOUND' });
        }

        const resetLink = await admin.auth().generatePasswordResetLink(email);
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'XcelTrack <noreply@xceltrack.com>',
            to: email,
            subject: 'XcelTrack Password Reset',
            html: `<p>You requested a password reset for XcelTrack.</p><p><a href="${resetLink}">Reset your password</a></p><p>If this was not you, ignore this email.</p>`,
        });

        await logAuditEvent(userResult.rows[0].firebase_uid, email, 'PASSWORD_RESET_LINK_SENT', { email }, req.ip);

        res.json({ message: 'Password reset link sent successfully' });
    } catch (error) {
        logger.error('Password reset failed', { error: error.message, email });
        await logAuditEvent(null, email, 'PASSWORD_RESET_FAILED', { error: error.message }, req.ip);
        res.status(500).json({ error: 'Failed to process password reset request' });
    }
});

// Notifications feed for requester
app.get('/api/notifications', requireRequester, async (req, res) => {
    const { limit = 50, offset = 0, unreadOnly = 'false' } = req.query;

    try {
        const result = await pool.query(
            `SELECT * FROM notifications
             WHERE user_id = $1
               AND ($2::boolean = false OR is_read = false)
             ORDER BY created_at DESC
             LIMIT $3 OFFSET $4`,
            [req.requesterId, unreadOnly === 'true', limit, offset]
        );

        res.json({ notifications: result.rows });
    } catch (error) {
        logger.error('Failed to fetch notifications', { error: error.message, requesterId: req.requesterId });
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Create notification (admin/system use)
app.post('/api/notifications', requireRequester, requireAdmin, async (req, res) => {
    const { user_ids = [], type = 'info', title, message, metadata } = req.body;

    if (!Array.isArray(user_ids) || user_ids.length === 0 || !title || !message) {
        return res.status(400).json({ error: 'user_ids, title and message are required', code: 'INVALID_NOTIFICATION_PAYLOAD' });
    }

    await createNotifications({ userIds: user_ids, type, title, message, metadata });
    res.status(201).json({ message: 'Notifications created' });
});

// Mark one notification as read
app.post('/api/notifications/:id/read', requireRequester, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `UPDATE notifications
             SET is_read = true
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [id, req.requesterId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found', code: 'NOTIFICATION_NOT_FOUND' });
        }

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        logger.error('Failed to mark notification as read', { error: error.message, requesterId: req.requesterId, notificationId: id });
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// Mark all notifications as read
app.post('/api/notifications/read-all', requireRequester, async (req, res) => {
    try {
        await pool.query(
            'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
            [req.requesterId]
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        logger.error('Failed to mark all notifications as read', { error: error.message, requesterId: req.requesterId });
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

// Delete a notification
app.delete('/api/notifications/:id', requireRequester, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, req.requesterId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found', code: 'NOTIFICATION_NOT_FOUND' });
        }
        res.json({ message: 'Notification cleared' });
    } catch (error) {
        logger.error('Failed to delete notification', { error: error.message, requesterId: req.requesterId, notificationId: id });
        res.status(500).json({ error: 'Failed to clear notification' });
    }
});

// AI: Explain formula
app.post('/api/ai/explain-formula', aiLimiter, requireRequester, async (req, res) => {
    const { formula, workbook_id, worksheet_name, cell_reference } = req.body;

    if (!formula || String(formula).trim().length === 0) {
        return res.status(400).json({ error: 'formula is required', code: 'FORMULA_REQUIRED' });
    }

    try {
        const result = await aiService.explainFormula({
            formula,
            context: {
                workbook_id,
                worksheet_name,
                cell_reference,
            },
        });

        await logAiUsage({
            userId: req.requesterId,
            workbookId: workbook_id || null,
            endpoint: '/api/ai/explain-formula',
            provider: result.provider,
            model: result.model,
            usage: result.usage,
            metadata: { fallback: result.fallback === true },
            status: 'success',
        });

        res.json({
            formula,
            explanation: result.explanation,
            provider: result.provider,
            model: result.model,
            fallback: result.fallback,
        });
    } catch (error) {
        await logAiUsage({
            userId: req.requesterId,
            workbookId: workbook_id || null,
            endpoint: '/api/ai/explain-formula',
            status: 'failed',
            metadata: { error: error.message },
        });

        logger.error('AI formula explanation failed', { error: error.message, requesterId: req.requesterId });
        res.status(500).json({ error: 'Failed to explain formula' });
    }
});

// AI: Detect workbook errors
app.post('/api/ai/detect-errors', aiLimiter, requireRequester, loadWorkbookAccess, requireWorkbookRead, async (req, res) => {
    const { workbook_id } = req.body;
    if (!workbook_id) {
        return res.status(400).json({ error: 'workbook_id is required', code: 'WORKBOOK_ID_REQUIRED' });
    }

    try {
        const cellsResult = await pool.query(
            `SELECT c.address, c.value, c.formula, c.row_idx, c.col_idx, ws.name as worksheet_name
             FROM cells c
             JOIN worksheets ws ON ws.id = c.worksheet_id
             WHERE ws.workbook_id = $1`,
            [workbook_id]
        );

        const report = aiService.detectErrors(cellsResult.rows);

        await logAiUsage({
            userId: req.requesterId,
            workbookId: workbook_id,
            endpoint: '/api/ai/detect-errors',
            provider: 'heuristic',
            model: 'local-rule-engine',
            metadata: { totalScanned: report.totalScanned, totalIssues: report.totalIssues },
            status: 'success',
        });

        res.json({
            workbook_id: Number(workbook_id),
            ...report,
        });
    } catch (error) {
        await logAiUsage({
            userId: req.requesterId,
            workbookId: workbook_id,
            endpoint: '/api/ai/detect-errors',
            status: 'failed',
            metadata: { error: error.message },
        });

        logger.error('AI error detection failed', { error: error.message, workbookId: workbook_id });
        res.status(500).json({ error: 'Failed to detect workbook errors' });
    }
});

// AI: Analyze workbook numeric data
app.post('/api/ai/analyze-data', aiLimiter, requireRequester, loadWorkbookAccess, requireWorkbookRead, async (req, res) => {
    const { workbook_id } = req.body;
    if (!workbook_id) {
        return res.status(400).json({ error: 'workbook_id is required', code: 'WORKBOOK_ID_REQUIRED' });
    }

    try {
        const cellsResult = await pool.query(
            `SELECT c.address, c.value, c.formula, c.row_idx, c.col_idx, ws.name as worksheet_name
             FROM cells c
             JOIN worksheets ws ON ws.id = c.worksheet_id
             WHERE ws.workbook_id = $1`,
            [workbook_id]
        );

        const analysis = aiService.analyzeData(cellsResult.rows);

        await logAiUsage({
            userId: req.requesterId,
            workbookId: workbook_id,
            endpoint: '/api/ai/analyze-data',
            provider: 'heuristic',
            model: 'local-rule-engine',
            metadata: {
                numericCount: analysis?.stats?.count || 0,
                outlierCount: analysis?.outliers?.length || 0,
            },
            status: 'success',
        });

        res.json({
            workbook_id: Number(workbook_id),
            ...analysis,
        });
    } catch (error) {
        await logAiUsage({
            userId: req.requesterId,
            workbookId: workbook_id,
            endpoint: '/api/ai/analyze-data',
            status: 'failed',
            metadata: { error: error.message },
        });

        logger.error('AI data analysis failed', { error: error.message, workbookId: workbook_id });
        res.status(500).json({ error: 'Failed to analyze workbook data' });
    }
});

// AI: Prompt with optional selected-range context
app.post('/api/ai/prompt', aiLimiter, requireRequester, loadWorkbookAccess, requireWorkbookRead, async (req, res) => {
    const { workbook_id, prompt, worksheet_id, selection } = req.body;

    if (!workbook_id) {
        return res.status(400).json({ error: 'workbook_id is required', code: 'WORKBOOK_ID_REQUIRED' });
    }
    if (!prompt || String(prompt).trim().length === 0) {
        return res.status(400).json({ error: 'prompt is required', code: 'PROMPT_REQUIRED' });
    }
    if (String(prompt).length > 1500) {
        return res.status(400).json({ error: 'prompt is too long (max 1500 chars)', code: 'PROMPT_TOO_LONG' });
    }

    try {
        let selectedCells = [];
        let normalizedSelection = null;

        const wsId = Number(worksheet_id);
        const row = Number(selection?.row);
        const col = Number(selection?.col);
        const rowCount = Number(selection?.rowCount || 1);
        const colCount = Number(selection?.colCount || 1);

        if (
            Number.isFinite(wsId) &&
            Number.isFinite(row) &&
            Number.isFinite(col) &&
            Number.isFinite(rowCount) &&
            Number.isFinite(colCount)
        ) {
            const endRow = Math.min(row + rowCount - 1, row + 199);
            const endCol = Math.min(col + colCount - 1, col + 49);

            const selectedResult = await pool.query(
                `SELECT address, value, formula, row_idx, col_idx
                 FROM cells
                 WHERE worksheet_id = $1
                   AND row_idx BETWEEN $2 AND $3
                   AND col_idx BETWEEN $4 AND $5
                 ORDER BY row_idx, col_idx
                 LIMIT 200`,
                [wsId, row, endRow, col, endCol]
            );

            selectedCells = selectedResult.rows;
            normalizedSelection = {
                worksheet_id: wsId,
                row,
                col,
                rowCount,
                colCount,
            };
        }

        const aiResponse = await aiService.respondToPrompt({
            prompt,
            context: {
                workbook_id,
                worksheet_id: Number.isFinite(wsId) ? wsId : null,
                selection: normalizedSelection,
                selectedCells,
            },
        });

        await logAiUsage({
            userId: req.requesterId,
            workbookId: workbook_id,
            endpoint: '/api/ai/prompt',
            provider: aiResponse.provider,
            model: aiResponse.model,
            usage: aiResponse.usage,
            metadata: {
                fallback: aiResponse.fallback === true,
                selection: normalizedSelection,
                selectedCellsCount: selectedCells.length,
            },
            status: 'success',
        });

        res.json({
            prompt,
            answer: aiResponse.answer,
            provider: aiResponse.provider,
            model: aiResponse.model,
            fallback: aiResponse.fallback,
            selection: normalizedSelection,
            selectedCellsCount: selectedCells.length,
        });
    } catch (error) {
        await logAiUsage({
            userId: req.requesterId,
            workbookId: workbook_id || null,
            endpoint: '/api/ai/prompt',
            status: 'failed',
            metadata: { error: error.message },
        });

        logger.error('AI prompt request failed', {
            error: error.message,
            requesterId: req.requesterId,
            workbook_id,
        });
        res.status(500).json({ error: 'Failed to process AI prompt' });
    }
});

// Sync Endpoint
app.post('/api/sync-user', authLimiter, async (req, res) => {
    const { uid, email, name } = req.body;

    if (!uid || !email || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Check cache first
        const cacheKey = cache.userKey(uid);
        const cachedUser = await cache.get(cacheKey);

        if (cachedUser) {
            logger.info('User data retrieved from cache', { uid, email });
            return res.status(200).json({ message: 'User already synced', user: cachedUser });
        }

        // Check if user exists
        const checkRes = await pool.query('SELECT * FROM users WHERE firebase_uid = $1', [uid]);

        if (checkRes.rows.length > 0) {
            // Cache the user data
            await cache.set(cacheKey, checkRes.rows[0], 300); // 5 minutes TTL
            logger.info('User already synced', { uid, email });
            return res.status(200).json({ message: 'User already synced', user: checkRes.rows[0] });
        }

        // Insert new user with default 'user' role
        const insertQuery = `
      INSERT INTO users (firebase_uid, email, name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
        const values = [uid, email, name, 'user'];
        const result = await pool.query(insertQuery, values);

        // Cache the new user
        await cache.set(cacheKey, result.rows[0], 300);

        logger.info('User synced successfully', { uid, email, role: result.rows[0].role });
        res.status(201).json({ user: result.rows[0] });

    } catch (error) {
        logger.error('Error syncing user', { error: error.message, uid, email });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get User Role Endpoint
app.get('/api/user-role/:uid', async (req, res) => {
    const { uid } = req.params;

    try {
        // Check cache first
        const cacheKey = cache.userKey(uid);
        const cachedUser = await cache.get(cacheKey);

        if (cachedUser && cachedUser.role) {
            logger.info('User role retrieved from cache', { uid });
            return res.json({ role: cachedUser.role });
        }

        const result = await pool.query('SELECT role FROM users WHERE firebase_uid = $1', [uid]);

        if (result.rows.length === 0) {
            logger.warn('User not found', { uid });
            return res.status(404).json({ error: 'User not found' });
        }

        // Cache the user data
        await cache.set(cacheKey, result.rows[0], 300);

        res.json({ role: result.rows[0].role });
    } catch (error) {
        logger.error('Error fetching user role', { error: error.message, uid });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get profile summary for requester (or admin)
app.get('/api/profile/summary', requireRequester, async (req, res) => {
    const targetUserId = req.query.user_id || req.requesterId;

    if (req.requesterRole !== 'admin' && targetUserId !== req.requesterId) {
        return res.status(403).json({ error: 'Access denied for requested profile', code: 'PROFILE_FORBIDDEN' });
    }

    try {
        const [userResult, workbookStatsResult, commitStatsResult, recentActivityResult] = await Promise.all([
            pool.query(
                `SELECT firebase_uid, email, name, role, created_at
                 FROM users
                 WHERE firebase_uid = $1`,
                [targetUserId]
            ),
            pool.query(
                `SELECT
                    COUNT(*) FILTER (WHERE w.owner_id = $1)::int AS excel_files,
                    COUNT(*) FILTER (WHERE w.owner_id = $1 AND COALESCE(cstats.collaborator_count, 0) > 0)::int AS collaborations
                 FROM workbooks w
                 LEFT JOIN (
                    SELECT workbook_id, COUNT(*)::int AS collaborator_count
                    FROM workbook_collaborators
                    GROUP BY workbook_id
                 ) cstats ON cstats.workbook_id = w.id
                 WHERE w.owner_id = $1
                    OR w.id IN (
                        SELECT workbook_id
                        FROM workbook_collaborators
                        WHERE user_id = $1
                    )`,
                [targetUserId]
            ),
            pool.query(
                `SELECT COUNT(*)::int AS revisions
                 FROM commits
                 WHERE user_id = $1`,
                [targetUserId]
            ),
            pool.query(
                `SELECT
                    c.id,
                    c.message,
                    c.timestamp,
                    c.hash,
                    c.workbook_id,
                    w.name AS workbook_name,
                    COUNT(cv.id)::int AS changes_count
                 FROM commits c
                 JOIN workbooks w ON c.workbook_id = w.id
                 LEFT JOIN cell_versions cv ON cv.commit_id = c.id
                 WHERE c.user_id = $1
                 GROUP BY c.id, w.name
                 ORDER BY c.timestamp DESC
                 LIMIT 10`,
                [targetUserId]
            ),
        ]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
        }

        const userRow = userResult.rows[0];
        const workbookStats = workbookStatsResult.rows[0] || { excel_files: 0, collaborations: 0 };
        const commitStats = commitStatsResult.rows[0] || { revisions: 0 };
        const storageUsedBytes = await getUserStorageUsedBytes(pool, targetUserId);
        const storageRemainingBytes = Math.max(0, STORAGE_LIMIT_BYTES - storageUsedBytes);
        const rawUsagePercent = (storageUsedBytes / STORAGE_LIMIT_BYTES) * 100;
        const storageUsagePercent = storageUsedBytes > 0
            ? Math.min(100, Math.max(0.1, Number(rawUsagePercent.toFixed(2))))
            : 0;

        const recentActivity = recentActivityResult.rows.map((item) => {
            const msg = String(item.message || '').toLowerCase();
            let action = 'Updated';
            if (msg.includes('rolled back') || msg.includes('rollback') || msg.includes('revert')) action = 'Reverted';
            else if (msg.includes('create')) action = 'Created';

            return {
                id: item.id,
                action,
                file: item.workbook_name,
                message: item.message,
                timestamp: item.timestamp,
                workbook_id: item.workbook_id,
                changes_count: item.changes_count,
                hash: item.hash,
            };
        });

        return res.json({
            user: {
                uid: userRow.firebase_uid,
                email: userRow.email,
                name: userRow.name,
                role: userRow.role,
                created_at: userRow.created_at,
            },
            stats: {
                excelFiles: Number(workbookStats.excel_files || 0),
                collaborations: Number(workbookStats.collaborations || 0),
                revisions: Number(commitStats.revisions || 0),
                storageUsedBytes,
                storageLimitBytes: STORAGE_LIMIT_BYTES,
                storageRemainingBytes,
                storageUsagePercent,
            },
            recentActivity,
        });
    } catch (error) {
        logger.error('Error fetching profile summary', {
            error: error.message,
            requesterId: req.requesterId,
            targetUserId,
        });
        return res.status(500).json({ error: 'Failed to fetch profile summary' });
    }
});

// Update profile (currently supports display name)
app.put('/api/profile', requireRequester, async (req, res) => {
    const targetUserId = req.body.user_id || req.requesterId;
    const name = String(req.body.name || '').trim();

    if (!name) {
        return res.status(400).json({ error: 'name is required', code: 'NAME_REQUIRED' });
    }

    if (req.requesterRole !== 'admin' && targetUserId !== req.requesterId) {
        return res.status(403).json({ error: 'Access denied for profile update', code: 'PROFILE_UPDATE_FORBIDDEN' });
    }

    try {
        const updateResult = await pool.query(
            `UPDATE users
             SET name = $1
             WHERE firebase_uid = $2
             RETURNING firebase_uid, email, name, role, created_at`,
            [name, targetUserId]
        );

        if (updateResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
        }

        await cache.del(cache.userKey(targetUserId));

        return res.json({ user: updateResult.rows[0] });
    } catch (error) {
        logger.error('Error updating profile', {
            error: error.message,
            requesterId: req.requesterId,
            targetUserId,
        });
        return res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get persisted user settings
app.get('/api/settings', requireRequester, async (req, res) => {
    const targetUserId = req.query.user_id || req.requesterId;

    if (req.requesterRole !== 'admin' && targetUserId !== req.requesterId) {
        return res.status(403).json({ error: 'Access denied for requested settings', code: 'SETTINGS_FORBIDDEN' });
    }

    try {
        const settingsResult = await pool.query(
            `SELECT
                user_id,
                auto_save_interval,
                version_history_limit,
                email_alerts,
                collaboration_invites,
                public_profile,
                updated_at
             FROM user_settings
             WHERE user_id = $1`,
            [targetUserId]
        );

        if (settingsResult.rows.length === 0) {
            const insertResult = await pool.query(
                `INSERT INTO user_settings (user_id)
                 VALUES ($1)
                 RETURNING user_id, auto_save_interval, version_history_limit, email_alerts, collaboration_invites, public_profile, updated_at`,
                [targetUserId]
            );

            return res.json({ settings: insertResult.rows[0] });
        }

        return res.json({ settings: settingsResult.rows[0] });
    } catch (error) {
        logger.error('Error fetching user settings', {
            error: error.message,
            requesterId: req.requesterId,
            targetUserId,
        });
        return res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update persisted user settings
app.put('/api/settings', requireRequester, async (req, res) => {
    const targetUserId = req.body.user_id || req.requesterId;
    const {
        auto_save_interval,
        version_history_limit,
        email_alerts,
        collaboration_invites,
        public_profile,
    } = req.body;

    if (req.requesterRole !== 'admin' && targetUserId !== req.requesterId) {
        return res.status(403).json({ error: 'Access denied for requested settings update', code: 'SETTINGS_UPDATE_FORBIDDEN' });
    }

    const autoSaveIntervalNum = Number(auto_save_interval);
    const versionHistoryLimitNum = Number(version_history_limit);

    if (!Number.isFinite(autoSaveIntervalNum) || autoSaveIntervalNum < 1 || autoSaveIntervalNum > 120) {
        return res.status(400).json({ error: 'auto_save_interval must be between 1 and 120', code: 'INVALID_AUTO_SAVE_INTERVAL' });
    }

    if (!Number.isFinite(versionHistoryLimitNum) || versionHistoryLimitNum < 1 || versionHistoryLimitNum > 500) {
        return res.status(400).json({ error: 'version_history_limit must be between 1 and 500', code: 'INVALID_VERSION_HISTORY_LIMIT' });
    }

    try {
        const updateResult = await pool.query(
            `INSERT INTO user_settings (
                user_id,
                auto_save_interval,
                version_history_limit,
                email_alerts,
                collaboration_invites,
                public_profile,
                updated_at
             )
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             ON CONFLICT (user_id)
             DO UPDATE SET
                auto_save_interval = EXCLUDED.auto_save_interval,
                version_history_limit = EXCLUDED.version_history_limit,
                email_alerts = EXCLUDED.email_alerts,
                collaboration_invites = EXCLUDED.collaboration_invites,
                public_profile = EXCLUDED.public_profile,
                updated_at = NOW()
             RETURNING user_id, auto_save_interval, version_history_limit, email_alerts, collaboration_invites, public_profile, updated_at`,
            [
                targetUserId,
                autoSaveIntervalNum,
                versionHistoryLimitNum,
                Boolean(email_alerts),
                Boolean(collaboration_invites),
                Boolean(public_profile),
            ]
        );

        return res.json({ settings: updateResult.rows[0] });
    } catch (error) {
        logger.error('Error updating user settings', {
            error: error.message,
            requesterId: req.requesterId,
            targetUserId,
        });
        return res.status(500).json({ error: 'Failed to update settings' });
    }
});

// Configure Multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// --- Workbook & Excel Processing Endpoints ---

// Create Empty Workbook
app.post('/api/workbooks/create', requireRequester, requireNonViewer, async (req, res) => {
    const { owner_id, name } = req.body;

    if (!owner_id) {
        return res.status(400).json({ error: 'owner_id is required' });
    }

    if (req.requesterRole !== 'admin' && owner_id !== req.requesterId) {
        return res.status(403).json({ error: 'Requester must match owner_id', code: 'OWNER_MISMATCH' });
    }

    const trimmedName = String(name || '').trim();
    const workbookName = trimmedName.length > 0
        ? trimmedName
        : `Untitled-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const wbResult = await client.query(
            'INSERT INTO workbooks (name, owner_id, storage_bytes) VALUES ($1, $2, $3) RETURNING *',
            [workbookName, owner_id, 0]
        );
        const newWorkbook = wbResult.rows[0];

        const hash = crypto.createHash('sha256')
            .update(`${newWorkbook.id}-${owner_id}-${Date.now()}-initial-empty`)
            .digest('hex');

        await client.query(
            'INSERT INTO commits (workbook_id, user_id, message, hash) VALUES ($1, $2, $3, $4)',
            [newWorkbook.id, owner_id, 'Initial Workbook Created', hash]
        );

        await client.query(
            'INSERT INTO worksheets (workbook_id, name, sheet_order) VALUES ($1, $2, $3)',
            [newWorkbook.id, 'Sheet1', 0]
        );

        await client.query('COMMIT');

        await cache.del(cache.userWorkbooksKey(owner_id));

        await createNotifications({
            userIds: [owner_id],
            type: 'success',
            title: 'Workbook created',
            message: `${workbookName} was created successfully.`,
            metadata: { workbookId: newWorkbook.id },
        });

        return res.status(201).json({
            message: 'Workbook created successfully',
            workbook: newWorkbook,
        });
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error creating empty workbook', {
            error: error.message,
            owner_id,
            workbookName,
        });
        return res.status(500).json({ error: 'Failed to create workbook' });
    } finally {
        client.release();
    }
});

// Upload Workbook
app.post('/api/workbooks/upload', uploadLimiter, upload.single('file'), requireRequester, requireNonViewer, async (req, res) => {
    const { owner_id, owner_name } = req.body;
    const file = req.file;

    if (!file || !owner_id) {
        return res.status(400).json({ error: 'File and owner_id are required' });
    }

    if (req.requesterRole !== 'admin' && owner_id !== req.requesterId) {
        return res.status(403).json({ error: 'Requester must match owner_id', code: 'OWNER_MISMATCH' });
    }

    // Validate file
    const fileProcessor = new FileProcessor();
    const validation = fileProcessor.validateFile(file);

    if (!validation.valid) {
        logger.warn('File validation failed', { errors: validation.errors, owner_id });
        return res.status(400).json({ error: validation.errors.join(', ') });
    }

    let parsedData;
    try {
        parsedData = await fileProcessor.processExcelFile(file.buffer, file.originalname);
    } catch (parseError) {
        logger.error('Failed to parse workbook for upload', {
            error: parseError.message,
            owner_id,
            fileName: file.originalname,
        });
        return res.status(400).json({ error: 'Failed to parse workbook file' });
    }

    try {
        const currentStorageBytes = await getUserStorageUsedBytes(pool, owner_id);
        const incomingStorageBytes = Number(file.size || 0);
        const projectedStorageBytes = currentStorageBytes + incomingStorageBytes;

        if (projectedStorageBytes > STORAGE_LIMIT_BYTES) {
            const remainingBytes = Math.max(0, STORAGE_LIMIT_BYTES - currentStorageBytes);
            return res.status(409).json({
                error: 'Storage limit exceeded. Delete previous files to proceed.',
                code: 'STORAGE_LIMIT_EXCEEDED',
                storage: {
                    usedBytes: currentStorageBytes,
                    incomingBytes: incomingStorageBytes,
                    limitBytes: STORAGE_LIMIT_BYTES,
                    remainingBytes,
                    projectedBytes: projectedStorageBytes,
                },
            });
        }
    } catch (quotaError) {
        logger.error('Failed to validate storage quota', {
            error: quotaError.message,
            owner_id,
            fileName: file.originalname,
        });
        return res.status(500).json({ error: 'Failed to validate storage quota' });
    }

    let storageInfo = { mode: (process.env.UPLOAD_STORAGE_MODE || 'db').toLowerCase(), localPath: null };
    try {
        storageInfo = await persistUploadedFile(file);
    } catch (storageError) {
        logger.error('Failed to persist uploaded file', { error: storageError.message, owner_id, fileName: file.originalname });
        return res.status(500).json({ error: 'Failed to store uploaded file' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Create Workbook in DB
        const wbResult = await client.query(
            'INSERT INTO workbooks (name, owner_id, storage_bytes) VALUES ($1, $2, $3) RETURNING *',
            [file.originalname, owner_id, Number(file.size || 0)]
        );
        const newWorkbook = wbResult.rows[0];

        // 2. Process Excel file
        logger.info('Processing Excel file', { workbookId: newWorkbook.id, fileName: file.originalname });

        // 3. Create Initial Commit
        const hash = crypto.createHash('sha256')
            .update(`${newWorkbook.id}-${owner_id}-${Date.now()}-initial`)
            .digest('hex');

        const commitResult = await client.query(
            'INSERT INTO commits (workbook_id, user_id, message, hash) VALUES ($1, $2, $3, $4) RETURNING *',
            [newWorkbook.id, owner_id, 'Initial Import', hash]
        );
        const initialCommit = commitResult.rows[0];

        // 4. Process Worksheets & Cells
        for (const sheet of parsedData.sheets) {
            // Insert Worksheet
            const wsResult = await client.query(
                'INSERT INTO worksheets (workbook_id, name, sheet_order) VALUES ($1, $2, $3) RETURNING *',
                [newWorkbook.id, sheet.name, sheet.order]
            );
            const newWorksheet = wsResult.rows[0];

            // Insert cells in batches
            if (sheet.cells && sheet.cells.length > 0) {
                await fileProcessor.insertCellsBatch(client, sheet.cells, newWorksheet.id, initialCommit.id);
            }
        }

        await client.query('COMMIT');

        // Invalidate user's workbooks cache
        await cache.del(cache.userWorkbooksKey(owner_id));

        logger.info('Workbook uploaded successfully', {
            workbookId: newWorkbook.id,
            fileName: file.originalname,
            totalCells: parsedData.totalCells,
            owner_id
        });

        await createNotifications({
            userIds: [owner_id],
            type: 'success',
            title: 'Workbook uploaded',
            message: `${file.originalname} was uploaded successfully.`,
            metadata: { workbookId: newWorkbook.id },
        });

        res.status(201).json({
            message: 'Workbook uploaded and initialized successfully',
            workbook: newWorkbook,
            stats: {
                totalSheets: parsedData.totalSheets,
                totalCells: parsedData.totalCells,
            },
            storage: {
                mode: storageInfo.mode,
                localPath: storageInfo.localPath,
            },
        });

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        logger.error('Error processing upload', {
            error: error.message,
            stack: error.stack,
            owner_id,
            fileName: file ? file.originalname : 'unknown'
        });
        res.status(500).json({ error: error.message || 'Internal server error during upload' });
    } finally {
        if (client) client.release();
    }
});

// Get User's Workbooks
app.get('/api/workbooks', generalLimiter, requireRequester, async (req, res) => {
    const { owner_id, limit, offset } = req.query;
    if (!owner_id) {
        return res.status(400).json({ error: 'owner_id is required' });
    }

    if (req.requesterRole !== 'admin' && owner_id !== req.requesterId) {
        return res.status(403).json({ error: 'You can only fetch your own workbooks', code: 'OWNER_QUERY_FORBIDDEN' });
    }

    const pagination = parsePagination(limit, offset, null, 200);
    if (pagination.error) {
        return res.status(400).json({ error: pagination.error, code: 'INVALID_PAGINATION' });
    }

    try {
        // Check cache first (only when no pagination params are provided)
        const cacheKey = cache.userWorkbooksKey(owner_id);
        const cachedWorkbooks = pagination.hasPagination ? null : await cache.get(cacheKey);

        if (cachedWorkbooks) {
            logger.info('Workbooks retrieved from cache', { owner_id });
            return res.json(cachedWorkbooks);
        }

        const baseQuery = `SELECT
                w.*,
                CASE WHEN w.owner_id = $1 THEN true ELSE false END as is_owner,
                COALESCE(cstats.collaborator_count, 0) as collaborator_count,
                owner_user.name as owner_name,
                owner_user.email as owner_email
             FROM workbooks w
             LEFT JOIN users owner_user ON owner_user.firebase_uid = w.owner_id
             LEFT JOIN (
                SELECT workbook_id, COUNT(*)::int as collaborator_count
                FROM workbook_collaborators
                GROUP BY workbook_id
             ) cstats ON cstats.workbook_id = w.id
             WHERE w.owner_id = $1
                OR w.id IN (
                    SELECT workbook_id
                    FROM workbook_collaborators
                    WHERE user_id = $1
                )
             ORDER BY w.updated_at DESC`;

        const queryText = pagination.limit === null
            ? baseQuery
            : `${baseQuery} LIMIT $2 OFFSET $3`;
        const queryParams = pagination.limit === null
            ? [owner_id]
            : [owner_id, pagination.limit, pagination.offset];

        const result = await pool.query(queryText, queryParams);

        // Cache only unpaginated result
        if (!pagination.hasPagination) {
            await cache.set(cacheKey, result.rows, 120); // 2 minutes TTL
        }

        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching workbooks', { error: error.message, owner_id });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Workbook Data (Full Load for Editor)
app.get('/api/workbooks/:id', requireRequester, loadWorkbookAccess, requireWorkbookRead, async (req, res) => {
    const { id } = req.params;

    try {
        // Fetch Workbook
        const wbResult = await pool.query('SELECT * FROM workbooks WHERE id = $1', [id]);
        if (wbResult.rows.length === 0) return res.status(404).json({ error: 'Workbook not found' });
        const workbook = wbResult.rows[0];

        // Fetch Worksheets
        const wsResult = await pool.query('SELECT * FROM worksheets WHERE workbook_id = $1 ORDER BY sheet_order', [id]);
        const worksheets = wsResult.rows;

        const sheetsData = {};
        const sheetOrder = [];

        for (const ws of worksheets) {
            sheetOrder.push(ws.id.toString());

            // Fetch Cells
            const cellsResult = await pool.query('SELECT * FROM cells WHERE worksheet_id = $1', [ws.id]);
            const cells = cellsResult.rows;

            const cellData = {};
            cells.forEach(cell => {
                if (!cellData[cell.row_idx]) cellData[cell.row_idx] = {};

                cellData[cell.row_idx][cell.col_idx] = {
                    v: cell.value,
                    f: cell.formula,
                    cellVersion: cell.cell_version || 1,
                    // Map styles back to Univer format if needed (simplified for now)
                };
            });

            sheetsData[ws.id] = {
                id: ws.id.toString(),
                name: ws.name,
                cellData: cellData,
                rowCount: 1000,
                columnCount: 26
            };
        }

        // Construct Univer Data Structure
        const univerData = {
            id: workbook.id.toString(),
            name: workbook.name,
            owner_id: workbook.owner_id,
            appVersion: '3.0.0',
            sheets: sheetsData,
            sheetOrder: sheetOrder,
            styles: {} // Styles would need mapping
        };

        res.json(univerData);

    } catch (error) {
        console.error('Error fetching workbook details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add Workbook Collaborator
app.post('/api/workbooks/:id/collaborators', requireRequester, loadWorkbookAccess, requireWorkbookOwnerOrAdmin, async (req, res) => {
    const { id } = req.params;
    const { owner_id, collaborator_id } = req.body;

    if (!collaborator_id) {
        return res.status(400).json({ error: 'collaborator_id is required', code: 'COLLABORATOR_REQUIRED' });
    }

    try {
        const workbookResult = await pool.query(
            'SELECT id, owner_id FROM workbooks WHERE id = $1',
            [id]
        );

        if (workbookResult.rows.length === 0) {
            return res.status(404).json({ error: 'Workbook not found' });
        }

        if (!req.workbookAccess.isOwner && !req.workbookAccess.isAdmin) {
            return res.status(403).json({ error: 'Only the workbook owner can add collaborators' });
        }

        if (req.workbookAccess.workbook.owner_id === collaborator_id) {
            return res.status(400).json({ error: 'Owner is already a collaborator by default' });
        }

        const userResult = await pool.query(
            'SELECT firebase_uid, name, email FROM users WHERE firebase_uid = $1',
            [collaborator_id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Collaborator user not found' });
        }

        const visibilityResult = await pool.query(
            `SELECT COALESCE(public_profile, TRUE) AS public_profile
             FROM user_settings
             WHERE user_id = $1`,
            [collaborator_id]
        );

        const isPublicProfile = visibilityResult.rows.length === 0
            ? true
            : visibilityResult.rows[0].public_profile === true;

        if (!isPublicProfile) {
            return res.status(403).json({ error: 'User has a private profile and cannot be added via search', code: 'COLLABORATOR_PROFILE_PRIVATE' });
        }

        const insertResult = await pool.query(
            `INSERT INTO workbook_collaborators (workbook_id, user_id, added_by)
             VALUES ($1, $2, $3)
             ON CONFLICT (workbook_id, user_id) DO NOTHING
             RETURNING *`,
            [id, collaborator_id, req.requesterId]
        );

        await cache.del(cache.userWorkbooksKey(req.workbookAccess.workbook.owner_id));
        await cache.del(cache.userWorkbooksKey(collaborator_id));

        if (insertResult.rows.length === 0) {
            return res.json({ message: 'User is already a collaborator', collaborator: userResult.rows[0] });
        }

        await createNotifications({
            userIds: [collaborator_id],
            type: 'info',
            title: 'Workbook shared with you',
            message: `${req.workbookAccess.workbook.name} has been shared with you.`,
            metadata: { workbookId: Number(id), sharedBy: req.requesterId },
        });

        res.status(201).json({
            message: 'Collaborator added successfully',
            collaborator: userResult.rows[0],
        });
    } catch (error) {
        logger.error('Error adding workbook collaborator', {
            error: error.message,
            workbookId: id,
            owner_id: req.workbookAccess?.workbook?.owner_id,
            collaborator_id,
        });
        res.status(500).json({ error: 'Failed to add collaborator' });
    }
});

// List Workbook Collaborators
app.get('/api/workbooks/:id/collaborators', requireRequester, loadWorkbookAccess, requireWorkbookRead, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT
                wc.id,
                wc.user_id,
                wc.added_by,
                wc.added_at,
                u.name,
                u.email,
                u.role
             FROM workbook_collaborators wc
             JOIN users u ON u.firebase_uid = wc.user_id
             WHERE wc.workbook_id = $1
             ORDER BY wc.added_at DESC`,
            [id]
        );

        res.json({ collaborators: result.rows });
    } catch (error) {
        logger.error('Error listing collaborators', { error: error.message, workbookId: id });
        res.status(500).json({ error: 'Failed to fetch collaborators' });
    }
});

// Remove Workbook Collaborator
app.delete('/api/workbooks/:id/collaborators/:collaboratorId', requireRequester, loadWorkbookAccess, requireWorkbookOwnerOrAdmin, async (req, res) => {
    const { id, collaboratorId } = req.params;

    try {
        if (collaboratorId === req.workbookAccess.workbook.owner_id) {
            return res.status(400).json({ error: 'Owner cannot be removed as collaborator', code: 'OWNER_NOT_REMOVABLE' });
        }

        const result = await pool.query(
            `DELETE FROM workbook_collaborators
             WHERE workbook_id = $1 AND user_id = $2
             RETURNING user_id`,
            [id, collaboratorId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Collaborator not found', code: 'COLLABORATOR_NOT_FOUND' });
        }

        await cache.del(cache.userWorkbooksKey(collaboratorId));
        await cache.del(cache.userWorkbooksKey(req.workbookAccess.workbook.owner_id));

        await createNotifications({
            userIds: [collaboratorId],
            type: 'warning',
            title: 'Access removed',
            message: `Your access to ${req.workbookAccess.workbook.name} has been removed.`,
            metadata: { workbookId: Number(id), removedBy: req.requesterId },
        });

        res.json({ message: 'Collaborator removed successfully', collaborator_id: collaboratorId });
    } catch (error) {
        logger.error('Error removing collaborator', {
            error: error.message,
            workbookId: id,
            collaboratorId,
            requesterId: req.requesterId,
        });
        res.status(500).json({ error: 'Failed to remove collaborator' });
    }
});

// Delete Workbook (Owner only)
app.put('/api/workbooks/:id', requireRequester, loadWorkbookAccess, requireWorkbookOwner, async (req, res) => {
    const { id } = req.params;
    const { requester_id, name } = req.body;

    if (!requester_id) {
        return res.status(400).json({ error: 'requester_id is required' });
    }

    const trimmedName = String(name || '').trim();
    if (!trimmedName) {
        return res.status(400).json({ error: 'name is required' });
    }

    if (trimmedName.length > 255) {
        return res.status(400).json({ error: 'name must be 255 characters or fewer' });
    }

    try {
        const updateResult = await pool.query(
            `UPDATE workbooks
             SET name = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING id, name, owner_id, updated_at`,
            [trimmedName, id]
        );

        if (updateResult.rows.length === 0) {
            return res.status(404).json({ error: 'Workbook not found' });
        }

        const workbook = updateResult.rows[0];
        const collaboratorRows = await pool.query(
            'SELECT user_id FROM workbook_collaborators WHERE workbook_id = $1',
            [id]
        );

        await cache.del(cache.userWorkbooksKey(workbook.owner_id));
        for (const row of collaboratorRows.rows) {
            await cache.del(cache.userWorkbooksKey(row.user_id));
        }

        io.to(`workbook-${id}`).emit('workbook-renamed', {
            workbookId: Number(id),
            name: workbook.name,
            renamedBy: requester_id,
            timestamp: new Date().toISOString(),
        });

        return res.json({
            message: 'Workbook renamed successfully',
            workbook,
        });
    } catch (error) {
        logger.error('Error renaming workbook', {
            error: error.message,
            workbookId: id,
            requesterId: requester_id,
        });
        return res.status(500).json({ error: 'Failed to rename workbook' });
    }
});

app.delete('/api/workbooks/:id', requireRequester, loadWorkbookAccess, requireWorkbookOwnerOrAdmin, async (req, res) => {
    const { id } = req.params;
    const requesterId = req.query.requester_id || req.body?.requester_id;

    if (!requesterId) {
        return res.status(400).json({ error: 'requester_id is required' });
    }

    try {
        const workbookResult = await pool.query(
            'SELECT id, owner_id, name FROM workbooks WHERE id = $1',
            [id]
        );

        if (workbookResult.rows.length === 0) {
            return res.status(404).json({ error: 'Workbook not found' });
        }

        const workbook = workbookResult.rows[0];
        const collaboratorRows = await pool.query(
            'SELECT user_id FROM workbook_collaborators WHERE workbook_id = $1',
            [id]
        );

        await pool.query('DELETE FROM workbooks WHERE id = $1', [id]);

        await cache.del(cache.userWorkbooksKey(requesterId));
        for (const row of collaboratorRows.rows) {
            await cache.del(cache.userWorkbooksKey(row.user_id));
        }

        await createNotifications({
            userIds: [requesterId, ...collaboratorRows.rows.map((row) => row.user_id)],
            type: 'warning',
            title: 'Workbook deleted',
            message: `${workbook.name} has been deleted.`,
            metadata: { workbookId: Number(id), deletedBy: requesterId },
        });

        res.json({ message: 'Workbook deleted successfully', workbook_id: id, name: workbook.name });
    } catch (error) {
        logger.error('Error deleting workbook', { error: error.message, workbookId: id, requesterId });
        res.status(500).json({ error: 'Failed to delete workbook' });
    }
});

// Create Worksheet
app.post('/api/workbooks/:id/sheets', requireRequester, loadWorkbookAccess, requireWorkbookWrite, async (req, res) => {
    const { id } = req.params;
    const { name, order } = req.body;

    try {
        const cleanedName = (name || '').trim();
        if (!cleanedName) {
            return res.status(400).json({ error: 'Worksheet name is required', code: 'SHEET_NAME_REQUIRED' });
        }

        const duplicateResult = await pool.query(
            'SELECT id FROM worksheets WHERE workbook_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1',
            [id, cleanedName]
        );

        if (duplicateResult.rows.length > 0) {
            return res.status(409).json({ error: 'Worksheet name already exists', code: 'DUPLICATE_SHEET_NAME' });
        }

        const maxOrderResult = await pool.query(
            'SELECT COALESCE(MAX(sheet_order), -1) as max_order FROM worksheets WHERE workbook_id = $1',
            [id]
        );
        const maxOrder = parseInt(maxOrderResult.rows[0].max_order, 10);
        const targetOrder = Number.isInteger(order) ? Math.min(Math.max(order, 0), maxOrder + 1) : maxOrder + 1;

        await pool.query(
            'UPDATE worksheets SET sheet_order = sheet_order + 1 WHERE workbook_id = $1 AND sheet_order >= $2',
            [id, targetOrder]
        );

        const result = await pool.query(
            'INSERT INTO worksheets (workbook_id, name, sheet_order) VALUES ($1, $2, $3) RETURNING *',
            [id, cleanedName, targetOrder]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating worksheet', { error: error.message, workbookId: id });
        res.status(500).json({ error: 'Failed to create worksheet' });
    }
});

// Rename Worksheet
app.put('/api/workbooks/:id/sheets/:sheetId', requireRequester, loadWorkbookAccess, requireWorkbookWrite, async (req, res) => {
    const { id, sheetId } = req.params;
    const { name } = req.body;

    try {
        const cleanedName = (name || '').trim();
        if (!cleanedName) {
            return res.status(400).json({ error: 'Worksheet name is required', code: 'SHEET_NAME_REQUIRED' });
        }

        const duplicateResult = await pool.query(
            'SELECT id FROM worksheets WHERE workbook_id = $1 AND LOWER(name) = LOWER($2) AND id <> $3 LIMIT 1',
            [id, cleanedName, sheetId]
        );

        if (duplicateResult.rows.length > 0) {
            return res.status(409).json({ error: 'Worksheet name already exists', code: 'DUPLICATE_SHEET_NAME' });
        }

        const result = await pool.query(
            'UPDATE worksheets SET name = $1 WHERE id = $2 AND workbook_id = $3 RETURNING *',
            [cleanedName, sheetId, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Worksheet not found' });
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error renaming worksheet', { error: error.message, sheetId });
        res.status(500).json({ error: 'Failed to rename worksheet' });
    }
});

// Delete Worksheet
app.delete('/api/workbooks/:id/sheets/:sheetId', requireRequester, loadWorkbookAccess, requireWorkbookWrite, async (req, res) => {
    const { id, sheetId } = req.params;

    try {
        const countResult = await pool.query(
            'SELECT COUNT(*)::int as count FROM worksheets WHERE workbook_id = $1',
            [id]
        );

        if (countResult.rows[0].count <= 1) {
            return res.status(409).json({ error: 'Cannot delete the last worksheet', code: 'LAST_WORKSHEET_PROTECTED' });
        }

        const deletedResult = await pool.query(
            'DELETE FROM worksheets WHERE id = $1 AND workbook_id = $2 RETURNING id',
            [sheetId, id]
        );

        if (deletedResult.rows.length === 0) {
            return res.status(404).json({ error: 'Worksheet not found', code: 'SHEET_NOT_FOUND' });
        }

        res.json({ message: 'Worksheet deleted successfully' });
    } catch (error) {
        logger.error('Error deleting worksheet', { error: error.message, sheetId });
        res.status(500).json({ error: 'Failed to delete worksheet' });
    }
});

// Reorder Worksheets
app.put('/api/workbooks/:id/sheets/reorder', requireRequester, loadWorkbookAccess, requireWorkbookWrite, async (req, res) => {
    const { id } = req.params;
    const { orders } = req.body; // Array of { id: number, order: number }

    if (!Array.isArray(orders) || orders.length === 0) {
        return res.status(400).json({ error: 'orders array is required', code: 'INVALID_SHEET_ORDER' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const sheetResult = await client.query(
            'SELECT id FROM worksheets WHERE workbook_id = $1',
            [id]
        );
        const workbookSheetIds = new Set(sheetResult.rows.map((row) => String(row.id)));

        for (const item of orders) {
            if (!workbookSheetIds.has(String(item.id)) || !Number.isInteger(item.order)) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Invalid reorder payload', code: 'INVALID_SHEET_ORDER' });
            }
            await client.query(
                'UPDATE worksheets SET sheet_order = $1 WHERE id = $2 AND workbook_id = $3',
                [item.order, item.id, id]
            );
        }
        await client.query('COMMIT');
        res.json({ message: 'Worksheets reordered successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error reordering worksheets', { error: error.message, workbookId: id });
        res.status(500).json({ error: 'Failed to reorder worksheets' });
    } finally {
        client.release();
    }
});

// List workbook conflicts
app.get('/api/workbooks/:id/conflicts', requireRequester, loadWorkbookAccess, requireWorkbookRead, async (req, res) => {
    const { id } = req.params;
    const { status = 'pending' } = req.query;

    try {
        const result = await pool.query(
            `SELECT
                c.*,
                u1.name as user1_name,
                u1.email as user1_email,
                u2.name as user2_name,
                u2.email as user2_email
             FROM conflicts c
             LEFT JOIN users u1 ON u1.firebase_uid = c.user1_id
             LEFT JOIN users u2 ON u2.firebase_uid = c.user2_id
             WHERE c.workbook_id = $1
               AND ($2::text = 'all' OR c.status = $2)
             ORDER BY c.created_at DESC`,
            [id, status]
        );

        res.json({ conflicts: result.rows });
    } catch (error) {
        logger.error('Failed to fetch workbook conflicts', { error: error.message, workbookId: id });
        res.status(500).json({ error: 'Failed to fetch conflicts' });
    }
});

// Lightweight check for pending conflicts
app.get('/api/workbooks/:id/has-conflicts', requireRequester, loadWorkbookAccess, requireWorkbookRead, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "SELECT COUNT(*)::int as count FROM conflicts WHERE workbook_id = $1 AND status = 'pending'",
            [id]
        );
        const count = result.rows[0].count;
        res.json({ hasConflicts: count > 0, pendingCount: count });
    } catch (error) {
        logger.error('Failed to check conflicts', { error: error.message, workbookId: id });
        res.status(500).json({ error: 'Failed to check conflicts' });
    }
});

// Resolve a conflict with manual or policy-based strategy
app.post('/api/workbooks/:id/conflicts/:conflictId/resolve', requireRequester, loadWorkbookAccess, requireWorkbookWrite, async (req, res) => {
    const { id, conflictId } = req.params;
    const { policy = 'manual', resolution = 'manual', resolvedValue } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const conflictResult = await client.query(
            `SELECT * FROM conflicts
             WHERE id = $1 AND workbook_id = $2`,
            [conflictId, id]
        );

        if (conflictResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Conflict not found', code: 'CONFLICT_NOT_FOUND' });
        }

        const conflict = conflictResult.rows[0];
        if (conflict.status === 'resolved') {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Conflict already resolved', code: 'CONFLICT_ALREADY_RESOLVED' });
        }

        let finalValue = resolvedValue;
        let finalResolution = resolution;

        if (policy === 'last-writer-wins') {
            finalValue = conflict.user2_value;
            finalResolution = 'last-writer-wins';
        }

        if (finalValue === undefined || finalValue === null) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'resolvedValue is required for manual resolution', code: 'RESOLVED_VALUE_REQUIRED' });
        }

        const address = toCellAddress(conflict.row_idx, conflict.col_idx);
        await client.query(
            `INSERT INTO cells (worksheet_id, row_idx, col_idx, address, value, formula, style, cell_version, last_edited_by)
             VALUES ($1, $2, $3, $4, $5, NULL, '{}'::jsonb, 1, $6)
             ON CONFLICT (worksheet_id, row_idx, col_idx)
             DO UPDATE SET value = EXCLUDED.value, cell_version = cells.cell_version + 1, last_edited_by = EXCLUDED.last_edited_by`,
            [conflict.worksheet_id, conflict.row_idx, conflict.col_idx, address, finalValue, req.requesterId]
        );

        await client.query(
            `UPDATE conflicts
             SET status = 'resolved',
                 resolved_by = $1,
                 resolved_at = NOW(),
                 resolution = $2
             WHERE id = $3`,
            [req.requesterId, finalResolution, conflictId]
        );

        await client.query('UPDATE workbooks SET updated_at = NOW() WHERE id = $1', [id]);

        await logAuditEvent(
            req.requesterId,
            req.requester.email,
            'CONFLICT_RESOLVED',
            {
                workbookId: parseInt(id, 10),
                conflictId: parseInt(conflictId, 10),
                policy,
                resolution: finalResolution,
                worksheetId: conflict.worksheet_id,
                row: conflict.row_idx,
                col: conflict.col_idx,
            },
            req.ip
        );

        await createNotifications({
            userIds: [conflict.user1_id, conflict.user2_id],
            type: 'success',
            title: 'Conflict resolved',
            message: `A conflict in workbook ${id} was resolved by ${req.requester.email || req.requesterId}.`,
            metadata: {
                workbookId: parseInt(id, 10),
                conflictId: parseInt(conflictId, 10),
                resolution: finalResolution,
            },
        });

        await client.query('COMMIT');

        io.to(`workbook-${id}`).emit('conflict-resolved', {
            conflictId: parseInt(conflictId, 10),
            resolution: finalResolution,
            resolvedValue: finalValue,
            resolvedBy: req.requesterId,
            cellData: {
                worksheetId: String(conflict.worksheet_id),
                row: conflict.row_idx,
                col: conflict.col_idx,
                value: finalValue,
            },
        });

        res.json({
            message: 'Conflict resolved successfully',
            conflictId: parseInt(conflictId, 10),
            resolution: finalResolution,
            value: finalValue,
        });
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Failed to resolve conflict', {
            error: error.message,
            workbookId: id,
            conflictId,
            requesterId: req.requesterId,
        });
        res.status(500).json({ error: 'Failed to resolve conflict' });
    } finally {
        client.release();
    }
});


// Get all users (from Postgres)
app.get('/api/users', requireRequester, async (req, res) => {
    try {
        if (req.requesterRole === 'admin') {
            const adminResult = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
            return res.json(adminResult.rows);
        }

        const result = await pool.query(
            `SELECT u.*
             FROM users u
             LEFT JOIN user_settings us ON us.user_id = u.firebase_uid
             WHERE u.firebase_uid = $1
                OR COALESCE(us.public_profile, TRUE) = TRUE
             ORDER BY u.created_at DESC`,
            [req.requesterId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create User (Admin)
app.post('/api/admin/users', requireRequester, requireAdmin, adminLimiter, async (req, res) => {
    const { email, password, name, role } = req.body;

    try {
        // 1. Create in Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name,
        });

        // 2. Insert into Postgres
        const values = [userRecord.uid, email, name, role || 'user'];
        const result = await pool.query(
            'INSERT INTO users (firebase_uid, email, name, role) VALUES ($1, $2, $3, $4) RETURNING *',
            values
        );

        // 3. Audit log
        await logAuditEvent(null, email, 'USER_CREATED', { targetEmail: email, targetName: name, role: role || 'user' }, req.ip);

        logger.info('Admin created user successfully', { uid: userRecord.uid, email, role: role || 'user' });
        res.status(201).json({ message: 'User created successfully', user: result.rows[0] });
    } catch (error) {
        logger.error('Error creating user', { error: error.message, email });
        await logAuditEvent(null, email, 'USER_CREATE_FAILED', { error: error.message }, req.ip);
        res.status(500).json({ error: error.message });
    }
});

// Update User (Admin)
app.put('/api/admin/users/:uid', requireRequester, requireAdmin, adminLimiter, async (req, res) => {
    const { uid } = req.params;
    const { email, name, role } = req.body;

    try {
        // 1. Update Firebase Auth (Best effort)
        try {
            await admin.auth().updateUser(uid, {
                email,
                displayName: name,
            });
        } catch (firebaseError) {
            console.warn('Warning: Failed to update Firebase Auth user:', firebaseError.message);
            // Continue to update DB even if Firebase fails
        }

        // 2. Update Postgres
        const updateQuery = `
      UPDATE users 
      SET email = $1, name = $2, role = $3
      WHERE firebase_uid = $4
      RETURNING *
    `;
        const result = await pool.query(updateQuery, [email, name, role, uid]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found in database' });
        }

        // Audit log
        await logAuditEvent(null, email, 'USER_UPDATED', { targetUid: uid, email, name, role }, req.ip);

        logger.info('Admin updated user successfully', { uid, email });
        res.json({ message: 'User updated successfully', user: result.rows[0] });

    } catch (error) {
        logger.error('Error updating user', { error: error.message, uid });
        await logAuditEvent(null, null, 'USER_UPDATE_FAILED', { targetUid: uid, error: error.message }, req.ip);
        res.status(500).json({ error: error.message });
    }
});

// Delete User (Admin)
app.delete('/api/admin/users/:uid', requireRequester, requireAdmin, adminLimiter, async (req, res) => {
    const { uid } = req.params;

    try {
        // 1. Delete from Firebase Auth (Best effort)
        try {
            await admin.auth().deleteUser(uid);
        } catch (firebaseError) {
            console.warn('Warning: Failed to delete Firebase Auth user:', firebaseError.message);
            // Continue to delete from DB
        }

        // 2. Delete from Postgres
        const result = await pool.query('DELETE FROM users WHERE firebase_uid = $1 RETURNING *', [uid]);

        if (result.rows.length === 0) {
            console.warn('User deleted from Auth but not found in Postgres');
        }

        // Audit log
        const deletedEmail = result.rows.length > 0 ? result.rows[0].email : 'unknown';
        await logAuditEvent(null, deletedEmail, 'USER_DELETED', { targetUid: uid, email: deletedEmail }, req.ip);

        logger.info('Admin deleted user successfully', { uid });
        res.json({ message: 'User deleted successfully' });

    } catch (error) {
        logger.error('Error deleting user', { error: error.message, uid });
        await logAuditEvent(null, null, 'USER_DELETE_FAILED', { targetUid: uid, error: error.message }, req.ip);
        res.status(500).json({ error: error.message });
    }
});

// List Users (Admin)
app.get('/api/admin/users', requireRequester, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
        res.json({ users: result.rows });
    } catch (error) {
        logger.error('Error fetching admin users list', { error: error.message, requesterId: req.requesterId });
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// ============================================
// ADMIN DASHBOARD ENDPOINTS
// ============================================

// Admin Stats - Real-time overview data
app.get('/api/admin/stats', requireRequester, requireAdmin, async (req, res) => {
    try {
        const [usersResult, workbooksResult, commitsResult, conflictsResult, recentSignupsResult, dbSizeResult] = await Promise.all([
            pool.query('SELECT COUNT(*) as count FROM users'),
            pool.query('SELECT COUNT(*) as count FROM workbooks'),
            pool.query('SELECT COUNT(*) as count FROM commits'),
            pool.query("SELECT COUNT(*) as count FROM conflicts WHERE status = 'pending'"),
            pool.query("SELECT COUNT(*) as count FROM users WHERE created_at > NOW() - INTERVAL '7 days'"),
            pool.query("SELECT pg_database_size(current_database()) as size"),
        ]);

        res.json({
            totalUsers: parseInt(usersResult.rows[0].count),
            totalWorkbooks: parseInt(workbooksResult.rows[0].count),
            totalCommits: parseInt(commitsResult.rows[0].count),
            pendingConflicts: parseInt(conflictsResult.rows[0].count),
            recentSignups: parseInt(recentSignupsResult.rows[0].count),
            storageBytesUsed: parseInt(dbSizeResult.rows[0].size),
        });
    } catch (error) {
        logger.error('Error fetching admin stats', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
});

// Admin Recent Activity - all commits across all users
app.get('/api/admin/recent-activity', requireRequester, requireAdmin, async (req, res) => {
    const { limit = 20 } = req.query;
    try {
        const result = await pool.query(
            `SELECT
                c.id,
                c.message,
                c.user_id,
                c.timestamp,
                c.hash,
                c.workbook_id,
                w.name as workbook_name,
                u.name as user_name,
                u.email as user_email,
                COUNT(cv.id) as changes_count
             FROM commits c
             JOIN workbooks w ON c.workbook_id = w.id
             LEFT JOIN users u ON c.user_id = u.firebase_uid
             LEFT JOIN cell_versions cv ON c.id = cv.commit_id
             GROUP BY c.id, w.name, u.name, u.email
             ORDER BY c.timestamp DESC
             LIMIT $1`,
            [limit]
        );

        res.json({ commits: result.rows });
    } catch (error) {
        logger.error('Error fetching recent activity', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch recent activity' });
    }
});

// Audit Logs - Fetch
app.get('/api/admin/audit-logs', requireRequester, requireAdmin, async (req, res) => {
    const {
        limit = 100,
        offset = 0,
        action,
        user,
        from,
        to,
    } = req.query;

    try {
        const conditions = [];
        const values = [];

        if (action) {
            values.push(action);
            conditions.push(`action ILIKE $${values.length}`);
        }

        if (user) {
            values.push(`%${user}%`);
            conditions.push(`(COALESCE(user_email, '') ILIKE $${values.length} OR COALESCE(user_id, '') ILIKE $${values.length})`);
        }

        if (from) {
            values.push(from);
            conditions.push(`timestamp >= $${values.length}::timestamp`);
        }

        if (to) {
            values.push(to);
            conditions.push(`timestamp <= $${values.length}::timestamp`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        values.push(limit);
        values.push(offset);

        const result = await pool.query(
            `SELECT * FROM audit_logs
             ${whereClause}
             ORDER BY timestamp DESC
             LIMIT $${values.length - 1}
             OFFSET $${values.length}`,
            values
        );

        const countValues = values.slice(0, values.length - 2);
        const countResult = await pool.query(
            `SELECT COUNT(*)::int as total FROM audit_logs ${whereClause}`,
            countValues
        );

        res.json({ logs: result.rows, total: countResult.rows[0].total });
    } catch (error) {
        logger.error('Error fetching audit logs', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

// Audit Logs - Create (for manual/programmatic logging)
app.post('/api/admin/audit-logs', requireRequester, requireAdmin, async (req, res) => {
    const { user_id, user_email, action, details, ip_address } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO audit_logs (user_id, user_email, action, details, ip_address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [user_id, user_email, action, details ? JSON.stringify(details) : null, ip_address]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating audit log', { error: error.message });
        res.status(500).json({ error: 'Failed to create audit log' });
    }
});

// Audit Logs - Export as CSV
app.get('/api/admin/audit-logs/export', requireRequester, requireAdmin, async (req, res) => {
    const { action, user, from, to, format = 'csv' } = req.query;

    try {
        const conditions = [];
        const values = [];

        if (action) {
            values.push(action);
            conditions.push(`action ILIKE $${values.length}`);
        }

        if (user) {
            values.push(`%${user}%`);
            conditions.push(`(COALESCE(user_email, '') ILIKE $${values.length} OR COALESCE(user_id, '') ILIKE $${values.length})`);
        }

        if (from) {
            values.push(from);
            conditions.push(`timestamp >= $${values.length}::timestamp`);
        }

        if (to) {
            values.push(to);
            conditions.push(`timestamp <= $${values.length}::timestamp`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const result = await pool.query(`SELECT * FROM audit_logs ${whereClause} ORDER BY timestamp DESC`, values);
        const logs = result.rows;

        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.json"`);
            return res.send(JSON.stringify(logs, null, 2));
        }

        const headers = ['ID', 'Timestamp', 'User ID', 'User Email', 'Action', 'Details', 'IP Address'];
        const csvRows = logs.map(log => [
            log.id,
            new Date(log.timestamp).toISOString(),
            log.user_id || '',
            log.user_email || '',
            log.action,
            log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '',
            log.ip_address || ''
        ].map(v => `"${v}"`).join(','));

        const csvContent = [headers.join(','), ...csvRows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
    } catch (error) {
        logger.error('Error exporting audit logs', { error: error.message });
        res.status(500).json({ error: 'Failed to export audit logs' });
    }
});

// Compliance Report
app.get('/api/admin/compliance-report', requireRequester, requireAdmin, async (req, res) => {
    try {
        const [logsCount, userDist, lastLog] = await Promise.all([
            pool.query('SELECT COUNT(*) as count FROM audit_logs'),
            pool.query('SELECT role, COUNT(*) as count FROM users GROUP BY role'),
            pool.query('SELECT action, timestamp FROM audit_logs ORDER BY timestamp DESC LIMIT 1'),
        ]);

        const userDistribution = {};
        userDist.rows.forEach(row => {
            userDistribution[row.role || 'unknown'] = parseInt(row.count);
        });

        res.json({
            reportGeneratedAt: new Date().toISOString(),
            auditLogging: {
                status: 'active',
                totalLogs: parseInt(logsCount.rows[0].count),
                lastLoggedAction: lastLog.rows.length > 0 ? lastLog.rows[0].action : 'N/A',
            },
            userDistribution,
            retentionPolicy: '90 days',
            backupStatus: 'PostgreSQL WAL + Daily Snapshots',
        });
    } catch (error) {
        logger.error('Error generating compliance report', { error: error.message });
        res.status(500).json({ error: 'Failed to generate compliance report' });
    }
});

// Admin Analytics - aggregated data
app.get('/api/admin/analytics', requireRequester, requireAdmin, async (req, res) => {
    try {
        const [userGrowth, commitActivity, systemMetrics, recentAuditLogs] = await Promise.all([
            // Users created per day (last 7 days)
            pool.query(`
                SELECT DATE(created_at) as date, COUNT(*) as count
                FROM users
                WHERE created_at > NOW() - INTERVAL '7 days'
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            `),
            // Commits per day (last 7 days)
            pool.query(`
                SELECT DATE(timestamp) as date, COUNT(*) as count
                FROM commits
                WHERE timestamp > NOW() - INTERVAL '7 days'
                GROUP BY DATE(timestamp)
                ORDER BY date DESC
            `),
            // Overall system counts
            pool.query(`
                SELECT
                    (SELECT COUNT(*) FROM users) as total_users,
                    (SELECT COUNT(*) FROM workbooks) as total_workbooks,
                    (SELECT COUNT(*) FROM commits) as total_commits,
                    (SELECT COUNT(*) FROM cells) as total_cells,
                    (SELECT pg_database_size(current_database())) as db_size
            `),
            // Recent audit logs for analytics page
            pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 20'),
        ]);

        const metrics = systemMetrics.rows[0];

        res.json({
            userGrowth: userGrowth.rows,
            commitActivity: commitActivity.rows,
            systemMetrics: {
                totalUsers: parseInt(metrics.total_users),
                totalWorkbooks: parseInt(metrics.total_workbooks),
                totalCommits: parseInt(metrics.total_commits),
                totalCells: parseInt(metrics.total_cells),
                dbSizeBytes: parseInt(metrics.db_size),
            },
            recentAuditLogs: recentAuditLogs.rows,
        });
    } catch (error) {
        logger.error('Error fetching analytics', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
});

// ============================================
// VERSION CONTROL ENDPOINTS
// ============================================

const fetchWorkbookCommitHistory = async (workbookId, limitRaw, offsetRaw) => {
    const pagination = parsePagination(limitRaw, offsetRaw, 50, 200);
    if (pagination.error) {
        const error = new Error(pagination.error);
        error.code = 'INVALID_PAGINATION';
        throw error;
    }

    const result = await pool.query(
        `SELECT 
            c.id,
            c.message,
            c.user_id,
            c.timestamp,
            c.hash,
            COUNT(cv.id) as changes_count
         FROM commits c
         LEFT JOIN cell_versions cv ON c.id = cv.commit_id
         WHERE c.workbook_id = $1
         GROUP BY c.id
         ORDER BY c.timestamp DESC
         LIMIT $2 OFFSET $3`,
        [workbookId, pagination.limit, pagination.offset]
    );

    return result.rows;
};

const fetchCommitDetails = async (commitId) => {
    const commitResult = await pool.query('SELECT * FROM commits WHERE id = $1', [commitId]);
    if (commitResult.rows.length === 0) {
        const error = new Error('Commit not found');
        error.code = 'COMMIT_NOT_FOUND';
        throw error;
    }

    const commit = commitResult.rows[0];
    const changesResult = await pool.query(
        `SELECT 
            cc.*,
            c.address,
            c.row_idx,
            c.col_idx,
            w.name as worksheet_name
         FROM commit_changes cc
         JOIN cells c ON cc.cell_id = c.id
         JOIN worksheets w ON c.worksheet_id = w.id
         WHERE cc.commit_id = $1
         ORDER BY w.sheet_order, c.row_idx, c.col_idx`,
        [commitId]
    );

    return { commit, changes: changesResult.rows };
};

const rollbackWorkbookToCommit = async ({ workbookId, commitId, userId }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const commitCheck = await client.query(
            'SELECT * FROM commits WHERE id = $1 AND workbook_id = $2',
            [commitId, workbookId]
        );

        if (commitCheck.rows.length === 0) {
            throw new Error('Commit not found or does not belong to this workbook');
        }

        const cellVersions = await client.query(
            `SELECT cv.*, c.id as cell_id, c.worksheet_id
             FROM cell_versions cv
             JOIN cells c ON cv.cell_id = c.id
             WHERE cv.commit_id = $1`,
            [commitId]
        );

        const snapshotCellIds = cellVersions.rows.map((version) => Number(version.cell_id)).filter(Number.isFinite);

        // Clear cells that were introduced after the target commit so rollback restores full snapshot state
        if (snapshotCellIds.length > 0) {
            await client.query(
                `UPDATE cells c
                 SET value = NULL,
                     formula = NULL,
                     style = '{}'::jsonb,
                     cell_version = COALESCE(c.cell_version, 1) + 1,
                     last_edited_by = $2
                 FROM worksheets ws
                 WHERE c.worksheet_id = ws.id
                   AND ws.workbook_id = $1
                   AND NOT (c.id = ANY($3::int[]))`,
                [workbookId, userId, snapshotCellIds]
            );
        } else {
            await client.query(
                `UPDATE cells c
                 SET value = NULL,
                     formula = NULL,
                     style = '{}'::jsonb,
                     cell_version = COALESCE(c.cell_version, 1) + 1,
                     last_edited_by = $2
                 FROM worksheets ws
                 WHERE c.worksheet_id = ws.id
                   AND ws.workbook_id = $1`,
                [workbookId, userId]
            );
        }

        for (const version of cellVersions.rows) {
            await client.query(
                `UPDATE cells 
                 SET value = $1,
                     formula = $2,
                     style = $3,
                     cell_version = COALESCE(cell_version, 1) + 1,
                     last_edited_by = $4
                 WHERE id = $5`,
                [version.value, version.formula, version.style, userId, version.cell_id]
            );
        }

        const hash = crypto.createHash('sha256')
            .update(`${workbookId}-${userId}-${Date.now()}-rollback`)
            .digest('hex');

        const newCommitResult = await client.query(
            `INSERT INTO commits (workbook_id, user_id, message, hash)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [workbookId, userId, `Rolled back to commit ${commitId}`, hash]
        );

        for (const version of cellVersions.rows) {
            await client.query(
                `INSERT INTO cell_versions (commit_id, cell_id, value, formula, style)
                 VALUES ($1, $2, $3, $4, $5)`,
                [newCommitResult.rows[0].id, version.cell_id, version.value, version.formula, version.style]
            );
        }

        await client.query('UPDATE workbooks SET updated_at = NOW() WHERE id = $1', [workbookId]);

        await client.query('COMMIT');

        return {
            message: 'Rollback successful',
            new_commit: newCommitResult.rows[0],
            cells_restored: cellVersions.rows.length,
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Create a new commit (snapshot of current workbook state)
app.post('/api/commits', commitLimiter, requireRequester, loadWorkbookAccess, requireWorkbookWrite, async (req, res) => {
    const { workbook_id, user_id, message } = req.body;

    if (!workbook_id || !user_id) {
        return res.status(400).json({ error: 'workbook_id and user_id are required' });
    }

    if (req.requesterRole !== 'admin' && user_id !== req.requesterId) {
        return res.status(403).json({ error: 'Requester must match user_id for commit', code: 'COMMIT_USER_MISMATCH' });
    }

    // ── Block commit if there are pending conflicts for this workbook ──
    try {
        const pendingConflicts = await pool.query(
            "SELECT COUNT(*)::int as count FROM conflicts WHERE workbook_id = $1 AND status = 'pending'",
            [workbook_id]
        );
        const pendingCount = pendingConflicts.rows[0].count;
        if (pendingCount > 0) {
            return res.status(409).json({
                error: 'Cannot commit while conflicts are pending. Resolve all conflicts first.',
                code: 'PENDING_CONFLICTS_EXIST',
                pendingCount,
            });
        }
    } catch (conflictCheckErr) {
        logger.error('Failed to check pending conflicts before commit', { error: conflictCheckErr.message });
        // Continue with commit if conflict check fails (non-blocking safety)
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Generate commit hash
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256')
            .update(`${workbook_id}-${user_id}-${Date.now()}`)
            .digest('hex');

        // Create commit record
        const commitResult = await client.query(
            `INSERT INTO commits (workbook_id, user_id, message, hash) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [workbook_id, user_id, message || 'Auto-save', hash]
        );
        const commit = commitResult.rows[0];

        // Optimized Commit: Only save changes since last commit
        // 1. Get last commit ID
        const lastCommitResult = await client.query(
            'SELECT id FROM commits WHERE workbook_id = $1 AND id < $2 ORDER BY id DESC LIMIT 1',
            [workbook_id, commit.id]
        );
        const lastCommitId = lastCommitResult.rows.length > 0 ? lastCommitResult.rows[0].id : null;

        // Snapshot all current cells
        const cellsResult = await client.query(
            `SELECT c.* FROM cells c
             JOIN worksheets w ON c.worksheet_id = w.id
             WHERE w.workbook_id = $1`,
            [workbook_id]
        );

        for (const cell of cellsResult.rows) {
            // Always save to cell_versions for easy rollback (current implementation choice)
            await client.query(
                `INSERT INTO cell_versions (commit_id, cell_id, value, formula, style)
                 VALUES ($1, $2, $3, $4, $5)`,
                [commit.id, cell.id, cell.value, cell.formula, cell.style]
            );

            // Populate commit_changes for diffing optimization
            if (lastCommitId) {
                const prevVersion = await client.query(
                    'SELECT value, formula FROM cell_versions WHERE commit_id = $1 AND cell_id = $2',
                    [lastCommitId, cell.id]
                );

                if (prevVersion.rows.length > 0) {
                    const prev = prevVersion.rows[0];
                    if (prev.value !== cell.value || prev.formula !== cell.formula) {
                        await client.query(
                            `INSERT INTO commit_changes (commit_id, cell_id, change_type, old_value, new_value, old_formula, new_formula)
                             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                            [commit.id, cell.id, 'modified', prev.value, cell.value, prev.formula, cell.formula]
                        );
                    }
                } else {
                    await client.query(
                        `INSERT INTO commit_changes (commit_id, cell_id, change_type, new_value, new_formula)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [commit.id, cell.id, 'added', cell.value, cell.formula]
                    );
                }
            } else {
                // First commit
                await client.query(
                    `INSERT INTO commit_changes (commit_id, cell_id, change_type, new_value, new_formula)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [commit.id, cell.id, 'added', cell.value, cell.formula]
                );
            }
        }

        await client.query('COMMIT');

        // Invalidate cache
        await cache.delPattern(`commits:${workbook_id}*`);

        logger.info('Commit created successfully', { commitId: commit.id, workbook_id, user_id });
        res.status(201).json({ commit, cells_snapshotted: cellsResult.rows.length });

    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error creating commit', { error: error.message, workbook_id, user_id });
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Get commit history for a workbook
app.get('/api/workbooks/:id/commits', generalLimiter, requireRequester, loadWorkbookAccess, requireWorkbookRead, async (req, res) => {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    try {
        const commits = await fetchWorkbookCommitHistory(id, limit, offset);
        res.json({ commits });

    } catch (error) {
        if (error.code === 'INVALID_PAGINATION') {
            return res.status(400).json({ error: error.message, code: error.code });
        }
        console.error('Error fetching commits:', error);
        res.status(500).json({ error: error.message });
    }
});

// Alias: planned history endpoint
app.get('/api/workbooks/:id/history', generalLimiter, requireRequester, loadWorkbookAccess, requireWorkbookRead, async (req, res) => {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    try {
        const commits = await fetchWorkbookCommitHistory(id, limit, offset);
        res.json({ commits });
    } catch (error) {
        if (error.code === 'INVALID_PAGINATION') {
            return res.status(400).json({ error: error.message, code: error.code });
        }
        console.error('Error fetching commit history:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all commits for a user (Global Activity)
app.get('/api/commits', generalLimiter, requireRequester, async (req, res) => {
    const { user_id, limit = 50, offset = 0 } = req.query;

    if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
    }

    if (req.requesterRole !== 'admin' && user_id !== req.requesterId) {
        return res.status(403).json({ error: 'Access denied for requested user commits', code: 'COMMITS_FORBIDDEN' });
    }

    try {
        const result = await pool.query(
            `SELECT 
                c.id,
                c.message,
                c.user_id,
                c.timestamp,
                c.hash,
                c.workbook_id,
                w.name as workbook_name,
                COUNT(cv.id) as changes_count
             FROM commits c
             JOIN workbooks w ON c.workbook_id = w.id
             LEFT JOIN cell_versions cv ON c.id = cv.commit_id
             WHERE c.user_id = $1
             GROUP BY c.id, w.name
             ORDER BY c.timestamp DESC
             LIMIT $2 OFFSET $3`,
            [user_id, limit, offset]
        );

        res.json({ commits: result.rows });

    } catch (error) {
        console.error('Error fetching user commits:', error);
        res.status(500).json({ error: error.message });
    }
});


// Get detailed commit information with cell changes
app.get('/api/commits/:id', requireRequester, loadCommitAccess, async (req, res) => {
    const { id } = req.params;

    try {
        const details = await fetchCommitDetails(id);
        res.json(details);

    } catch (error) {
        if (error.code === 'COMMIT_NOT_FOUND') {
            return res.status(404).json({ error: error.message, code: error.code });
        }
        console.error('Error fetching commit details:', error);
        res.status(500).json({ error: error.message });
    }
});

// Alias: planned workbook-scoped commit detail endpoint
app.get('/api/workbooks/:id/commits/:commitId', requireRequester, loadWorkbookAccess, requireWorkbookRead, async (req, res) => {
    const workbookId = parseInt(req.params.id, 10);
    const commitId = parseInt(req.params.commitId, 10);

    if (!commitId || Number.isNaN(commitId)) {
        return res.status(400).json({ error: 'Valid commit ID is required', code: 'INVALID_COMMIT_ID' });
    }

    try {
        const commitOwnership = await pool.query(
            'SELECT id FROM commits WHERE id = $1 AND workbook_id = $2',
            [commitId, workbookId]
        );

        if (commitOwnership.rows.length === 0) {
            return res.status(404).json({ error: 'Commit not found for workbook', code: 'COMMIT_NOT_FOUND' });
        }

        const details = await fetchCommitDetails(commitId);
        res.json(details);
    } catch (error) {
        if (error.code === 'COMMIT_NOT_FOUND') {
            return res.status(404).json({ error: error.message, code: error.code });
        }
        console.error('Error fetching workbook commit details:', error);
        res.status(500).json({ error: error.message });
    }
});

// Cell-specific history endpoint
app.get('/api/cells/:cellId/history', generalLimiter, requireRequester, loadCellAccess, async (req, res) => {
    const { cellId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const pagination = parsePagination(limit, offset, 50, 200);
    if (pagination.error) {
        return res.status(400).json({ error: pagination.error, code: 'INVALID_PAGINATION' });
    }

    try {
        const historyResult = await pool.query(
            `SELECT
                cv.id,
                cv.commit_id,
                cv.cell_id,
                cv.value,
                cv.formula,
                cv.style,
                c.user_id,
                c.message,
                c.timestamp,
                c.hash
             FROM cell_versions cv
             JOIN commits c ON c.id = cv.commit_id
             WHERE cv.cell_id = $1
             ORDER BY c.timestamp DESC
             LIMIT $2 OFFSET $3`,
            [cellId, pagination.limit, pagination.offset]
        );

        res.json({
            cell_id: Number(cellId),
            workbook_id: req.cellAccess.workbookId,
            worksheet_id: req.cellAccess.worksheetId,
            history: historyResult.rows,
        });
    } catch (error) {
        logger.error('Error fetching cell history', { error: error.message, cellId });
        res.status(500).json({ error: 'Failed to fetch cell history' });
    }
});

// Compare two commits (Diff API)
app.get('/api/workbooks/:id/diff', generalLimiter, requireRequester, loadWorkbookAccess, requireWorkbookRead, async (req, res) => {
    const { id } = req.params;
    const { base, head } = req.query;

    if (!head) {
        return res.status(400).json({ error: 'head commit_id is required' });
    }

    const workbookId = parseInt(id, 10);
    const headCommitId = parseInt(head, 10);
    const baseCommitId = base ? parseInt(base, 10) : null;

    if (Number.isNaN(workbookId) || Number.isNaN(headCommitId) || (base && Number.isNaN(baseCommitId))) {
        return res.status(400).json({ error: 'Invalid commit IDs provided', code: 'INVALID_COMMIT_IDS' });
    }

    try {
        const commitIdsToCheck = [headCommitId, ...(baseCommitId ? [baseCommitId] : [])];
        const commitOwnership = await pool.query(
            'SELECT id FROM commits WHERE workbook_id = $1 AND id = ANY($2::int[])',
            [workbookId, commitIdsToCheck]
        );

        if (commitOwnership.rows.length !== commitIdsToCheck.length) {
            return res.status(400).json({ error: 'One or more commits do not belong to this workbook', code: 'COMMIT_WORKBOOK_MISMATCH' });
        }

        const diffs = await diffEngine.compareCommits(workbookId, baseCommitId, headCommitId);
        res.json({
            workbook_id: workbookId,
            base_commit: baseCommitId || 'initial',
            head_commit: headCommitId,
            diffs
        });
    } catch (error) {
        logger.error('Error generating diff', { error: error.message, workbookId, baseCommitId, headCommitId });
        res.status(500).json({ error: error.message });
    }
});

// Download Workbook as Excel
app.get('/api/workbooks/:id/download', generalLimiter, requireRequester, loadWorkbookAccess, requireWorkbookRead, async (req, res) => {
    const { id } = req.params;

    try {
        // Fetch Workbook Info
        const wbResult = await pool.query('SELECT * FROM workbooks WHERE id = $1', [id]);
        if (wbResult.rows.length === 0) return res.status(404).json({ error: 'Workbook not found' });
        const workbook = wbResult.rows[0];

        // Fetch Worksheets
        const worksheets = await pool.query('SELECT * FROM worksheets WHERE workbook_id = $1 ORDER BY sheet_order', [id]);

        const excelWorkbook = new ExcelJS.Workbook();
        excelWorkbook.creator = 'XcelTrack';
        excelWorkbook.lastModifiedBy = 'XcelTrack';
        excelWorkbook.created = workbook.created_at;
        excelWorkbook.modified = workbook.updated_at;

        for (const sheet of worksheets.rows) {
            const excelSheet = excelWorkbook.addWorksheet(sheet.name);

            // Fetch cells for this sheet
            const cells = await pool.query('SELECT * FROM cells WHERE worksheet_id = $1', [sheet.id]);

            cells.rows.forEach(cell => {
                const excelCell = excelSheet.getCell(cell.row_idx + 1, cell.col_idx + 1);
                if (cell.formula) {
                    excelCell.value = { formula: cell.formula, result: cell.value };
                } else {
                    excelCell.value = cell.value;
                }

                if (cell.style) {
                    // Basic style application if needed
                }
            });
        }

        // Set response headers for download
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${workbook.name}"`
        );

        await excelWorkbook.xlsx.write(res);
        res.end();

        logger.info('Workbook downloaded', { workbookId: id, name: workbook.name });
    } catch (error) {
        logger.error('Error exporting workbook', { error: error.message, workbookId: id });
        res.status(500).json({ error: 'Failed to generate Excel file' });
    }
});

// Rollback workbook to a specific commit
app.post('/api/workbooks/:id/rollback', requireRequester, loadWorkbookAccess, requireWorkbookWrite, async (req, res) => {
    const { id } = req.params;
    const { commit_id, user_id } = req.body;

    if (!commit_id || !user_id) {
        return res.status(400).json({ error: 'commit_id and user_id are required' });
    }

    if (req.requesterRole !== 'admin' && user_id !== req.requesterId) {
        return res.status(403).json({ error: 'Requester must match user_id for rollback', code: 'ROLLBACK_USER_MISMATCH' });
    }

    try {
        const rollbackResult = await rollbackWorkbookToCommit({
            workbookId: id,
            commitId: commit_id,
            userId: user_id,
        });
        res.json(rollbackResult);

    } catch (error) {
        console.error('Error during rollback:', error);
        res.status(500).json({ error: error.message });
    }
});

// Alias: planned revert endpoint shape
app.post('/api/workbooks/:id/revert/:commitId', requireRequester, loadWorkbookAccess, requireWorkbookWrite, async (req, res) => {
    const { id, commitId } = req.params;
    const user_id = req.body?.user_id || req.body?.requester_id || req.requesterId;

    if (!user_id) {
        return res.status(400).json({ error: 'user_id is required', code: 'USER_ID_REQUIRED' });
    }

    if (req.requesterRole !== 'admin' && user_id !== req.requesterId) {
        return res.status(403).json({ error: 'Requester must match user_id for rollback', code: 'ROLLBACK_USER_MISMATCH' });
    }

    const parsedCommitId = parseInt(commitId, 10);
    if (!parsedCommitId || Number.isNaN(parsedCommitId)) {
        return res.status(400).json({ error: 'Valid commit_id is required', code: 'INVALID_COMMIT_ID' });
    }

    try {
        const rollbackResult = await rollbackWorkbookToCommit({
            workbookId: id,
            commitId: parsedCommitId,
            userId: user_id,
        });
        res.json(rollbackResult);
    } catch (error) {
        console.error('Error during revert:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Snapshot of Workbook at specific commit (for preview)
app.get('/api/commits/:id/snapshot', requireRequester, loadCommitAccess, async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Get commit info to find workbook_id
        const commitResult = await pool.query('SELECT * FROM commits WHERE id = $1', [id]);
        if (commitResult.rows.length === 0) return res.status(404).json({ error: 'Commit not found' });
        const commit = commitResult.rows[0];

        // 2. Fetch Workbook basic info
        const wbResult = await pool.query('SELECT * FROM workbooks WHERE id = $1', [commit.workbook_id]);
        const workbook = wbResult.rows[0];

        // 3. Fetch Worksheets (assuming they haven't changed much, otherwise this needs versioning too)
        const wsResult = await pool.query('SELECT * FROM worksheets WHERE workbook_id = $1 ORDER BY sheet_order', [workbook.id]);
        const worksheets = wsResult.rows;

        const sheetsData = {};
        const sheetOrder = [];

        for (const ws of worksheets) {
            sheetOrder.push(ws.id.toString());

            // 4. Fetch Cell Versions for this SPECIFIC commit
            const cellsResult = await pool.query(
                `SELECT cv.*, c.row_idx, c.col_idx 
                 FROM cell_versions cv
                 JOIN cells c ON cv.cell_id = c.id
                 WHERE cv.commit_id = $1 AND c.worksheet_id = $2`,
                [id, ws.id]
            );

            const cellData = {};
            cellsResult.rows.forEach(cell => {
                if (!cellData[cell.row_idx]) cellData[cell.row_idx] = {};
                cellData[cell.row_idx][cell.col_idx] = {
                    v: cell.value,
                    f: cell.formula,
                    // styles mapping could go here
                };
            });

            sheetsData[ws.id] = {
                id: ws.id.toString(),
                name: ws.name,
                cellData: cellData,
                rowCount: 1000,
                columnCount: 26
            };
        }

        const univerData = {
            id: workbook.id.toString(),
            name: `${workbook.name} (Preview: ${commit.hash.substring(0, 8)})`,
            appVersion: '3.0.0',
            sheets: sheetsData,
            sheetOrder: sheetOrder,
            styles: {}
        };

        res.json(univerData);

    } catch (error) {
        console.error('Error generating snapshot:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// WEBSOCKET COLLABORATION
// ============================================

// Initialize collaboration WebSocket server (conflict detection, typing indicators, presence)
initWebSocket(io, pool);



// ============================================
// START SERVER
// ============================================

if (require.main === module) {
    server.listen(port, () => {
        logger.info(`Server running on port ${port}`);
        logger.info('WebSocket server ready');
        logger.info('All optimization modules loaded successfully');
    });
}

// Graceful shutdown
const gracefulShutdown = async () => {
    logger.info('Received shutdown signal, closing server gracefully...');

    server.close(() => {
        logger.info('HTTP server closed');
    });

    // Close Socket.io
    io.close(() => {
        logger.info('Socket.io server closed');
    });

    try {
        // Close Redis connection
        await closeRedis();

        // Close database pool
        await pool.end();
        logger.info('Database pool closed');

        logger.info('Graceful shutdown completed');
        process.exit(0);
    } catch (err) {
        logger.error('Error during shutdown', { error: err.message });
        process.exit(1);
    }
};

if (require.main === module) {
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
}

module.exports = {
    app,
    server,
    pool,
    io,
    createTables,
};
