const Redis = require('ioredis');

// Redis Configuration - Optional, will gracefully degrade if not available
let redis = null;
let redisAvailable = false;

try {
    redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retryStrategy: (times) => {
            // Stop retrying after 3 attempts
            if (times > 3) {
                console.warn('Redis connection failed after 3 attempts. Caching disabled.');
                return null;
            }
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        maxRetriesPerRequest: 3,
        lazyConnect: true, // Don't connect immediately
    });

    // Redis event listeners
    redis.on('connect', () => {
        console.log('Redis client connected');
        redisAvailable = true;
    });

    redis.on('error', (err) => {
        console.warn('Redis error (caching disabled):', err.message);
        redisAvailable = false;
    });

    redis.on('ready', () => {
        console.log('Redis client ready');
        redisAvailable = true;
    });

    redis.on('close', () => {
        console.log('Redis connection closed');
        redisAvailable = false;
    });

    // Try to connect
    redis.connect().catch((err) => {
        console.warn('Redis not available. Server will run without caching:', err.message);
        redisAvailable = false;
    });
} catch (error) {
    console.warn('Redis initialization failed. Server will run without caching:', error.message);
    redisAvailable = false;
}

// Cache utility functions
const cache = {
    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {Promise<any>} - Cached value or null
     */
    async get(key) {
        if (!redisAvailable || !redis) return null;

        try {
            const value = await redis.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.warn('Cache get error:', error.message);
            return null;
        }
    },

    /**
     * Set value in cache with TTL
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
     */
    async set(key, value, ttl = 300) {
        if (!redisAvailable || !redis) return false;

        try {
            await redis.setex(key, ttl, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn('Cache set error:', error.message);
            return false;
        }
    },

    /**
     * Delete value from cache
     * @param {string} key - Cache key
     */
    async del(key) {
        if (!redisAvailable || !redis) return false;

        try {
            await redis.del(key);
            return true;
        } catch (error) {
            console.warn('Cache delete error:', error.message);
            return false;
        }
    },

    /**
     * Delete all keys matching a pattern
     * @param {string} pattern - Pattern to match (e.g., 'workbook:*')
     */
    async delPattern(pattern) {
        if (!redisAvailable || !redis) return false;

        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
            return true;
        } catch (error) {
            console.warn('Cache delete pattern error:', error.message);
            return false;
        }
    },

    /**
     * Check if key exists in cache
     * @param {string} key - Cache key
     * @returns {Promise<boolean>}
     */
    async exists(key) {
        if (!redisAvailable || !redis) return false;

        try {
            const result = await redis.exists(key);
            return result === 1;
        } catch (error) {
            console.warn('Cache exists error:', error.message);
            return false;
        }
    },

    /**
     * Generate cache key for workbook
     * @param {number} workbookId
     * @returns {string}
     */
    workbookKey(workbookId) {
        return `workbook:${workbookId}`;
    },

    /**
     * Generate cache key for user workbooks list
     * @param {string} userId
     * @returns {string}
     */
    userWorkbooksKey(userId) {
        return `user:${userId}:workbooks`;
    },

    /**
     * Generate cache key for commit history
     * @param {number} workbookId
     * @returns {string}
     */
    commitHistoryKey(workbookId) {
        return `commits:${workbookId}`;
    },

    /**
     * Generate cache key for user data
     * @param {string} userId
     * @returns {string}
     */
    userKey(userId) {
        return `user:${userId}`;
    },
};

// Graceful shutdown
const closeRedis = async () => {
    if (redis && redisAvailable) {
        try {
            await redis.quit();
            console.log('Redis connection closed');
        } catch (error) {
            console.warn('Error closing Redis:', error.message);
        }
    } else {
        console.log('Redis was not connected, nothing to close');
    }
};

module.exports = { cache, redis, closeRedis };
