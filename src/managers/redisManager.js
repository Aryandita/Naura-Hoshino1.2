const { createClient } = require('redis');
const { logger } = require('../../src/managers/logger');

class RedisManager {
    constructor() {
        this.client = createClient({
            url: require("../config/env").REDIS_URL
        });

        this.client.on('error', err => console.log('\x1b[31m[🔴 REDIS]\x1b[0m Error:', err));
        this.client.on('connect', () => console.log('\x1b[34m[📦 REDIS]\x1b[0m Terhubung ke Redis Cache System.'));
    }

    async connect() {
        await this.client.connect();
    }

    async setCache(key, data, expirationInSeconds = 3600) {
        try {
            await this.client.setEx(key, expirationInSeconds, JSON.stringify(data));
        } catch (error) {
            logger.error('\x1b[31m[REDIS ERROR]\x1b[0m Gagal menyimpan cache:', error);
        }
    }

    async getCache(key) {
        try {
            const data = await this.client.get(key);
            if (data) return JSON.parse(data);
            return null;
        } catch (error) {
            logger.error('\x1b[31m[REDIS ERROR]\x1b[0m Gagal membaca cache:', error);
            return null;
        }
    }

    async deleteCache(key) {
        await this.client.del(key);
    }

    // FUNGSI BARU: Mempermudah integrasi cache ke sistem lain tanpa kode redundan
    async getOrSetCache(key, expirationInSeconds, fetchFunction) {
        try {
            const cachedData = await this.getCache(key);
            if (cachedData) return cachedData;

            const freshData = await fetchFunction();
            if (freshData) {
                await this.setCache(key, freshData, expirationInSeconds);
            }
            return freshData;
        } catch (error) {
            logger.error('\x1b[31m[REDIS ERROR]\x1b[0m Gagal eksekusi getOrSetCache:', error);
            return await fetchFunction(); // Fallback langsung ke database jika redis bermasalah
        }
    }
}

module.exports = new RedisManager();
