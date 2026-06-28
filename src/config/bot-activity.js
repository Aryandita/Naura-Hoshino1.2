const { ActivityType, PresenceUpdateStatus } = require('discord.js');

module.exports = {
    ownerId: '795241173009825853',
    activities: [
        {
            name: 'Custom Status',
            state: '🌸 Membaca buku bersama Aryandita ~',
            type: ActivityType.Custom,
            status: PresenceUpdateStatus.Online
        },
        {
            name: 'Custom Status',
            state: '💡 Belajar coding bersama Aryandita!',
            type: ActivityType.Custom,
            status: PresenceUpdateStatus.Idle
        },
        {
            name: 'Custom Status',
            state: '🌸 Siap membantu harimu! ✨',
            type: ActivityType.Custom,
            status: PresenceUpdateStatus.Online
        },
        {
            name: 'Custom Status',
            state: '🎧 Meracik playlist lagu yang asik ~',
            type: ActivityType.Custom,
            status: PresenceUpdateStatus.Idle
        },
        {
            name: 'Custom Status',
            state: '🧠 Lagi mikirin jawaban paling cerdas!',
            type: ActivityType.Custom,
            status: PresenceUpdateStatus.DoNotDisturb
        },
        // --- 🎮 Tipe: Bermain (Playing) ---
        {
            name: 'Genshin Impact / Blue Archive bersama Aryandita',
            type: ActivityType.Playing,
            status: PresenceUpdateStatus.Online
        },
        {
            name: 'Petak Umpet di Voice Channels',
            type: ActivityType.Playing,
            status: PresenceUpdateStatus.Idle
        },
        {
            name: 'Menangkap bintang jatuh 🌠',
            type: ActivityType.Playing,
            status: PresenceUpdateStatus.Online
        },
        {
            name: 'Merapikan server dari pesan spam 🧹',
            type: ActivityType.Playing,
            status: PresenceUpdateStatus.DoNotDisturb
        },
        // --- 📺 Tipe: Menonton (Watching) ---
        {
            name: 'Bintang-bintang di langit malam ✨',
            type: ActivityType.Watching,
            status: PresenceUpdateStatus.Idle
        },
        {
            name: 'Tingkah lucu member server 👀',
            type: ActivityType.Watching,
            status: PresenceUpdateStatus.Online
        },
        {
            name: 'Tutorial menjadi bot yang baik di YouTube',
            type: ActivityType.Watching,
            status: PresenceUpdateStatus.Idle
        },
        {
            name: 'Anime Season Ini',
            type: ActivityType.Watching,
            status: PresenceUpdateStatus.Online
        },
        // --- 🎧 Tipe: Mendengarkan (Listening to) ---
        {
            name: 'Curhatan dan keluh kesahmu 🎧',
            type: ActivityType.Listening,
            status: PresenceUpdateStatus.Online
        },
        {
            name: 'Playlist Lofi Girl untuk fokus',
            type: ActivityType.Listening,
            status: PresenceUpdateStatus.Idle
        },
        {
            name: 'Suara rintik hujan di sore hari 🌧️',
            type: ActivityType.Listening,
            status: PresenceUpdateStatus.Idle
        },
        // --- 🏆 Tipe: Bersaing di (Competing in) ---
        {
            name: 'Turnamen tidur siang terlama 💤',
            type: ActivityType.Competing,
            status: PresenceUpdateStatus.Idle
        },
        {
            name: 'Lomba menjawab command tercepat ⚡',
            type: ActivityType.Competing,
            status: PresenceUpdateStatus.Online
        },
        // --- 💡 Tipe: Kustom / Call to Action (Ajakan Bertindak) ---
        {
            name: 'Custom Status',
            state: 'Ketik /help untuk memanggilku! 🌸',
            type: ActivityType.Custom,
            status: PresenceUpdateStatus.Online
        },
        {
            name: 'Custom Status',
            state: 'Mengumpulkan senyuman hari ini 😊',
            type: ActivityType.Custom,
            status: PresenceUpdateStatus.Online
        },
        // --- 🎮 Tipe Tambahan: Bermain (Playing) ---
        {
            name: 'Merapikan bintang-bintang di galaksi 🌌',
            type: ActivityType.Playing,
            status: PresenceUpdateStatus.Idle
        },
        {
            name: 'Menghitung koin Naura di brankas server 💰',
            type: ActivityType.Playing,
            status: PresenceUpdateStatus.Online
        },
        {
            name: 'Gacha ampas di Naura Survival 🎲',
            type: ActivityType.Playing,
            status: PresenceUpdateStatus.Online
        },
        {
            name: 'Membaca buku sihir bersama Aryandita 📖',
            type: ActivityType.Playing,
            status: PresenceUpdateStatus.Idle
        },
        // --- 📺 Tipe Tambahan: Menonton (Watching) ---
        {
            name: 'Keseruan obrolan di server ini 🍿',
            type: ActivityType.Watching,
            status: PresenceUpdateStatus.Online
        },
        {
            name: 'Marathon film Studio Ghibli 🍃',
            type: ActivityType.Watching,
            status: PresenceUpdateStatus.Idle
        },
        {
            name: 'Tutorial masak nasi goreng di YouTube 🍳',
            type: ActivityType.Watching,
            status: PresenceUpdateStatus.Online
        },
        {
            name: 'Bintang jatuh dari jendela kamar 🌠',
            type: ActivityType.Watching,
            status: PresenceUpdateStatus.Idle
        },
        // --- 🎧 Tipe Tambahan: Mendengarkan (Listening to) ---
        {
            name: 'Lagu Anime Opening yang bikin semangat! 🎸',
            type: ActivityType.Listening,
            status: PresenceUpdateStatus.Online
        },
        {
            name: 'Suara jangkrik di malam hari 🌙',
            type: ActivityType.Listening,
            status: PresenceUpdateStatus.Idle
        },
        {
            name: 'Detak jantung server ini 💓',
            type: ActivityType.Listening,
            status: PresenceUpdateStatus.Online
        },
        {
            name: 'Perintah dari Master Aryandita 🎧',
            type: ActivityType.Listening,
            status: PresenceUpdateStatus.Online
        },
        // --- 🏆 Tipe Tambahan: Bersaing di (Competing in) ---
        {
            name: 'Kejuaraan Bot Ter-Imut Sedunia 🏆',
            type: ActivityType.Competing,
            status: PresenceUpdateStatus.Online
        },
        {
            name: 'Balapan merespons ping / latensi 🏎️',
            type: ActivityType.Competing,
            status: PresenceUpdateStatus.Online
        },
        // --- 💡 Tipe Tambahan: Kustom / Call to Action (Custom) ---
        {
            name: 'Custom Status',
            state: 'Jangan lupa minum air hari ini! 💧',
            type: ActivityType.Custom,
            status: PresenceUpdateStatus.Online
        },
        {
            name: 'Custom Status',
            state: 'Punya ide fitur? Kasih tahu Aryandita! 💡',
            type: ActivityType.Custom,
            status: PresenceUpdateStatus.Online
        },
        {
            name: 'Custom Status',
            state: 'Siap menemanimu 24/7! 🌸',
            type: ActivityType.Custom,
            status: PresenceUpdateStatus.Online
        }
    ]
};
