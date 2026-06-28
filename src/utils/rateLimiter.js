const redisManager = require('../managers/redisManager');
const { logger } = require('../../src/managers/logger');

class RateLimiter {
    /**
     * Checks if a user has exceeded the rate limit.
     * @param {string} userId - The ID of the user.
     * @param {string} commandName - The name of the command.
     * @param {number} limit - The maximum number of requests allowed.
     * @param {number} windowInSeconds - The time window in seconds.
     * @returns {Promise<boolean>} True if rate limited, false otherwise.
     */
    static async isRateLimited(userId, commandName, limit, windowInSeconds) {
        if (!redisManager.client || !redisManager.client.isReady) return false;

        const key = `ratelimit:${commandName}:${userId}`;
        try {
            const currentRequests = (await redisManager.getCache(key)) || 0;
            if (currentRequests >= limit) {
                return true;
            }
            await redisManager.setCache(key, currentRequests + 1, windowInSeconds);
            return false;
        } catch (error) {
            logger.error('[RateLimiter Error]', error);
            return false;
        }
    }
}

module.exports = RateLimiter;
