const express = require('express');
const { logger } = require('../../src/managers/logger');
const os = require('os');
const path = require('path');
const RateLimiter = require('../utils/rateLimiter');
const cors = require('cors');
const { EmbedBuilder } = require('discord.js');
const UserProfile = require('../models/UserProfile');
const GuildSettings = require('../models/GuildSettings');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;

module.exports = (client) => {


    // ==========================================
    // 1. SERVER WEBHOOK (PORT 3064)
    // ==========================================
    const webhookApp = express();
    webhookApp.use(express.json());
    webhookApp.use(express.urlencoded({ extended: true }));

    webhookApp.post('/api/webhook/vote', async (req, res) => {
        const auth = req.headers.authorization;
        if (process.env.WEBHOOK_AUTH_VOTE && auth !== process.env.WEBHOOK_AUTH_VOTE) return res.status(401).send('Unauthorized');
        const userId = req.body.user;
        if (!userId) return res.status(400).send('Missing user ID');

        try {
            const { sequelize } = require('../managers/dbManager');
            await sequelize.transaction(async (t) => {
                let [profile] = await UserProfile.findOrCreate({ 
                    where: { userId },
                    transaction: t,
                    lock: t.LOCK.UPDATE
                });
                
                const newExpiry = new Date();
                if (profile.isPremium && profile.premiumUntil && profile.premiumUntil > new Date()) {
                    newExpiry.setTime(profile.premiumUntil.getTime() + (12 * 60 * 60 * 1000));
                } else {
                    newExpiry.setTime(newExpiry.getTime() + (12 * 60 * 60 * 1000));
                }
                profile.isPremium = true;
                profile.premiumUntil = newExpiry;
                await profile.save({ transaction: t });

                try {
                    const userObj = await client.users.fetch(userId);
                    const embed = new EmbedBuilder()
                        .setColor('#FFD700')
                        .setTitle('🎉 Terima Kasih Telah Memilih Naura!')
                        .setDescription(`Hai ${userObj.username}! Terima kasih atas VOTE kamu di server list hari ini.\n\nSebagai bentuk apresiasi, Naura telah memberikan fasilitas **TRIAL V.I.P PREMIUM selama 12 Jam** untukmu!\n\n⏳ **Status Aktif Sampai:** <t:${Math.floor(newExpiry.getTime() / 1000)}:R>`)
                        .setFooter({ text: 'Naura Hoshino Auto-Vote System' });
                    await userObj.send({ embeds: [embed] });
                } catch (e) {
                    logger.info(`[WEBHOOK VOTE] Gagal DM user ${userId}: DM Tertutup`);
                }
            });
            res.status(200).send('Vote recorded successfully');
        } catch (error) {
            logger.error('[WEBHOOK ERROR] Vote:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    webhookApp.post('/api/webhook/saweria', async (req, res) => {
        const token = req.headers['saweria-token'] || req.headers['authorization'];
        if (process.env.WEBHOOK_AUTH_SAWERIA && token !== process.env.WEBHOOK_AUTH_SAWERIA) return res.status(401).send('Unauthorized');

        const amount = req.body.amount || req.body.total_amount || 0;
        const message = req.body.message || '';
        const donator_name = req.body.donator_name || req.body.donator || 'Seseorang';
        if (!amount || !message) return res.status(400).send('Bad Request: Missing Amount or Message');

        const idMatch = message.match(/\b\d{17,19}\b/);
        if (!idMatch) return res.status(200).send('OK: No Discord ID found in message');

        const userId = idMatch[0];
        let daysToAdd = 0; let tierName = '';
        if (amount >= 75000) { daysToAdd = 365; tierName = '👑 Naura Bestie (1 Tahun)'; } 
        else if (amount >= 50000) { daysToAdd = 180; tierName = '💫 Naura Friends (6 Bulan)'; } 
        else if (amount >= 35000) { daysToAdd = 30; tierName = '🌟 Naura Supporter (1 Bulan)'; } 
        else return res.status(200).send('OK: Amount below premium tier');

        try {
            const { sequelize } = require('../managers/dbManager');
            await sequelize.transaction(async (t) => {
                let [profile] = await UserProfile.findOrCreate({ 
                    where: { userId },
                    transaction: t,
                    lock: t.LOCK.UPDATE
                });
                
                const newExpiry = new Date();
                if (profile.isPremium && profile.premiumUntil && profile.premiumUntil > new Date()) {
                    newExpiry.setTime(profile.premiumUntil.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
                } else {
                    newExpiry.setTime(newExpiry.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
                }
                profile.isPremium = true;
                profile.premiumUntil = newExpiry;
                await profile.save({ transaction: t });

                try {
                    const userObj = await client.users.fetch(userId);
                    const embed = new EmbedBuilder()
                        .setColor('#FFD700')
                        .setTitle('💖 Pembayaran V.I.P Terkonfirmasi!')
                        .setDescription(`Terima kasih **${donator_name}** atas dukungan donasinya (Rp ${amount.toLocaleString('id-ID')})!\n\nStatus **Premium Naura** kamu telah otomatis diaktifkan oleh sistem.\n\n📦 **Paket Aktif:** ${tierName}\n⏳ **Berlaku Sampai:** <t:${Math.floor(newExpiry.getTime() / 1000)}:F>`);
                    await userObj.send({ embeds: [embed] });
                } catch (e) {
                    logger.info(`[WEBHOOK SAWERIA] Gagal DM user ${userId}: DM Tertutup`);
                }
            });
            res.status(200).send('Donation Processed Successfully');
        } catch (error) {
            logger.error('[WEBHOOK ERROR] Saweria:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    webhookApp.listen(3064, () => {
        console.log(`\x1b[45m\x1b[37m 💸 WEBHOOK \x1b[0m \x1b[35mServer Webhook berjalan di Port: 3064\x1b[0m`);
    });

    // ==========================================
    // 2. SERVER API & DATABASE (PORT 3053) - DINONAKTIFKAN
    // ==========================================
    /* Port 3053 dimatikan untuk menghindari masalah CORS/Firewall. 
       Endpoint digabung ke webApp (Port 3070) di bawah ini. */

    // ==========================================
    // 3. SERVER WEB MAIN UI (PORT 3070)
    // ==========================================
    const helmet = require('helmet'); // Membutuhkan npm install helmet
    const webApp = express();
    // webApp.use(helmet()); // Anti XSS & Clickjacking (Disable jika menyebabkan issue rendering view)
    webApp.use(express.json());

    // ==========================================
    // POST /api/settings
    // ==========================================
    webApp.post('/api/settings', async (req, res) => {
        try {
            const { guildId, prefix, automod, twentyFourSeven, verbaSlug1, verbaSlug2 } = req.body;
            if (!guildId) return res.status(400).json({ success: false, message: 'Guild ID is required' });

            const GuildSettings = require('../models/GuildSettings');
            let [settingsModel] = await GuildSettings.findOrCreate({ where: { guildId } });

            let settings = settingsModel.settings || {};

            if (prefix !== undefined) settings.prefix = prefix;
            if (automod !== undefined) settings.automod = (automod === 'true' || automod === true);
            if (twentyFourSeven !== undefined) settings.twentyFourSeven = (twentyFourSeven === 'true' || twentyFourSeven === true);

            if (!settings.ai) settings.ai = {};
            if (verbaSlug1 !== undefined) settings.ai.verbaSlug1 = verbaSlug1;
            if (verbaSlug2 !== undefined) settings.ai.verbaSlug2 = verbaSlug2;

            settingsModel.settings = settings;
            settingsModel.changed('settings', true);
            await settingsModel.save();

            res.json({ success: true, message: 'Pengaturan berhasil disimpan!' });
        } catch (e) {
            console.error(e);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    });

    const webPort = process.env.PORT || 3070;
    
    webApp.use(cors());
    webApp.use(express.json());
    webApp.use(express.urlencoded({ extended: true }));
    
    // 🔥 DAFTARKAN FOLDER PUBLIC DAN ASSETS
    webApp.use(express.static(path.join(__dirname, 'public')));
    webApp.use('/assets', express.static(path.join(__dirname, 'assets')));


    const authMiddleware = (req, res, next) => {
        if (req.isAuthenticated()) return next();
        res.redirect('/auth/discord');
    };


    webApp.use(session({
        secret: process.env.SESSION_SECRET || 'naura_secret',
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 1000 * 60 * 60 * 24 }
    }));
    webApp.use(passport.initialize());
    webApp.use(passport.session());
    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done) => done(null, obj));

    if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) {
        console.log('\x1b[33m[⚠️ WARNING]\x1b[0m DISCORD_CLIENT_ID atau SECRET belum diatur di .env! Fitur Login Web UI dinonaktifkan.');
    } else {
        passport.use(new DiscordStrategy({
            clientID: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            callbackURL: process.env.DISCORD_CALLBACK_URL,
            scope: ['identify', 'guilds']
        }, (accessToken, refreshToken, profile, done) => done(null, profile)));

        webApp.get('/auth/discord', passport.authenticate('discord'));
        webApp.get('/auth/discord/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => res.redirect('/'));
    }

    webApp.get('/auth/logout', (req, res) => {
        req.logout(() => res.redirect('/'));
    });

    webApp.get('/api/me', async (req, res) => {
        if (req.isAuthenticated()) {
            try {
                let [profile] = await UserProfile.findOrCreate({ where: { userId: req.user.id } });
                const OWNER_ID = '795241173009825853';
                const env = require('../config/env');
        const isOwner = env.OWNER_IDS.includes(req.user.id);
                res.json({ loggedIn: true, user: req.user, db: profile, isOwner: isOwner });
            } catch (err) {
                logger.error('Error fetching user DB for /api/me:', err);
                res.json({ loggedIn: true, user: req.user, db: null });
            }
        } else {
            res.json({ loggedIn: false });
        }
    });

    // 👇 TAMBAHKAN ENDPOINT STATS DI SINI 👇
    webApp.get('/api/stats', async (req, res) => {
        const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const usedRam = ((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2);

        let totalRegisteredUsers = 0;
        try {
             totalRegisteredUsers = await UserProfile.count();
        } catch(e) {}

        res.json({
            botName: client.user ? client.user.username : 'Naura Hoshino',
            avatar: client.user ? client.user.displayAvatarURL({ extension: 'png', size: 512 }) : '/assets/naura.png',
            servers: client.guilds.cache.size,
            users: totalRegisteredUsers || client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
            ping: client.ws.ping,
            uptime: formatUptime(client.uptime)
        });
    });

    webApp.get('/api/economy_stats', async (req, res) => {
        try {
            const redisManager = require('../managers/redisManager');
            let cached = null;
            if (redisManager.client && redisManager.client.isReady) {
                cached = await redisManager.getCache('economy_stats_global');
            }
            if (cached) return res.json(cached);

            const users = await UserProfile.findAll({ attributes: ['economy_wallet', 'economy_bank'] });
            let totalWallet = 0;
            let totalBank = 0;
            users.forEach(u => {
                totalWallet += (u.economy_wallet || 0);
                totalBank += (u.economy_bank || 0);
            });
            const stats = {
                total_circulation: totalWallet + totalBank,
                total_wallet: totalWallet,
                total_bank: totalBank,
                total_users: users.length
            };
            if (redisManager.client && redisManager.client.isReady) {
                await redisManager.setCache('economy_stats_global', stats, 300); // 5 menit
            }
            res.json(stats);
        } catch (error) {
            res.status(500).json({ error: 'Gagal memuat statistik ekonomi' });
        }
    });
    // 👆 ENDPOINT SELESAI DITAMBAHKAN 👆

    webApp.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
    webApp.get('/leaderboard', (req, res) => res.sendFile(path.join(__dirname, 'views', 'leaderboard.html')));
    webApp.get('/settings', authMiddleware, (req, res) => res.sendFile(path.join(__dirname, 'views', 'settings.html')));
    webApp.get('/welcomer', authMiddleware, (req, res) => res.sendFile(path.join(__dirname, 'views', 'welcomer.html')));

    webApp.get('/api/leaderboard', async (req, res) => {
        try {
            const redisManager = require('../managers/redisManager');
            let topUsers = null;
            if (redisManager.client && redisManager.client.isReady) {
                topUsers = await redisManager.getCache('leaderboard_top10');
            }
            if (!topUsers) {
                topUsers = await UserProfile.findAll({
                    attributes: ['userId', 'economy_wallet', 'leveling_level', 'minigame_triviaScore', 'isPremium'],
                    order: [['economy_wallet', 'DESC']],
                    limit: 10
                });
                if (redisManager.client && redisManager.client.isReady) {
                    await redisManager.setCache('leaderboard_top10', topUsers, 60); // Cache for 60 seconds
                }
            }

            // Fetch user info from Discord to map names
            const lbData = await Promise.all(topUsers.map(async (u) => {
                let name = 'Unknown User';
                try {
                    const dUser = await client.users.fetch(u.userId);
                    name = dUser.username;
                } catch(e) {}

                const env = require('../config/env');
                let isOwner = env.OWNER_IDS.includes(u.userId);

                return {
                    userId: u.userId,
                    name: name,
                    wallet: u.economy_wallet,
                    level: u.leveling_level || 1,
                    points: u.minigame_triviaScore || 0,
                    isPremium: u.isPremium,
                    isOwner: isOwner
                };
            }));

            res.json(lbData);
        } catch (error) {
            logger.error('Leaderboard error:', error);
            res.status(500).json({ error: 'Gagal memuat leaderboard' });
        }
    });

    // ==========================================
    // 👑 OWNER ONLY API (GOD MODE)
    // ==========================================
    const checkOwner = (req, res, next) => {
        if (!req.isAuthenticated()) return res.status(401).json({ error: 'Belum login' });
        const isOwner = req.user.id === OWNER_ID || (process.env.OWNER_IDS && process.env.OWNER_IDS.includes(req.user.id));
        if (!isOwner) return res.status(403).json({ error: 'Akses ditolak. Area ini khusus Owner.' });
        next();
    };

    webApp.post('/api/owner/update_user', checkOwner, async (req, res) => {
        const { targetId, wallet, bank, isPremium } = req.body;
        try {
            let [user] = await UserProfile.findOrCreate({ where: { userId: targetId } });
            user.economy_wallet = wallet !== undefined ? wallet : user.economy_wallet;
            user.economy_bank = bank !== undefined ? bank : user.economy_bank;
            if (isPremium !== undefined) {
                user.isPremium = isPremium;
                if (isPremium) {
                    const expiry = new Date();
                    expiry.setFullYear(expiry.getFullYear() + 100);
                    user.premiumUntil = expiry;
                } else {
                    user.premiumUntil = null;
                }
            }
            await user.save();
            res.json({ success: true, message: `Data ${targetId} berhasil dimanipulasi.` });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });



    webApp.get('/api/owner/stats', checkOwner, async (req, res) => {
        try {
            const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
            const usedRam = ((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2);

            res.json({
                ram: `${usedRam}GB / ${totalRam}GB`,
                cpu: os.cpus()[0].model,
                os: os.type() + ' ' + os.release()
            });
        } catch(e) {
            res.status(500).json({ error: 'Failed to fetch owner stats' });
        }
    });

    webApp.post('/api/owner/announcement', checkOwner, async (req, res) => {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message cannot be empty.' });
        try {
            // Find one AI chat channel per guild
            let sentCount = 0;
            const settings = await GuildSettings.findAll();
            for (const setting of settings) {
                if (setting.settings && setting.settings.verbaSlug1) {
                    try {
                        const channel = await client.channels.fetch(setting.settings.verbaSlug1);
                        if (channel && channel.isTextBased()) {
                            await channel.send(`📢 **Naura Announcement**\n${message}`);
                            sentCount++;
                        }
                    } catch (err) {
                        // Ignore errors sending to specific channels
                    }
                }
            }
            res.json({ success: true, message: `Berhasil mengirim ke ${sentCount} server.` });
        } catch (e) {
            logger.error('Announcement error:', e);
            res.status(500).json({ error: 'Terjadi kesalahan sistem.' });
        }
    });

    webApp.post('/api/owner/restart', checkOwner, (req, res) => {
        res.json({ success: true, message: 'Sistem sedang dimatikan dan akan di-restart...' });
        setTimeout(() => { process.exit(0); }, 2000);
    });

    const http = require('http');
    const { Server } = require('socket.io');
    const webServer = http.createServer(webApp);
    const io = new Server(webServer, { cors: { origin: '*' } });
    
    // Simpan instance IO ke client agar bisa dipakai dari file luar (seperti naura.js)
    client.dashboardIo = io;

    // Broadcast Real-time Stats setiap 3 detik
    setInterval(() => {
        if (!client.isReady()) return;
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const ping = client.ws.ping;
        const guilds = client.guilds.cache.size;
        const users = client.users.cache.size;

        io.emit('stats_update', {
            ramUsed: (usedMem / 1024 / 1024).toFixed(2),
            ramTotal: (totalMem / 1024 / 1024).toFixed(2),
            ping: ping,
            guilds: guilds,
            users: users
        });
    }, 3000);

    io.on('connection', (socket) => {
        logger.info(`[SOCKET] User connected to Dashboard: ${socket.id}`);

        socket.on('chat_message', async (data) => {
            const isLimited = await RateLimiter.isRateLimited(socket.id, 'dashboard_chat', 5, 10);
            if (isLimited) return socket.emit('chat_response', { reply: 'Tolong jangan spam ya! Tunggu beberapa detik.' });

            try {
                const response = await fetch('https://api.verba.ink/v1/response', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${require('../config/env').VERBA_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        character: process.env.VERBA_CHARACTER_SLUG || "naura",
                        messages: [
                            { role: "system", content: "Kamu adalah Naura Hoshino, asisten virtual cerdas yang bisa dihubungi melalui layar chatting dashboard. Bicaralah selayaknya manusia yang ramah, sedikit playful, dan menggunakan bahasa Indonesia yang baik." },
                            { role: "user", content: data.message }
                        ]
                    })
                });

                if (!response.ok) throw new Error('Verba API Error');
                const result = await response.json();
                socket.emit('chat_response', { reply: result.choices[0].message.content });
            } catch (error) {
                logger.error("[SOCKET CHAT ERROR]", error);
                socket.emit('chat_response', { reply: 'Maaf, sistem AI Naura sedang gangguan saat ini.' });
            }
        });

        socket.on('disconnect', () => {
            // User disconnected
        });
    });

    webServer.listen(webPort, () => {
        console.log(`\x1b[44m\x1b[37m 🌐 WEB MAIN \x1b[0m \x1b[34mWeb UI berjalan di http://localhost:${webPort}\x1b[0m`);
    });
};

function formatUptime(ms) {
    if (ms < 60000) return 'Baru saja mulai';
    let totalSeconds = (ms / 1000);
    let days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}