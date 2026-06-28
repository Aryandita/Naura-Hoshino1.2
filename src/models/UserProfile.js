const { DataTypes } = require('sequelize');
const { sequelize } = require('../managers/dbManager');

const UserProfile = sequelize.define('UserProfile', {
    userId: { 
        type: DataTypes.STRING, 
        allowNull: false, 
        primaryKey: true 
    },
    afk_mentions: { type: DataTypes.JSON, defaultValue: [] },
    afk_reason: { type: DataTypes.STRING, allowNull: true },
    afk_timestamp: { type: DataTypes.DATE, allowNull: true },
    
    // --- ECONOMY ---
    economy_wallet: { type: DataTypes.INTEGER, defaultValue: 0 },
    economy_bank: { type: DataTypes.INTEGER, defaultValue: 0 },
    economy_lastInterest: { type: DataTypes.DATE, allowNull: true },
    
    // --- DATA FLEKSIBEL ---
    inventory: { type: DataTypes.JSON, defaultValue: [] },
    tool_pickaxeLevel: { type: DataTypes.INTEGER, defaultValue: 1 },
    tool_pickaxeDurability: { type: DataTypes.INTEGER, defaultValue: 100 },
    tool_axeLevel: { type: DataTypes.INTEGER, defaultValue: 1 },
    tool_axeDurability: { type: DataTypes.INTEGER, defaultValue: 100 },
    tool_fishingRodLevel: { type: DataTypes.INTEGER, defaultValue: 1 },
    tool_fishingRodDurability: { type: DataTypes.INTEGER, defaultValue: 100 },
    weapon_level: { type: DataTypes.INTEGER, defaultValue: 1 },
    weapon_element: { type: DataTypes.STRING, defaultValue: 'netral' },
    dungeon_floor: { type: DataTypes.INTEGER, defaultValue: 1 },

    // --- SOCIAL MEDIA ---
    social_youtube: { type: DataTypes.STRING, allowNull: true },
    social_instagram: { type: DataTypes.STRING, allowNull: true },
    social_x: { type: DataTypes.STRING, allowNull: true },
    social_facebook: { type: DataTypes.STRING, allowNull: true },

    cooldowns: { type: DataTypes.JSON, defaultValue: {} },
    
    // --- MINIGAMES ---
    minigame_mathScore: { type: DataTypes.INTEGER, defaultValue: 0 },
    minigame_triviaScore: { type: DataTypes.INTEGER, defaultValue: 0 },
    minigame_rpsWin: { type: DataTypes.INTEGER, defaultValue: 0 },
    minigame_tttWin: { type: DataTypes.INTEGER, defaultValue: 0 },
    minigame_wordleWin: { type: DataTypes.INTEGER, defaultValue: 0 },
    minigame_duelScore: { type: DataTypes.INTEGER, defaultValue: 0 },

    language: { type: DataTypes.STRING, defaultValue: 'id' },
    isPremium: { type: DataTypes.BOOLEAN, defaultValue: false },
    premiumUntil: { type: DataTypes.DATE, allowNull: true },

    minecraft_ign: { type: DataTypes.STRING, allowNull: true },
    minecraft_playtime: { type: DataTypes.INTEGER, defaultValue: 0 },
    
    // --- MUSIC PROFILE ---
    music_tracksListened: { type: DataTypes.INTEGER, defaultValue: 0 },
    music_totalDurationMs: { type: DataTypes.BIGINT, defaultValue: 0 },
    music_favoriteGenre: { type: DataTypes.STRING, defaultValue: 'Belum Terdeteksi' },
    music_lastListened: { type: DataTypes.STRING, defaultValue: 'Belum ada lagu' },
    music_playlist: { type: DataTypes.JSON, defaultValue: [] },
    
    // ==========================================
    // 📊 DATA ANALITIK CANVAS (YANG SEBELUMNYA HILANG)
    // ==========================================
    music_topTrack: { type: DataTypes.JSON, defaultValue: { name: 'Belum ada data', durationMs: 0 } },
    music_topFriend: { type: DataTypes.JSON, defaultValue: { name: 'Belum mabar', durationMs: 0 } },
    music_topServer: { type: DataTypes.JSON, defaultValue: { name: 'Belum ada server', durationMs: 0 } },
    music_trackingData: { type: DataTypes.JSON, defaultValue: { tracks: {}, friends: {}, servers: {} } },
    
    // --- LEVELING ---
    leveling_xp: { type: DataTypes.INTEGER, defaultValue: 0 },
    leveling_level: { type: DataTypes.INTEGER, defaultValue: 1 },
    leveling_lastXp: { type: DataTypes.DATE, allowNull: true },

    // --- PREFERENSI NOTIFIKASI ---
    dailyNotify: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: true },
}, {
    tableName: 'user_profiles',
    timestamps: false 
});

module.exports = UserProfile;