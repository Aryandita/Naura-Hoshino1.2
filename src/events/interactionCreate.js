const { Events, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChannelType, PermissionFlagsBits, StringSelectMenuBuilder } = require('discord.js');
const { logger } = require('../../src/managers/logger');
const ModMail = require('../models/ModMail');
const GuildSettings = require('../models/GuildSettings');
const UserProfile = require('../models/UserProfile');
const env = require('../config/env');
const ui = require('../config/ui');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        // ==========================================
        // 1. 🤖 SLASH COMMAND ROUTER
        // ==========================================
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                logger.error(`\x1b[31m[COMMAND ERROR]\x1b[0m Error saat mengeksekusi ${interaction.commandName}:`, error);

                const errEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setDescription('❌ **Terjadi kesalahan sistem saat memproses perintah ini.**');

                if (interaction.deferred || interaction.replied) {
                    await interaction.followUp({ embeds: [errEmbed], ephemeral: true }).catch(() => {});
                } else {
                    await interaction.reply({ embeds: [errEmbed], ephemeral: true }).catch(() => {});
                }
            }
        }

        // ==========================================
        // 2. 🎛️ BUTTON ROUTER (Music, Ticket, TempVoice)
        // ==========================================
        if (interaction.isButton()) {

            // --- AUTO ROLE BUTTONS ---
            if (interaction.customId.startsWith('autorole_')) {
                const roleId = interaction.customId.split('_')[1];
                if (!roleId) return;
                try {
                    const member = interaction.member;
                    if (member.roles.cache.has(roleId)) {
                        await member.roles.remove(roleId);
                        return interaction.reply({ content: `✅ Role <@&${roleId}> telah dihapus darimu.`, ephemeral: true });
                    } else {
                        await member.roles.add(roleId);
                        return interaction.reply({ content: `✅ Role <@&${roleId}> telah ditambahkan kepadamu.`, ephemeral: true });
                    }
                } catch (error) {
                    return interaction.reply({ content: `❌ Gagal memproses role. Mungkin posisi role bot lebih rendah.`, ephemeral: true });
                }
            }

            // --- OPT-OUT DAILY NOTIFY ---
            if (interaction.customId.startsWith('daily_notify_off_')) {
                const targetUserId = interaction.customId.split('_')[3];
                if (interaction.user.id !== targetUserId) {
                    return interaction.reply({ content: '❌ Tombol ini bukan untukmu.', ephemeral: true });
                }
                try {
                    await UserProfile.update({ dailyNotify: false }, { where: { userId: targetUserId } });
                    return interaction.reply({ content: '🔕 Notifikasi Daily Reminder telah dimatikan. Kamu tidak akan menerima pesan ini lagi.', ephemeral: true });
                } catch (err) {
                    return interaction.reply({ content: '❌ Terjadi kesalahan saat mematikan notifikasi.', ephemeral: true });
                }
            }

            // --- MUSIC PLAYER CONTROLLER ---
            if (interaction.customId.startsWith('music_')) {
                if (!client.musicManager) return ui.sendError(interaction, 'Sistem musik sedang luring.', true);
                const player = client.musicManager.getPlayer(interaction.guild.id);
                if (!player) return ui.sendError(interaction, 'Tidak ada musik yang sedang diputar.', true);

                const memberVoice = interaction.member.voice.channel;
                if (!memberVoice || memberVoice.id !== player.voiceChannel) {
                    return ui.sendError(interaction, 'Kamu harus berada di Voice Channel yang sama denganku!', true);
                }

                try {
                    if (interaction.customId === 'music_pause') {
                        player.pause(!player.isPaused);
                        return interaction.reply({ content: player.isPaused ? '⏸️ Musik dijeda.' : '▶️ Musik dilanjutkan.', ephemeral: true });
                    }
                    if (interaction.customId === 'music_skip') {
                        player.stop();
                        return interaction.reply({ content: '⏭️ Lagu dilewati.', ephemeral: true });
                    }
                    if (interaction.customId === 'music_stop') {
                        player.destroy();
                        return interaction.reply({ content: '⏹️ Pemutaran dihentikan.', ephemeral: true });
                    }
                    if (interaction.customId === 'music_loop') {
                        if (player.loop === 'NONE') { player.setLoop('TRACK'); return interaction.reply({ content: '🔂 Loop lagu diaktifkan.', ephemeral: true }); }
                        else if (player.loop === 'TRACK') { player.setLoop('QUEUE'); return interaction.reply({ content: '🔁 Loop antrean diaktifkan.', ephemeral: true }); }
                        else { player.setLoop('NONE'); return interaction.reply({ content: '➡️ Loop dimatikan.', ephemeral: true }); }
                    }
                    if (interaction.customId === 'music_shuffle') {
                        if (player.queue.length < 2) return ui.sendError(interaction, 'Antrean terlalu pendek untuk diacak.', true);
                        for (let i = player.queue.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [player.queue[i], player.queue[j]] = [player.queue[j], player.queue[i]];
                        }
                        return interaction.reply({ content: '🔀 Antrean diacak.', ephemeral: true });
                    }
                    if (interaction.customId === 'music_voldown') {
                        const newVol = Math.max(10, player.volume - 10);
                        player.setVolume(newVol);
                        return interaction.reply({ content: `🔉 Volume: ${newVol}%`, ephemeral: true });
                    }
                    if (interaction.customId === 'music_volup') {
                        const newVol = Math.min(100, player.volume + 10);
                        player.setVolume(newVol);
                        return interaction.reply({ content: `🔊 Volume: ${newVol}%`, ephemeral: true });
                    }
                } catch (e) {
                    return ui.sendError(interaction, 'Gagal memproses aksi musik.', true);
                }
            }

            // --- TICKET SYSTEM (ModMail Panel di Server) ---
            if (interaction.customId === 'ticket_open') {
                const { createTicketChannel } = require('../../plugin/modmail/modmailHelper');
                const guildData = await GuildSettings.findOne({ where: { guildId: interaction.guild.id } });
                if (!guildData || !guildData.settings?.modmail?.categoryId) {
                    return ui.sendError(interaction, 'Konfigurasi tiket belum diatur Admin.', true);
                }

                await interaction.deferReply({ ephemeral: true });
                try {
                    await createTicketChannel(interaction, { id: interaction.guild.id, categoryId: guildData.settings.modmail.categoryId }, client);
                } catch (error) {
                    await interaction.editReply({ content: '❌ Terjadi kesalahan saat membuat tiket.' });
                }
                return;
            }

            if (interaction.customId === 'mm_close') {
                const ticket = await ModMail.findOne({ where: { channelId: interaction.channelId, closed: false } });
                if (!ticket) return ui.sendError(interaction, 'Tiket tidak ditemukan di database.', true);

                ticket.closed = true;
                await ticket.save();

                const logEmbed = new EmbedBuilder().setColor('#FF0000').setDescription('🔒 Tiket ini ditutup oleh Staf.');
                await interaction.channel.send({ embeds: [logEmbed] });

                const user = await client.users.fetch(ticket.userId).catch(() => null);
                if (user) {
                    const notifyEmbed = new EmbedBuilder().setColor('#FF0000').setDescription(`🔒 Tiket bantuanmu dengan **${interaction.guild.name}** telah ditutup.`).setTimestamp();
                    user.send({ embeds: [notifyEmbed] }).catch(() => {});
                }

                await interaction.reply('⏳ Channel ini akan dihapus dalam 5 detik...');
                setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
                return;
            }

            if (interaction.customId === 'mm_reply' || interaction.customId === 'mm_reply_anon') {
                const modal = new ModalBuilder()
                    .setCustomId(interaction.customId === 'mm_reply' ? 'mm_modal_reply' : 'mm_modal_anon')
                    .setTitle(interaction.customId === 'mm_reply' ? '💬 Balas Tiket' : '🕵️ Balas Anonim');

                const input = new TextInputBuilder()
                    .setCustomId('mm_text_input')
                    .setLabel('Tulis balasanmu:')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(input));
                return interaction.showModal(modal);
            }

            // --- TEMP VOICE PANEL (Private Room VIP) ---
            if (interaction.customId.startsWith('tvc_')) {
                const memberVoice = interaction.member.voice.channel;
                if (!memberVoice) return ui.sendError(interaction, 'Kamu harus berada di dalam Voice Channel!', true);

                // Cari apakah user ini adalah pembuat ruangan (berdasarkan awalan nama)
                const isOwner = memberVoice.name.includes(interaction.user.username);
                // Admin bisa mem-bypass ini
                const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);

                if (!isOwner && !isAdmin) return ui.sendError(interaction, 'Kamu bukan pemilik ruangan ini.', true);

                try {
                    // Fitur Khusus Premium
                    let profile;
                    try {
                        profile = await UserProfile.findOne({ where: { userId: interaction.user.id } });
                    } catch (e) {}
                    const isPremium = profile ? profile.isPremium : false;
                    const isBotOwner = env.OWNER_IDS && env.OWNER_IDS.includes(interaction.user.id);

                    if (interaction.customId === 'tvc_lock') { await memberVoice.permissionOverwrites.edit(interaction.guild.id, { [PermissionFlagsBits.Connect]: false }); return ui.sendError(interaction, '🔒 Ruangan dikunci.', true); }
                    if (interaction.customId === 'tvc_unlock') { await memberVoice.permissionOverwrites.edit(interaction.guild.id, { [PermissionFlagsBits.Connect]: null }); return ui.sendError(interaction, '🔓 Ruangan dibuka.', true); }

                    if (interaction.customId === 'tvc_hide') {
                        if (!isPremium && !isBotOwner && !isAdmin) {
                            return interaction.reply({ content: '👑 **Fitur Eksklusif!** Mode Invisible (Ghosting) hanya untuk pengguna Premium.', ephemeral: true });
                        }
                        await memberVoice.permissionOverwrites.edit(interaction.guild.id, { [PermissionFlagsBits.ViewChannel]: false, [PermissionFlagsBits.Connect]: false });
                        return ui.sendError(interaction, '👻 Ruangan memasuki **Invisible Mode**. Tidak ada yang bisa melihatnya.', true);
                    }
                    if (interaction.customId === 'tvc_unhide') {
                        await memberVoice.permissionOverwrites.edit(interaction.guild.id, { [PermissionFlagsBits.ViewChannel]: null, [PermissionFlagsBits.Connect]: null });
                        return ui.sendError(interaction, '👁️ Ruangan kembali terlihat.', true);
                    }
                    if (interaction.customId === 'tvc_stage') {
                        const isMuted = memberVoice.permissionOverwrites.cache.get(interaction.guild.id)?.deny.has(PermissionFlagsBits.Speak);
                        if (isMuted) { await memberVoice.permissionOverwrites.edit(interaction.guild.id, { Speak: null }); return ui.sendError(interaction, '🎤 Stage Mode OFF.', true); }
                        else { await memberVoice.permissionOverwrites.edit(interaction.guild.id, { Speak: false }); await memberVoice.permissionOverwrites.edit(interaction.user.id, { Speak: true }); return ui.sendError(interaction, '🤫 Stage Mode ON.', true); }
                    }
                    if (interaction.customId === 'tvc_waiting') {
                        const waitingName = `⏳ Wait - ${interaction.user.username}`;
                        const existingWaiting = interaction.guild.channels.cache.find(c => c.name === waitingName && c.parentId === memberVoice.parentId);
                        if (existingWaiting) { await existingWaiting.delete().catch(()=>{}); return ui.sendError(interaction, '🗑️ Waiting Room dihapus.', true); }
                        else {
                            await interaction.guild.channels.create({ name: waitingName, type: ChannelType.GuildVoice, parent: memberVoice.parentId, permissionOverwrites: [{ id: interaction.guild.id, allow: [PermissionFlagsBits.Connect], deny: [PermissionFlagsBits.Speak] }, { id: interaction.user.id, allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] }]});
                            return ui.sendError(interaction, '⏳ Waiting Room dibuat.', true);
                        }
                    }
                    if (interaction.customId === 'tvc_move') {
                        const waitingName = `⏳ Wait - ${interaction.user.username}`;
                        const waitingRoom = interaction.guild.channels.cache.find(c => c.name === waitingName && c.parentId === memberVoice.parentId);
                        if (!waitingRoom || waitingRoom.members.size === 0) return ui.sendError(interaction, '👀 Kosong.', true);
                        const selectMenu = new StringSelectMenuBuilder().setCustomId('tvc_move_select').setPlaceholder('Pilih user...').addOptions(waitingRoom.members.map(m => ({ label: m.user.username, value: m.id })));
                        return interaction.reply({ components: [new ActionRowBuilder().addComponents(selectMenu)], ephemeral: true });
                    }
                    if (interaction.customId === 'tvc_rename') {
                        const modal = new ModalBuilder().setCustomId('modal_tvc_rename').setTitle('✏️ Ubah Nama');
                        modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_name').setLabel('Nama baru:').setStyle(TextInputStyle.Short).setRequired(true)));
                        return interaction.showModal(modal);
                    }
                    if (interaction.customId === 'tvc_limit') {
                        const modal = new ModalBuilder().setCustomId('modal_tvc_limit').setTitle('👥 Batas Pengguna');
                        modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_limit').setLabel('Batas (0 Bebas):').setStyle(TextInputStyle.Short).setRequired(true)));
                        return interaction.showModal(modal);
                    }
                    if (interaction.customId === 'tvc_status') {
                        const modal = new ModalBuilder().setCustomId('modal_tvc_status').setTitle('💬 Ubah Voice Status');
                        modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('input_status').setLabel('Status baru:').setStyle(TextInputStyle.Short).setRequired(true)));
                        return interaction.showModal(modal);
                    }
                    if (interaction.customId === 'tvc_region') {
                        if (!isPremium && !isBotOwner && !isAdmin) {
                            return interaction.reply({ content: '👑 **Fitur Eksklusif!** Ubah Region hanya untuk pengguna Premium.', ephemeral: true });
                        }
                        const selectMenu = new StringSelectMenuBuilder()
                            .setCustomId('tvc_region_select')
                            .setPlaceholder('Pilih Region Voice Server...')
                            .addOptions([
                                { label: 'Otomatis', value: 'auto' },
                                { label: 'Singapore', value: 'singapore' },
                                { label: 'Japan', value: 'japan' },
                                { label: 'Sydney', value: 'sydney' },
                                { label: 'US Central', value: 'us-central' },
                                { label: 'Rotterdam', value: 'rotterdam' }
                            ]);
                        return interaction.reply({ components: [new ActionRowBuilder().addComponents(selectMenu)], ephemeral: true });
                    }
                    if (interaction.customId === 'tvc_save') {
                        if (!isPremium && !isBotOwner && !isAdmin) {
                            return interaction.reply({ content: '👑 **Fitur Eksklusif!** Simpan Sesi hanya untuk pengguna Premium.', ephemeral: true });
                        }
                        // Implementasi Sederhana: Menyimpan informasi ke DB (Bisa dikembangkan lebih lanjut)
                        let [db] = await GuildSettings.findOrCreate({ where: { guildId: interaction.guild.id } });
                        let userTempSettings = db.settings.userTempSettings || {};
                        userTempSettings[interaction.user.id] = {
                            name: memberVoice.name,
                            limit: memberVoice.userLimit,
                            bitrate: memberVoice.bitrate,
                            rtcRegion: memberVoice.rtcRegion
                        };
                        db.settings.userTempSettings = userTempSettings;
                        db.changed('settings', true);
                        await db.save();

                        return ui.sendError(interaction, '💾 **Sesi Disimpan!** Pengaturan ruangan ini (Nama, Limit, Region) akan dipulihkan otomatis saat kamu membuat ruangan baru.', true);
                    }
                } catch (error) { return ui.sendError(interaction, '❌ Gagal.', true); }
            }
        }

        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'mm_select_server' || interaction.customId === 'modmail_select_guild') {
                const { createTicketChannel } = require('../../plugin/modmail/modmailHelper');
                const targetGuildId = interaction.values[0];
                const guildData = await GuildSettings.findOne({ where: { guildId: targetGuildId } });
                if (!guildData || !guildData.settings?.modmail?.categoryId) return ui.sendError(interaction, '❌ Konfigurasi server rusak.', true);

                const loadingEmbed2 = new EmbedBuilder()
                    .setColor(ui.getColor('primary') || '#FFB6C1')
                    .setAuthor({ name: 'Naura Loading System...', iconURL: interaction.client.user.displayAvatarURL() })
                    .setDescription(`${ui.getEmoji('loading') || '⏳'} Naura sedang mengetuk pintu server... Sabar ya! 🌸`)
                    .setFooter({ text: `Sedang menyiapkan untuk ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
                await interaction.update({ content: null, embeds: [loadingEmbed2], components: [] });
                const fetchedMessages = await interaction.channel.messages.fetch({ limit: 5 }).catch(() => null);
                const originalMessage = fetchedMessages ? fetchedMessages.find(m => m.author.id === interaction.user.id) : null;
                try { await createTicketChannel(originalMessage || interaction, { id: targetGuildId, categoryId: guildData.settings.modmail.categoryId }, client); } 
                catch (error) { await interaction.editReply({ content: '❌ Terjadi kesalahan.', components: [] }).catch(()=>{}); }
                return;
            }

            if (interaction.customId === 'tvc_move_select') {
                const targetId = interaction.values[0];
                const targetMember = await interaction.guild.members.fetch(targetId).catch(()=>null);
                const ownerVoice = interaction.member.voice.channel;
                if (!targetMember || !targetMember.voice.channel || !ownerVoice) return ui.sendError(interaction, '❌ Gagal memindahkan.', true);
                try {
                    await ownerVoice.permissionOverwrites.edit(targetId, { Connect: true, Speak: true, ViewChannel: true });
                    await targetMember.voice.setChannel(ownerVoice);
                    return ui.sendError(interaction, `✅ Berhasil memindahkan <@${targetId}> ke ruanganmu!`, true);
                } catch (error) { return ui.sendError(interaction, '❌ Gagal memindahkan.', true); }
            }

            if (interaction.customId === 'tvc_region_select') {
                const region = interaction.values[0];
                const memberVoice = interaction.member.voice.channel;
                if (!memberVoice) return ui.sendError(interaction, '❌ Kamu sudah keluar dari Voice Channel!', true);

                try {
                    await memberVoice.setRTCRegion(region === 'auto' ? null : region);
                    return interaction.reply({ content: `✅ Voice Region diubah ke **${region}**.`, ephemeral: true });
                } catch (error) {
                    return interaction.reply({ content: `❌ Gagal mengubah region. Pastikan bot punya izin yang cukup.`, ephemeral: true });
                }
            }
        }

        // ==========================================
        // 4. 📝 MODALS ROUTER (SUBMIT FORMULIR MODMAIL)
        // ==========================================
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'mm_modal_reply' || interaction.customId === 'mm_modal_anon') {
                const replyText = interaction.fields.getTextInputValue('mm_text_input');
                const isAnon = interaction.customId === 'mm_modal_anon';
                const ticket = await ModMail.findOne({ where: { channelId: interaction.channelId, closed: false } });
                
                if (!ticket) return ui.sendError(interaction, `${ui.getEmoji('error') || '❌'} Gagal: Tiket sudah ditutup.`, true);
                const user = await client.users.fetch(ticket.userId).catch(() => null);
                if (!user) return ui.sendError(interaction, `${ui.getEmoji('error') || '❌'} Gagal: User sudah meninggalkan Discord.`, true);

                const replyEmbed = new EmbedBuilder()
                    .setAuthor({ name: isAnon ? `Staf ${interaction.guild.name}` : `Balasan dari ${interaction.member.displayName}`, iconURL: interaction.guild.iconURL() })
                    .setDescription(replyText)
                    .setColor('#FFB6C1')
                    .setTimestamp();

                try {
                    await user.send({ embeds: [replyEmbed] });
                    await interaction.reply({ content: `${ui.getEmoji('success') || '✅'} Pesan ${isAnon ? '(Anonim)' : ''} berhasil dikirim.`, ephemeral: true });
                    
                    const logEmbed = new EmbedBuilder()
                        .setColor(ui.getColor('success'))
                        .setAuthor({ name: isAnon ? `[ANONIM] ${interaction.user.tag}` : interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                        .setDescription(`**Membalas:** ${replyText}`);
                    await interaction.channel.send({ embeds: [logEmbed] });
                } catch (e) {
                    await ui.sendError(interaction, 'Gagal mengirim DM (User mematikan DM).', true);
                }
                return;
            }

            if (interaction.customId.startsWith('modal_tvc_')) {
                const memberVoice = interaction.member.voice.channel;
                if (!memberVoice) return ui.sendError(interaction, '❌ Kamu sudah keluar dari Voice Channel!', true);
                try {
                    if (interaction.customId === 'modal_tvc_rename') {
                        let profile;
                        try {
                            profile = await UserProfile.findOne({ where: { userId: interaction.user.id } });
                        } catch (e) {}

                        let newName = interaction.fields.getTextInputValue('input_name');
                        const isBotOwner = env.OWNER_IDS && env.OWNER_IDS.includes(interaction.user.id);

                        if (isBotOwner) {
                            newName = `「👑」・${newName} Owner Voice`;
                        } else if (profile && profile.isPremium) {
                            newName = `「🌟」・${newName} VIP Voice`;
                        } else {
                            newName = `🔊 ${newName} voice`;
                        }

                        await memberVoice.setName(newName);
                        return ui.sendError(interaction, `✅ Nama diubah!`, true);
                    }
                    if (interaction.customId === 'modal_tvc_limit') {
                        let limit = parseInt(interaction.fields.getTextInputValue('input_limit'));
                        if (isNaN(limit) || limit < 0 || limit > 99) limit = 0;
                        await memberVoice.setUserLimit(limit);
                        return ui.sendError(interaction, `✅ Kapasitas diubah.`, true);
                    }
                    if (interaction.customId === 'modal_tvc_status') {
                        try {
                            // Cek Discord API feature support
                            const fetch = require('isomorphic-unfetch');
                            const newStatus = interaction.fields.getTextInputValue('input_status');

                            const response = await fetch(`https://discord.com/api/v10/channels/${memberVoice.id}/voice-status`, {
                                method: 'PUT',
                                headers: {
                                    Authorization: `Bot ${client.token}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ status: newStatus })
                            });

                            if (response.ok) {
                                return ui.sendError(interaction, `✅ Status Voice Channel diubah menjadi: **${newStatus}**`, true);
                            } else {
                                return ui.sendError(interaction, `❌ Gagal mengubah status Voice Channel.`, true);
                            }
                        } catch (err) {
                            return ui.sendError(interaction, `❌ Gagal memanggil API Discord.`, true);
                        }
                    }
                } catch (error) { return ui.sendError(interaction, `⚠️ Rate Limit Discord: Terlalu cepat mengubah.`, true); }
            }
        }
    }
};
