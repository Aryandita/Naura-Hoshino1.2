// src/managers/cacheManager.js
const redisManager = require('./redisManager');
const { logger } = require('../../src/managers/logger');
const UserProfile = require('../models/UserProfile');

/**
 * CacheManager: Read-Through and Write-Behind Caching Layer
 * Bertujuan untuk mengurangi beban database utama dengan menjadikan Redis
 * sebagai jembatan utama untuk Read dan Write data pengguna yang sering berubah.
 */
class CacheManager {

    constructor() {
        this.writeQueue = new Map();
        this.isProcessingQueue = false;
    }

    _addToWriteQueue(userId, updateData) {
        if (!this.writeQueue.has(userId)) {
            this.writeQueue.set(userId, {});
        }
        const currentUserData = this.writeQueue.get(userId);
        Object.assign(currentUserData, updateData);

        if (!this.isProcessingQueue) {
            this._processWriteQueue();
        }
    }

    async _processWriteQueue() {
        if (this.writeQueue.size === 0) {
            this.isProcessingQueue = false;
            return;
        }

        this.isProcessingQueue = true;
        const entries = Array.from(this.writeQueue.entries());
        this.writeQueue.clear();

        for (const [userId, updateData] of entries) {
            await this._addToWriteQueue(userId, updateData);
        }

        // Process any new items added while we were processing
        this._processWriteQueue();
    }

    /**
     * Mengambil UserProfile dari Cache. Jika tidak ada, fetch dari DB dan set ke Cache.
     * @param {string} userId - ID Discord User
     * @returns {Promise<Object>} Data profil pengguna (JSON)
     */
    async getUserProfile(userId) {
        if (!userId) return null;
        const cacheKey = `user:profile:${userId}`;

        try {
            // 1. Coba ambil dari Redis
            const cachedProfile = await redisManager.getCache(cacheKey);
            if (cachedProfile) return cachedProfile;

            // 2. Jika tidak ada di Redis, ambil dari Database Utama
            const dbProfile = await UserProfile.findByPk(userId);
            if (dbProfile) {
                const profileData = dbProfile.toJSON();
                // Simpan ke cache selama 1 jam (3600 detik)
                await redisManager.setCache(cacheKey, profileData, 3600);
                return profileData;
            }

            return null; // User belum terdaftar di DB
        } catch (error) {
            logger.error('[CacheManager] Error getUserProfile:', error.message);
            // Fallback: Jika redis down, tembak DB langsung tanpa error
            try {
                const dbProfile = await UserProfile.findByPk(userId);
                return dbProfile ? dbProfile.toJSON() : null;
            } catch (dbError) {
                return null;
            }
        }
    }

    /**
     * Menyimpan/Memperbarui UserProfile. Update ke Cache langsung (cepat),
     * lalu jalankan async update ke Database Utama di background (Write-Behind).
     * @param {string} userId - ID Discord User
     * @param {Object} updateData - Key/Value pasang untuk diupdate
     * @returns {Promise<boolean>} Status keberhasilan cache
     */
    async updateUserProfile(userId, updateData) {
        if (!userId || !updateData) return false;
        const cacheKey = `user:profile:${userId}`;

        try {
            // 1. Dapatkan profile saat ini (dari cache atau DB)
            let profile = await this.getUserProfile(userId);

            if (!profile) {
                // Jika belum ada, buat baru di DB dulu untuk memastikan konsistensi
                try {
                     const [newDbProfile] = await UserProfile.findOrCreate({ where: { userId }, defaults: updateData });
                     profile = newDbProfile.toJSON();
                } catch(e) {
                     return false;
                }
            }

            // 2. Gabungkan data baru ke profile
            Object.assign(profile, updateData);

            // 3. Update Redis Cache (Immediate return)
            await redisManager.setCache(cacheKey, profile, 3600);

            // 4. Update Database di Background (Write-Behind / Fire-and-Forget)
            this._addToWriteQueue(userId, updateData);

            return true;
        } catch (error) {
             logger.error('[CacheManager] Error updateUserProfile:', error.message);
             // Fallback langsung tembak DB jika redis fail
             this._addToWriteQueue(userId, updateData);
             return false;
        }
    }

    /**
     * Internal: Mengeksekusi update ke Database Utama tanpa memblokir thread (Fire & Forget).
     */
    async _asyncDbUpdate(userId, updateData) {
        try {
            await UserProfile.update(updateData, { where: { userId } });
        } catch (error) {
            logger.error(`[CacheManager] Background DB Update Failed for ${userId}:`, error.message);
        }
    }
}

module.exports = new CacheManager();
