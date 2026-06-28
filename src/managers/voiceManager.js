// Lokasi: src/managers/voiceManager.js
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    getVoiceConnection
} = require('@discordjs/voice');
const { logger } = require('../../src/managers/logger');
const googleTTS = require('google-tts-api');

class VoiceManager {
    static async speak(text, member) {
        if (!member || !member.voice.channel) {
            console.log('\x1b[31m[TTS ERROR]\x1b[0m Member tidak berada di dalam Voice Channel.');
            return;
        }

        const voiceChannel = member.voice.channel;
        const guildId = voiceChannel.guild.id;

        try {
            // 1. Dapatkan URL Audio dari Google TTS (Bahasa Indonesia)
            // Limit text ke 195 karakter agar tidak terkena RangeError dari API Google TTS
            const safeText = text.length > 195 ? text.substring(0, 192) + '...' : text;
            const audioUrl = googleTTS.getAudioUrl(safeText, {
                lang: 'id',
                slow: false,
                host: 'https://translate.google.com'
            });

            // 2. Buat Resource Audio
            const resource = createAudioResource(audioUrl);
            const player = createAudioPlayer();

            // 3. Bergabung ke Voice Channel
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: guildId,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                selfDeaf: true
            });

            // 4. Mainkan Suara
            connection.subscribe(player);
            player.play(resource);

            // 5. Cleanup Setelah Selesai Berbicara
            player.on(AudioPlayerStatus.Idle, () => {
                player.stop();
            });

            player.on('error', error => {
                logger.error('\x1b[41m\x1b[37m ⚠️ AUDIO PLAYER ERROR \x1b[0m', error.message);
            });
        } catch (error) {
            logger.error('\x1b[41m\x1b[37m ⚠️ GOOGLE TTS ERROR \x1b[0m', error);
        }
    }
}

module.exports = VoiceManager;
