const { Events } = require('discord.js');
const GuildSettings = require('../models/GuildSettings');
const StickyRole = require('../models/StickyRole');
const { logger } = require('../managers/logger');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        if (member.user.bot) return;

        try {
            const settings = await GuildSettings.findOne({ where: { guildId: member.guild.id } });
            if (!settings || !settings.settings) return;

            // 1. AutoRole
            if (settings.settings.autoRole) {
                const roleId = settings.settings.autoRole;
                const role = member.guild.roles.cache.get(roleId);

                if (role && role.position < member.guild.members.me.roles.highest.position) {
                    await member.roles.add(role).catch(err => logger.warn(`[AutoRole] Failed to add role to ${member.user.tag}: ${err.message}`));
                }
            }

            // 2. Sticky Roles
            if (settings.settings.sticky_roles) {
                const stickyData = await StickyRole.findOne({
                    where: { guildId: member.guild.id, userId: member.user.id }
                });

                if (stickyData) {
                    const savedRoles = JSON.parse(stickyData.roles);
                    if (savedRoles.length > 0) {
                        const validRoles = savedRoles.filter(id => {
                            const r = member.guild.roles.cache.get(id);
                            return r && r.position < member.guild.members.me.roles.highest.position && !r.managed && r.id !== member.guild.id;
                        });

                        if(validRoles.length > 0) {
                            await member.roles.add(validRoles).catch(err => logger.warn(`[StickyRoles] Failed to add roles: ${err.message}`));
                            logger.info(`[StickyRoles] Restored roles for ${member.user.tag}`);
                        }
                    }
                }
            }
        } catch (error) {
            logger.error(`[Event: GuildMemberAdd] Error: ${error.message}`);
        }
    }
};
