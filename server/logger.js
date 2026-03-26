const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// File rotation transport for errors
const errorFileRotateTransport = new winston.transports.DailyRotateFile({
    filename: path.join(__dirname, 'logs', 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d',
    format: logFormat,
});

// File rotation transport for all logs
const combinedFileRotateTransport = new winston.transports.DailyRotateFile({
    filename: path.join(__dirname, 'logs', 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: logFormat,
});

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        errorFileRotateTransport,
        combinedFileRotateTransport,
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(__dirname, 'logs', 'exceptions.log'),
        }),
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(__dirname, 'logs', 'rejections.log'),
        }),
    ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: consoleFormat,
        })
    );
}

// Create HTTP request logger middleware
const morgan = require('morgan');

// Custom token for request ID
morgan.token('id', (req) => req.id);

// Morgan stream
const morganStream = {
    write: (message) => {
        logger.info(message.trim());
    },
};

// Morgan middleware
const requestLogger = morgan(
    ':id :method :url :status :res[content-length] - :response-time ms',
    { stream: morganStream }
);

module.exports = { logger, requestLogger };
