// src/managers/dbManager.js
const { Sequelize } = require('sequelize');
const env = require('../config/env');
const redisManager = require('./redisManager');
const { logger } = require('../../src/managers/logger');

// ==========================================
// 1. INISIALISASI KONEKSI DATABASE
// ==========================================
const hasMySQLConfig = env.DB_NAME && env.DB_USER && env.DB_HOST;

const sequelize = hasMySQLConfig
    ? new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASS, {
          host: env.DB_HOST,
          port: env.DB_PORT,
          dialect: 'mysql',
          logging: false,
          dialectOptions: { connectTimeout: 120000 },
          pool: { max: 100, min: 5, acquire: 120000, idle: 15000, evict: 5000 }
      })
    : new Sequelize({
          dialect: 'sqlite',
          storage: './naura_fallback.sqlite',
          logging: false
      });

// ==========================================
// 2. EKSPOR SEQUELIZE TERLEBIH DAHULU (SANGAT KRUSIAL)
// ==========================================
module.exports = { sequelize };

// ==========================================
// 3. IMPORT MODEL
// ==========================================
const UserProfile = require('../models/UserProfile');
const UserSurvival = require('../models/UserSurvival');
const UserPet = require('../models/UserPet');
const UserNPC = require('../models/UserNPC');
const UserChild = require('../models/UserChild');
const GuildSettings = require('../models/GuildSettings');
const ModMail = require('../models/ModMail');
const Giveaway = require('../models/Giveaway');
const StickyRole = require('../models/StickyRole');
const UserFarm = require('../models/UserFarm');
const CanvasAsset = require('../models/CanvasAsset');
const GameItem = require('../models/GameItem');
const UserCosmetic = require('../models/UserCosmetic');
const CryptoMarket = require('../models/CryptoMarket');
const UserCrypto = require('../models/UserCrypto');
const PremiumVoucher = require('../models/PremiumVoucher');
const UserReminder = require('../models/UserReminder');
const UserQuest = require('../models/UserQuest');

// ==========================================
// 4. SETUP RELASI (ASSOCIATIONS)
// ==========================================
UserProfile.hasOne(UserSurvival, { foreignKey: 'userId', as: 'survival' });
UserSurvival.belongsTo(UserProfile, { foreignKey: 'userId' });

UserProfile.hasMany(UserPet, { foreignKey: 'userId', as: 'pets' });
UserPet.belongsTo(UserProfile, { foreignKey: 'userId' });

UserProfile.hasMany(UserNPC, { foreignKey: 'userId', as: 'npc_relations' });
UserNPC.belongsTo(UserProfile, { foreignKey: 'userId' });

UserProfile.hasMany(UserChild, { foreignKey: 'userId', as: 'children' });
UserChild.belongsTo(UserProfile, { foreignKey: 'userId' });

UserProfile.hasMany(UserFarm, { foreignKey: 'userId', as: 'farms' });
UserFarm.belongsTo(UserProfile, { foreignKey: 'userId' });

UserProfile.hasMany(UserCosmetic, { foreignKey: 'userId', as: 'cosmetics' });
UserCosmetic.belongsTo(UserProfile, { foreignKey: 'userId' });

CanvasAsset.hasMany(UserCosmetic, { foreignKey: 'assetId', as: 'userCosmetics' });
UserCosmetic.belongsTo(CanvasAsset, { foreignKey: 'assetId', as: 'asset' });

