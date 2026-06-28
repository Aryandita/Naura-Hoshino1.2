const { Events } = require('discord.js');
const { logger } = require('../../src/managers/logger');
const ui = require('../config/ui');
const botActivity = require('../config/bot-activity');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`\x1b[40m\x1b[37m[🤖 SYSTEM]\x1b[0m Naura Hoshino Online! Terhubung sebagai \x1b[36m${client.user.tag}\x1b[0m`);

        // Initialize the music manager jika file dan fungsi tersedia
        if (client.musicManager && typeof client.musicManager.initialize === 'function') {
            client.musicManager.initialize();
            console.log('\x1b[40m\x1b[37m[🎵 MUSIC]\x1b[0m Music Manager siap!');
        }

        // ==========================================
        // 🔄 ROTASI STATUS BOT (DARI BOT-ACTIVITY.JS)
        // ==========================================
        const activities = botActivity.activities;

        if (activities && activities.length > 0) {
            let currentIndex = 0;

            setInterval(() => {
                const activity = activities[currentIndex];
                client.user.setPresence({
                    activities: [{
                        name: activity.name,
                        state: activity.state || null,
                        type: activity.type,
                        url: activity.url || null
                    }],
                    status: activity.status || 'online'
                });

                currentIndex = (currentIndex + 1) % activities.length;
            }, 15000); // Berganti setiap 15 detik

            console.log('\x1b[40m\x1b[37m[✨ PRESENCE]\x1b[0m Rotasi status Naura berhasil diaktifkan.');
        } else {
            console.log('\x1b[40m\x1b[37m[⚠️ PRESENCE]\x1b[0m Tidak ada daftar status yang ditemukan di konfigurasi bot-activity.js.');
        }

        // ==========================================
        // 🧹 AUTO-CLEANUP MODMAIL TERBENGKALAI (48 JAM)
        // ==========================================
        setInterval(async () => {
            try {
                const { Op } = require('sequelize');
                const ModMail = require('../models/ModMail');
                const { EmbedBuilder } = require('discord.js');

                const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
                const abandonedTickets = await ModMail.findAll({
                    where: {
                        closed: false,
                        updatedAt: { [Op.lt]: twoDaysAgo }
                    }
                });

                for (const ticket of abandonedTickets) {
                    const guild = client.guilds.cache.get(ticket.guildId);
                    if (!guild) continue;
                    const channel = guild.channels.cache.get(ticket.channelId);

                    ticket.closed = true;
                    await ticket.save();

                    try {
                        const user = await client.users.fetch(ticket.userId);
                        const embed = new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle(`🔒 ${ui.getEmoji('ticket') || '💠' || '🎫'} Tiket Otomatis Ditutup`)
                            .setDescription(`Tiketmu dengan **${guild.name}** telah ditutup otomatis karena tidak ada aktivitas selama 48 jam.`)
                            .setTimestamp();
                        await user.send({ embeds: [embed] });
                    } catch (e) {}

                    if (channel) {
                        await channel.send('⏳ Tiket ditutup otomatis karena tidak ada aktivitas selama 48 jam. Channel akan dihapus dalam 10 detik.');
                        setTimeout(() => channel.delete().catch(() => {}), 10000);
                    }
                }
            } catch (error) {
                logger.error('[MODMAIL CLEANUP ERROR]', error);
            }
        }, 60 * 60 * 1000); // Check every 1 hour

        // ==========================================
        // 🎁 NOTIFIKASI DAILY REWARD OTOMATIS
        // ==========================================
        // Setiap jam, cek user yang cooldown-nya sudah habis dan belum diklaim.
        // Kirim DM pengingat dengan tombol opt-out agar user tidak terganggu.
        setInterval(async () => {
            try {
                const { Op } = require('sequelize');
                const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
                const UserProfile = require('../models/UserProfile');

                const now = new Date();

                // Cooldown durasi (dalam ms) - sesuaikan dengan logika command asli
                const DAILY_COOLDOWN_MS   = 24 * 60 * 60 * 1000; // 24 jam
                const WORK_COOLDOWN_MS    =  4 * 60 * 60 * 1000; //  4 jam
                const MINING_COOLDOWN_MS  =  2 * 60 * 60 * 1000; //  2 jam

                // Ambil semua user yang belum opt-out dari notifikasi
                const users = await UserProfile.findAll({
                    where: {
                        // Hanya kirim ke user yang tidak opt-out (kolom dailyNotify: true / null berarti aktif)
                        dailyNotify: { [Op.or]: [true, null] }
                    }
                });

                for (const profile of users) {
                    const cooldowns = profile.cooldowns || {};
                    const reminders = [];

                    // Cek cooldown daily
                    const dailyTs = cooldowns.daily ? new Date(cooldowns.daily).getTime() : 0;
                    if (now.getTime() - dailyTs >= DAILY_COOLDOWN_MS) {
                        reminders.push(`${ui.getEmoji('reward') || '💠'} **Daily** sudah bisa diklaim!`);
                    }

                    // Cek cooldown work
                    const workTs = cooldowns.work ? new Date(cooldowns.work).getTime() : 0;
                    if (now.getTime() - workTs >= WORK_COOLDOWN_MS) {
                        reminders.push(`${ui.getEmoji('coin') || '💠'} **Work** sudah bisa dikerjakan!`);
                    }

                    // Cek cooldown mining
                    const miningTs = cooldowns.mining ? new Date(cooldowns.mining).getTime() : 0;
                    if (now.getTime() - miningTs >= MINING_COOLDOWN_MS) {
                        reminders.push(`${ui.getEmoji('lootbox') || '💠'} **Mining** sudah bisa dijalankan!`);
                    }

                    // Jika tidak ada reminder yang perlu dikirim, lewati
                    if (reminders.length === 0) continue;

                    try {
                        const user = await client.users.fetch(profile.userId);
                        if (!user || user.bot) continue;

                        const embed = new EmbedBuilder()
                            .setColor(ui.getColor('economy'))
                            .setTitle(`${ui.getEmoji('reward') || '💠'} Waktunya Klaim Hadiah!`)
                            .setDescription(
                                `Hai **${user.username}**! Kamu punya aktivitas yang sudah bisa diklaim nih:\n\n` +
                                reminders.join('\n') +
                                `\n\n> Segera klaim sebelum kehabisan waktu ya! ${ui.getEmoji('vip') || '💠'}`
                            )
                            .setFooter({ text: 'Naura Daily Reminder • Klik tombol di bawah untuk menonaktifkan notifikasi ini' })
                            .setTimestamp();

                        const row = new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`daily_notify_off_${profile.userId}`)
                                .setLabel('🔕 Matikan Notifikasi Ini')
                                .setStyle(ButtonStyle.Secondary)
                        );

                        await user.send({ embeds: [embed], components: [row] });

                    } catch (dmErr) {
                        // DM tertutup atau user tidak dapat dihubungi, abaikan
                    }
                }

            } catch (error) {
                logger.error('[DAILY REMINDER ERROR]', error.message);
            }
        }, 60 * 60 * 1000); // Jalankan setiap jam

        console.log('\x1b[40m\x1b[37m[🎁 REMINDER]\x1b[0m Sistem notifikasi Daily Reward berhasil diaktifkan.');

        // ==========================================
        // 🗑️ GARBAGE COLLECTOR TEMP VOICE (Setiap 5 Menit)
        // ==========================================
        setInterval(async () => {
            if (!client.trackedTempChannels || client.trackedTempChannels.size === 0) return;

            for (const channelId of client.trackedTempChannels) {
                try {
                    const channel = await client.channels.fetch(channelId).catch(() => null);
                    if (!channel) {
                        client.trackedTempChannels.delete(channelId);
                        continue;
                    }

                    if (channel.isVoiceBased() && channel.members.size === 0) {
                        await channel.delete('Auto-cleanup empty temp voice channel').catch(() => {});
                        client.trackedTempChannels.delete(channelId);
                    }
                } catch (e) {}
            }
        }, 5 * 60 * 1000);
    },
};
