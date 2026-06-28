const { Events } = require('discord.js');
const GuildSettings = require('../models/GuildSettings');
const StickyRole = require('../models/StickyRole');
const { logger } = require('../managers/logger');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        if (member.user.bot) return;

        try {
            const settings = await GuildSettings.findOne({ where: { guildId: member.guild.id } });
            if (!settings || !settings.settings || !settings.settings.sticky_roles) return;

            // Simpan role yang dimiliki user saat keluar
            const rolesToSave = member.roles.cache
                .filter(r => !r.managed && r.id !== member.guild.id)
                .map(r => r.id);

            if (rolesToSave.length > 0) {
                await StickyRole.upsert({
                    guildId: member.guild.id,
                    userId: member.user.id,
                    roles: JSON.stringify(rolesToSave)
                });
                logger.info(`[StickyRoles] Saved ${rolesToSave.length} roles for ${member.user.tag} in ${member.guild.name}`);
            }
        } catch (error) {
            logger.error(`[Event: GuildMemberRemove] Error: ${error.message}`);
        }
    }
};