// ==========================================
// 5. FUNGSI KONEKSI DAN SINKRONISASI TABEL
// ==========================================
const connectToDatabase = async () => {
    try {
        await sequelize.authenticate();
        // Mencegah penghapusan kolom tak disengaja di production
        if (process.env.NODE_ENV === 'production') {
            await sequelize.sync({ alter: false }); // Biarkan migrator khusus yang merubah tabel
            logger.info('Database terhubung (Production Safe-Sync mode).');
        } else {
            // Gunakan alter: true dengan hati-hati hanya untuk server Development
            await sequelize.sync({ alter: { drop: false } });
            logger.info('Database disinkronkan (Development mode, Drop prevented).');
        }

        try {
            await sequelize.query('ALTER TABLE UserLevelings ADD COLUMN mannersPoint INT DEFAULT 100;');
        } catch (e) {
            /* Abaikan jika sudah ada */
        }
        try {
            await sequelize.query('ALTER TABLE user_profiles ADD COLUMN dailyNotify TINYINT(1) DEFAULT 1;');
        } catch (e) {
            /* Abaikan jika sudah ada */
        }


        try {
            const backgroundCount = await CanvasAsset.count();
            if (backgroundCount === 0) {
                await CanvasAsset.bulkCreate([
                    { name: 'Abstract Blue', type: 'background', url: 'https://i.imgur.com/7b1YjK3.png', price: 100, isPremiumOnly: false },
                    { name: 'Neon Cyberpunk', type: 'background', url: 'https://i.imgur.com/k4QYjK3.png', price: 500, isPremiumOnly: false },
                    { name: 'Gold VIP', type: 'background', url: 'https://i.imgur.com/a4QYjK3.png', price: 0, isPremiumOnly: true },
                    { name: 'Silver Frame', type: 'border', url: 'https://i.imgur.com/c4QYjK3.png', price: 200, isPremiumOnly: false }
                ]);
                logger.db('Default Canvas Assets seeded.');
            }
        } catch (e) {
            logger.error('[DB] Failed to seed Canvas Assets', e);
        }


        try {
            const itemCount = await GameItem.count();
            if (itemCount === 0) {
                const staticItems = require('../../plugin/survival/items');
                const bulkData = staticItems.map(item => {
                    const { id, name, description, price, sellPrice, category, rarity, ...attributes } = item;
                    return {
                        id,
                        name,
                        description: description || '',
                        price: price || 0,
                        sellPrice: sellPrice || 0,
                        category: category || 'material',
                        rarity: rarity || 'Biasa',
                        attributes: attributes || {}
                    };
                });
                await GameItem.bulkCreate(bulkData, { ignoreDuplicates: true });
                logger.db('Default Game Items seeded.');
            }
        } catch (e) {
            logger.error('[DB] Failed to seed Game Items', e);
        }

        if (!hasMySQLConfig) {
            logger.warn(
                '\n\x1b[43m\x1b[30m ⚠️ FALLBACK DB \x1b[0m \x1b[33mMenggunakan SQLite lokal sebagai Fallback sementara karena kredensial MySQL tidak ditemukan.\x1b[0m'
            );
        } else {
            const { syncFallbackToMySQL } = require('./dbMigrator');
            await syncFallbackToMySQL(sequelize);
        }

        return true;
    } catch (error) {
        logger.error(
            '\n\x1b[41m\x1b[37m 💥 DATABASE ERROR \x1b[0m \x1b[31mKoneksi MySQL ditolak atau terputus:\x1b[0m'
        );
        logger.error(error.message);
        logger.error(
            '\x1b[33mBot akan terus berjalan dan data akan dicache melalui sistem Fallback sementara.\x1b[0m'
        );
        return false;
    }
};

module.exports.connectToDatabase = connectToDatabase;

// ==========================================
// 6. ANTI-SLEEP & AUTO-RECONNECT MECHANISM
// ==========================================
let isReconnecting = false;
setInterval(async () => {
    try {
        await sequelize.query('SELECT 1');
    } catch (err) {
        if (isReconnecting) return;
        isReconnecting = true;
        // PERBAIKAN: Indikator DB Terputus yang jauh lebih mencolok
        logger.error('\n\x1b[41m\x1b[37m 🚨 DB ALERT \x1b[0m \x1b[31mKONEKSI MYSQL TERPUTUS!\x1b[0m');
        logger.error(`\x1b[31mDetail Error: ${err.message}\x1b[0m`);
        logger.error('\x1b[33m[DB MONITOR] Sistem mencoba melakukan reconnect di latar belakang...\x1b[0m\n');

        try {
            await sequelize.authenticate();
            logger.success(
                '\x1b[42m\x1b[30m ✨ RECONNECTED \x1b[0m \x1b[32mBerhasil terhubung kembali ke database MySQL.\x1b[0m'
            );

            if (hasMySQLConfig) {
                const { syncFallbackToMySQL } = require('./dbMigrator');
                await syncFallbackToMySQL(sequelize);
            }
        } catch (reconnectErr) {
            logger.error(
                '\x1b[41m\x1b[37m 💥 FATAL \x1b[0m \x1b[31mGagal reconnect: ' + reconnectErr.message + '\x1b[0m'
            );
        } finally {
            isReconnecting = false;
        }
    }
}, 60000 * 15);
