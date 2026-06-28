const { ActivityType } = require ('discord.js');
const path = require('path');
const { logger } = require('../../src/managers/logger'); // Tambahkan ini di bagian atas

module.exports = {
    colors: {
/// --- PALETTE WARNA UTAMA ---
        primary: '#FFC0CB',
        accent: '#00FFFF',
    
/// --- PALETTE WARNA KHUSUS ---
        economy: '#FFD700',
            fishing: '#1E90FF',
            mining: '#8B4513',
            crafting: '#228B22',
            battle: '#DC143C',
            rank: '#9400D3',
        music: '#8A2BE2',
        welcome: '#00FFFF',
        leave: '#FF69B4',
        boost: '#FFD700',
        announcement: '#001aff',
            announce_update: '#00FFFF',   
            announce_mt: '#8B4513',        
            announce_event: '#FFD700',    
            announce_warn: '#DC143C',     

/// --- WARNA STATUS ---
        success: '#00FF00',
        error: '#FF0000',
        dark: '#2b2d31',
        light: '#f0f0f0',

/// --- WARNA LAINNYA ---
        

    },

    // --- KONFIGURASI BANNER LOKAL ---
    banners: {
/// --- LEVELING BANNNERS ---
        levelUp: path.join(__dirname, '../../assets/core/levelbg.png'),

/// --- BANNER UMUM ---
        naura: path.join(__dirname, '../../assets/core/avatar.png'),
        qris: path.join(__dirname, '../../assets/economy/qris.jpg'),
        about: path.join(__dirname, '../../assets/core/banner_about.png'),
        ping: path.join(__dirname, '../../assets/core/banner_ping.png'),
        help: path.join(__dirname, '../../assets/core/banner_help.png'),
        stats: path.join(__dirname, '../../assets/core/banner_stats.png'),
        music: path.join(__dirname, '../../assets/music/banner_music.png'),
        survival: path.join(__dirname, '../../assets/survival/banner_survival.png'),
        shop: path.join(__dirname, '../../assets/survival/banner_shop.png'),
        dungeon: path.join(__dirname, '../../assets/survival/banner_dungeon.png'),
        economy: path.join(__dirname, '../../assets/economy/banner_economy.png'),
        wedding: path.join(__dirname, '../../assets/survival/banner_wedding.png'),
    },

    // --- KONFIGURASI LOKAL UNTUK CANVAS BACKGROUND ---
    backgrounds: {
        welcome: path.join(__dirname, '../../assets/core/welcome-bg.png'),
        leave: path.join(__dirname, '../../assets/core/leave-bg.png'),
    },

/// --- KONFIGURASI DIVIDER (PEMBATAS) ---
    dividers: {
        musicDividers: '⊱ ────── {.⋅ ♫ ⋅.} ───── ⊰',
    	generalDividers: ''
    },

    // --- KONFIGURASI EMOJI KUSTOM ---
    emojis: {
        // 🎯 EMOJI STATUS
        power: '<:Restart:1484706091941232815>',
        stats: '<:stats:1492712312975392859>',
        info: '<a:information:1499384250221199360>',
        lokasi: '<:location:1499383522769768448>',
        desc: '<a:SpinningBook:1492696903069208627>',
        success: '<a:done:1492712310173732954>',
        error: '<a:error2:1492712275771920536>',
        loading: '<a:Loading1:1492696844646613042>',
        admin: '<a:Crown2:1492696869053141143>',
        dot: '<a:Arrow:1492696901051744298>',
        booster: '<a:Booster:1492696882454200350>',
        latency: '<a:Latency:1492696871586631872>',
        online: '<a:Online:1492696928092291123>',
        offline: '<a:Offline:1492696923436617748>',
        redping: '<:redping:1492712290703638578>',
        greenping: '<:greenping:1492712286681305129>',
        yellowping: '<:yellowping:1492712288631656519>',
        clock: '<a:clock:1492712296697298954>',
        warning: '<a:Warn:1492696836694347816>',

        // 📢 EMOJI ANNOUNCEMENT
        announce_update: '<a:Announcement1:1492696885817770164>',
        announce_mt: '<:Database:1484706081988018279>',
        announce_event: '<a:Gift:1492696855778295859>',
        announce_warn: '<a:Warn:1492696836694347816>', 
        announce_info: '<:Naura:1488427505466474597>',

        // ⛳️ EMOJI EKONOMI
        vip: '<a:Diamond:1492696863525179483>',
        coin: '<:NauraCoins:1484705998349402173>',
        wallet: '<:Wallet:1489894081436975184>',
        bank: '<:NauraBank:1484706000488497273>',
        lootbox: '<a:Gift:1492696855778295859>',
        trophy: '<a:Trophy:1492696877454331914>',
        race: '',
        work: '',
        fishing: '',
        mining: '',
        crafting: '',
        battle: '',
        rank: '',
        beg: '<:NauraBeg:1484706002669404160>',
        steal: '<:Steal:1484706094759677962>',
        hack: '<:Hack:1484706096462430308>',
        crime: '',
        slots: '<:Slots:1484706033841737868>',
        effect: '<a:Flash:1492696906764390460>',
        id: '<a:SpinningBook:1492696903069208627>',

        // 🔹 SURVIVAL & RPG STATS (BARU)
        hunger: '<:hunger:1499612622927167520>',
        thirst: '<:thirst:1499612607458312212>',
        strength: '<:Strenght:1499621329366810716>',
        agility: '<a:Flash:1492696906764390460>',
        intelligence: '<a:inteligent:1499612616358887574>',
        luck: '<a:luck:1499612612080570488>',
        health: '<:health:1499612610012643459>',
        pet: '<a:pet:1499612620859117719>',
        npc: '<:Limit:1493981697749024870>',
        backpack: '<:backpack:1499612625107943525>',
        tools: '<:Tools:1499621327743615006>',
        bar_filled: '<:AfterDot:1488166236004159509>', 
        bar_empty: '<:BeforeDot:1488166108081950882>',

        // ⏰ IKON WAKTU & PROPERTI
        morning: '<a:morning:1500705373093498920>',
        day: '<a:afternoon:1500705365053018113>',
        afternoon: '<a:morning:1500705373093498920>',
        night: '<a:moon:1500705359222931597>',
        property: '<:property:1500705357130104842>',
        bed: '<:bed:1500705354613264494>',

        // ITEM & MATERIAL
        apple: '<:apple:1500705352335757362>',
        mineral_water: '<:waterbottle:1500712659769622560>',
        wood: '<:log:1500712657307832371>',
        stone: '<:stone:1500712655067938826>',
        iron_ore: '<:iron:1500712652962529401>',
        diamond: '<:diamond:1500712650936549427>',
        trash: '<:trash:1500712648545931294>',
        small_fish: '🐟',
        salmon: '🍣',
        mystic_herb: '<a:flower:1500712641293975663>',
        fishing_rod: '<:fishingrod:1500712645882282167>',
        riffle: '<:riffle:1500712643781070959>',
        pickaxe: '',
        axe: '',
        sword: '',
        shield: '',
        potion: '',
        bandage: '',

        // SEASONS
        summer: '<a:summer:1500721239054876802>',
        spring: '<a:spring:1500715167594582037>',
        winter: '<a:winter:1500717689457344603>',
        autumn: '<:autumn:1500715165425995817>',


        // 🗺️ SURVIVAL UI (BARU)
        diff_easy: '🟢',
        diff_normal: '🟡',
        diff_hard: '🟠',
        diff_extreme: '🔴',
        diff_star: '🌌',
        farm_seed: '🌱',
        farm_harvest: '🌾',
        farm_soil: '🟫',
        farm_house: '🏡',
        dungeon_fight: '⚔️',
        dungeon_boss: '🔥',
        dungeon_monster: '👺',
        dungeon_attack: '🗡️',
        dungeon_flee: '🏃',
        dungeon_dodge: '💨',
        dungeon_win: '🎉',
        dungeon_money: '💰',
        dungeon_xp: '🌟',
        dungeon_loot: '🎁',
        dungeon_skull: '💀',
        craft_table: '🔨',
        craft_potion: '🧪',
        craft_meal: '🍲',
        npc_group: '👥',
        npc_talk: '💬',
        npc_greet: '🗣️',
        npc_repair: '⚒️',
        npc_tax: '💸',
        npc_briefcase: '💼',
        npc_broken_heart: '💔',
        study_school: '🏫',
        study_book: '📖',
        study_grad: '🎓',
        shop_cart: '🛒',
        shop_box: '📦',
        vehicle: '🚗',
        fuel: '⛽',
        wedding_ring: '💍',
        dungeon_pass: '🎟️',
        house: '🏠',
        quest: '📜',
        bare_hands: '🖐️',
        rain: '🌧️',
        snow: '❄️',
        clear_sky: '☀️',
        sick: '🤒',
        medicine: '💊',
        raincoat: '🧥',
        jacket: '🧥',
        recipe: '📃',
        certificate: '🎓',
        thief: '🥷',
        mask: '🎭',
        bomb: '💣',
        prison: '⛓️',



        // 🎲 EMOJI RARITY
        common: '<:Common:1488899502378193026>',
        uncommon: '',
        rare: '<:Rare:1488899517477556324>',
        epic: '',
        legendary: '<:Legendary:1488899547261304972>',
        mythic: '<:Mythical:1488899534653362257>',

        // GIVEAWAY EMOJI
        reward: '<a:Gift:1492696855778295859>',
        vanity: '<a:Party:1492696820227510385>',


        // 🌟 SLOT EMOJI UNTUK MENU HELP (Silakan isi ID-nya nanti)
        help_core: '<:stats:1492712312975392859>',
        help_eco: '<:NauraCoins:1484705998349402173>',
        help_music: '<:Lyrics:1484705972919337070>',
        help_game: '<:activity:1492712284550729879>',
        help_admin: '<:Privacy:1484706044943929354>',

        // 🌐 MENU CORE / STATS / PING / ABOUT
        naura: '<:Naura:1488427505466474597>',
        support: '💬',
        dashboard: '<:web:1492712301986447511>',
        invite: '✨',
        server_info: '🖥️',
        ram_info: '🧠',
        software_info: '<:Technology:1484706005185986650>',
        system_reach: '<:stats:1492712312975392859>',
        about_title: '<:Naura:1488427505466474597>',
        network_ping: '<:web:1492712301986447511>',
        database_ping: '<:Database:1484706081988018279>',
        pong: '<a:Latency:1492696871586631872>',

        /// TEMPVOICE PANEL
        lock: '<a:Lock:1493979607337275532>',
        unlock: '<a:Unlock:1493981701502799893>',
        rename: '<a:Rename1:1493979591319097455>',
        limit: '<:Limit:1493981697749024870>',
        hide: '<a:Hide:1493979601528033443>',
        unhide: '<a:Unhide:1493979596301926420>',
        stage: '<a:Stage:1493982052675092692>',
        waiting: '<a:Stage:1493982052675092692>',
        move: '<:798008booster:1493982970443468870>',
        ticket: '🎫',

        // 🎮 MINIGAMES
        counting: '🔢',
        tod_truth: '📝',
        tod_dare: '😈',
        tod_spin: '🔄',

        // 🎵 MUSIC PANEL & PROGRESS BAR
        nowplaying: '<a:DiscSpinner1:1492696912145678488>',
        progressDot: '<:DotMusic:1488166056768835596>',
        progressLineBefore: '<:AfterDot:1488166236004159509>',
        progressLineAfter: '<:BeforeDot:1488166108081950882>',
        favorite: '<a:SpinHeart:1492696848643915796>',
        filter: '<:Filter:1484705994020753529>',

        // 🎤 MUSIC INFO
        musicListener: '<a:Listener:1492696916050444449>',
        musicArtist: '<:Artis:1484706029244518561>',

        // 🕹️ MUSIC MEDIA CONTROLS
        musicPlayPause: '<:PlayPause:1484705975998091375>',
        musicSkip: '<:Skip:1484705981152755712>',
        musicStop: '<:Stop:1484705983778525315>',
        musicLoop: '<:Loop:1484705967991034010>',
        musicVolDown: '<:VolumeDown:1484874588524646621>',
        musicVolUp: '<:VolumeUp:1484874537110864034>',
        musicAutoplay: '<:AutoPlay:1484705985980268744>',
        musicLyrics: '<:Lyrics:1484705972919337070>',
        musicShuffle: '<:Shuffle:1484705970469867641>',
        music247: '<a:Moon:1492696850602524682>',

        // 🎛️ MUSIC FILTERS (DSP)
        normal: '<:MusicDisc:1484706066662031483>',
        bassboost: '<:BassBoost:1493476326634684517>',
        nightcore: '<:NightCore:1493476329658515497>',
        vaporwave: '<:vaporwave:1493478233448910878>',

        // 🌐 PLATFORM SOURCES (BARU)
        spotify: '<:Spotify:1500311186736939008>',
        youtube: '<a:Youtube:1500310258709434448>',
        soundcloud: '<:SoundCloud:1500310263247671347>',
        apple: '<:AppleMusic:1500310265391218880>',

        // ⬇️ DOWNLOAD & UTILITY
        download: '📥',
    },

    // ==========================================
    // 🛡️ SISTEM GETTER CERDAS (ANTI-CRASH)
    // ==========================================

    // Mengecek emoji. Jika tidak ada, kembalikan null atau string kosong agar fallback || 'emoji_biasa' di kodingan lain bekerja
    getEmoji(name) {
        return this.emojis[name] || null;
    },

    // Mengecek warna. Jika tidak ada, kembalikan Aqua (Primary)
    getColor(name) {
        return this.colors[name] || this.colors.primary;
    },

    // Mengecek banner. Jika tidak ada, kembalikan null agar Discord tidak error saat melampirkan file
    getBanner(name) {
        return this.banners[name] || null;
    },

    createProgressBar: function (current, max, length = 10) {
        const percent = Math.min(Math.max(current / max, 0), 1);
        const filledLength = Math.round(length * percent);
        const emptyLength = length - filledLength;
        
        const filledBar = this.emojis.bar_filled.repeat(filledLength);
        const emptyBar = this.emojis.bar_empty.repeat(emptyLength);
        
        return `${filledBar}${emptyBar}`;
    },

    // Standardisasi Error Message
    async sendError(interaction, errorMessage, ephemeral = false) {
        const { ErrorEmbed } = require('../utils/NauraEmbedBuilder');
        const embed = new ErrorEmbed()
            .setDescription(`${this.getEmoji('error')} ${errorMessage}`);

        try {
            if (interaction.deferred || interaction.replied) {
                return await interaction.editReply({ embeds: [embed], components: [], files: [] });
            } else {
                return await interaction.reply({ embeds: [embed], ephemeral: ephemeral });
            }
        } catch (e) {
            logger.error('[UI SendError]', e);
        }
    }
};