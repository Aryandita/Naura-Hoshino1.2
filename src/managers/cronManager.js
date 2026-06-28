const cron = require('node-cron');
const { logger } = require('../../src/managers/logger');
const { EmbedBuilder } = require('discord.js');
const GuildSettings = require('../models/GuildSettings');
const UserBirthday = require('../models/UserBirthday');
const Giveaway = require('../models/Giveaway');

module.exports = {
    init(client) {
        logger.info('[Cron] Initializing scheduled tasks...');

        // 1. QOTD Scheduler - Runs every minute to check if it's time to post
        cron.schedule('* * * * *', async () => {
            const now = new Date();
            const currentHourStr = now.getHours().toString().padStart(2, '0');
            const currentMinStr = now.getMinutes().toString().padStart(2, '0');
            const currentTime = `${currentHourStr}:${currentMinStr}`;
            const todayStr = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;

            try {
                // Find all guilds with QOTD enabled
                // Optimized: Only fetch guilds where QOTD or Announcements might be enabled
                const allSettings = await GuildSettings.findAll({
                    attributes: ['guildId', 'settings']
                });

                for (const guildData of allSettings) {
                    if (!guildData.settings || !guildData.settings.qotd || !guildData.settings.qotd.enabled) continue;

                    const qotdConf = guildData.settings.qotd;

                    // If it's time, and we haven't asked today, and we have questions
                    if (qotdConf.time === currentTime && qotdConf.lastAsked !== todayStr && qotdConf.questions.length > 0) {
                        const channel = client.channels.cache.get(qotdConf.channelId);
                        if (!channel) continue;

                        // Pick a random question
                        const qIndex = Math.floor(Math.random() * qotdConf.questions.length);
                        const question = qotdConf.questions[qIndex];

                        const embed = new EmbedBuilder()
                            .setColor('#ff9ff3')
                            .setTitle('❓ Question of the Day')
                            .setDescription(`**${question}**`)
                            .setFooter({ text: 'Naura Daily Engagement' })
                            .setTimestamp();

                        await channel.send({ content: '@everyone Waktunya QOTD!', embeds: [embed] }).catch(() => {});

                        // Update db
                        const currentSettings = guildData.settings;
                        currentSettings.qotd.lastAsked = todayStr;
                        // Optionally remove the question so it doesn't repeat:
                        // currentSettings.qotd.questions.splice(qIndex, 1);

                        guildData.settings = currentSettings;
                        guildData.changed('settings', true);
                        await guildData.save();
                    }
                }
            } catch (err) {
                logger.error('[Cron QOTD Error]', err);
            }
        });

        // 2. Birthday Announcer - Runs at 00:00 every day
        cron.schedule('0 0 * * *', async () => {
            logger.info('[Cron] Checking for birthdays...');
            const today = new Date();
            const d = today.getDate();
            const m = today.getMonth() + 1; // 1-12

            try {
                const birthdaysToday = await UserBirthday.findAll({ where: { day: d, month: m } });
                if (birthdaysToday.length === 0) return;

                // Simple implementation: Send DM or find common servers
                // A better approach is looping through connected guilds and checking if they have an 'announcementChannel'
                // Optimized: Only fetch guilds where QOTD or Announcements might be enabled
                const allSettings = await GuildSettings.findAll({
                    attributes: ['guildId', 'settings']
                });

                for (const guildData of allSettings) {
                    if (!guildData.settings || !guildData.settings.announcementChannel) continue;

                    const guild = client.guilds.cache.get(guildData.guildId);
                    if (!guild) continue;

                    const channel = guild.channels.cache.get(guildData.settings.announcementChannel);
                    if (!channel) continue;

                    let bdayMsg = '';
                    for (const bday of birthdaysToday) {
                        // Check if user is in this guild
                        const member = await guild.members.fetch(bday.userId).catch(() => null);
                        if (member) {
                            let ageText = '';
                            if (bday.year) {
                                const age = today.getFullYear() - bday.year;
                                ageText = ` yang ke-${age}`;
                            }
                            bdayMsg += `🎉 Selamat Ulang Tahun${ageText} kepada <@${member.id}>!\n`;
                        }
                    }

                    if (bdayMsg.length > 0) {
                        const embed = new EmbedBuilder()
                            .setColor('#ff9ff3')
                            .setTitle('🎂 Hari Ulang Tahun!')
                            .setDescription(bdayMsg)
                            .setImage('https://media.giphy.com/media/l4KibWpBGWchSqCRy/giphy.gif');

                        await channel.send({ embeds: [embed] }).catch(() => {});
                    }
                }
            } catch (err) {
                logger.error('[Cron Birthday Error]', err);
            }
        });

        // 3. Friendship Streak Checker - Runs every hour to reset lost streaks
        cron.schedule('0 * * * *', async () => {
            logger.info('[Cron] Checking friendship streaks...');
            try {
                const UserFriend = require('../models/UserFriend');
                const { Op } = require('sequelize');

                const now = new Date();
                const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));

                // Reset streak if last interaction is older than 48 hours and streak > 0
                await UserFriend.update(
                    { streak: 0 },
                    {
                        where: {
                            status: 'accepted',
                            streak: { [Op.gt]: 0 },
                            lastInteraction: { [Op.lt]: fortyEightHoursAgo }
                        }
                    }
                );
            } catch (err) {
                logger.error('[Cron Streak Reset Error]', err);
            }
        });

    }
};
