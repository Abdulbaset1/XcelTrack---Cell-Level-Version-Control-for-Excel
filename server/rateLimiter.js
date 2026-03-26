const rateLimit = require('express-rate-limit');

// General API rate limiter - 100 requests per 15 minutes
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        error: 'Too many requests from this IP, please try again after 15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Authentication rate limiter - 5 requests per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
        error: 'Too many authentication attempts, please try again after 15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
});

// OTP rate limiter - 3 requests per 15 minutes
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3,
    message: {
        error: 'Too many OTP requests, please try again after 15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// File upload rate limiter - 10 requests per hour
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: {
        error: 'Too many file uploads, please try again after 1 hour',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Admin operations rate limiter - 50 requests per 15 minutes
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    message: {
        error: 'Too many admin requests, please try again after 15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Commit creation rate limiter - 30 requests per 15 minutes
const commitLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30,
    message: {
        error: 'Too many commit requests, please try again after 15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    generalLimiter,
    authLimiter,
    otpLimiter,
    uploadLimiter,
    adminLimiter,
    commitLimiter,
};
