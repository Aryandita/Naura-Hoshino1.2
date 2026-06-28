const { logger } = require('../../../../src/managers/logger');
// ==========================================
// 🔊 AUDIO & SFX MANAGER (GLOBAL)
// ==========================================
if (!document.getElementById('sfxPlayer')) {
    const sfx = document.createElement('audio');
    sfx.id = 'sfxPlayer';
    sfx.src = '/assets/click.mp3'; 
    document.body.appendChild(sfx);
}
if (!document.getElementById('bgmPlayer')) {
    const bgm = document.createElement('audio');
    bgm.id = 'bgmPlayer';
    bgm.src = '/assets/bgmusic.mp3'; 
    bgm.loop = true;
    document.body.appendChild(bgm);
}

const sfxPlayer = document.getElementById('sfxPlayer');
const bgmPlayer = document.getElementById('bgmPlayer');

function playSfx() {
    if (localStorage.getItem('sfxEnabled') !== 'false') {
        sfxPlayer.currentTime = 0;
        sfxPlayer.play().catch(()=>{});
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('button, a').forEach(el => {
        el.addEventListener('click', playSfx);
    });
});

function initBGM() {
    const bgmVol = localStorage.getItem('bgmVolume') || 0.3;
    const bgmEnabled = localStorage.getItem('bgmEnabled') || 'true';
    const savedTime = sessionStorage.getItem('bgmTime');

    bgmPlayer.volume = bgmVol;
    if (savedTime) bgmPlayer.currentTime = parseFloat(savedTime);

    if (bgmEnabled === 'true') {
        bgmPlayer.play().catch(() => {
            document.body.addEventListener('click', () => bgmPlayer.play(), { once: true });
        });
    }

    setInterval(() => {
        if (!bgmPlayer.paused) sessionStorage.setItem('bgmTime', bgmPlayer.currentTime);
    }, 1000);
}
initBGM();

// ==========================================
// 🎨 PERSONALISASI (TEMA & BACKGROUND)
// ==========================================
function changeTheme(colorCode) {
    document.documentElement.style.setProperty('--active-bg', colorCode);
    localStorage.setItem('dashboardTheme', colorCode);
}

function changeLofiBg(bgPath) {
    if (bgPath === 'none') {
        document.body.style.backgroundImage = 'radial-gradient(at 0% 0%, rgba(236, 72, 153, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.15) 0px, transparent 50%)';
        localStorage.removeItem('dashboardLofiBg');
        document.documentElement.style.setProperty('--active-bg', localStorage.getItem('dashboardTheme') || '#0b0f19'); 
    } else {
        document.body.style.backgroundImage = `linear-gradient(rgba(11, 15, 25, 0.75), rgba(11, 15, 25, 0.75)), url('${bgPath}')`;
        localStorage.setItem('dashboardLofiBg', bgPath);
    }
}

const savedLofi = localStorage.getItem('dashboardLofiBg');
if (savedLofi) changeLofiBg(savedLofi);
else {
    const savedTheme = localStorage.getItem('dashboardTheme');
    if (savedTheme) changeTheme(savedTheme);
}

// ==========================================
// 📱 FULLSCREEN MENU & TABS LOGIC
// ==========================================
function toggleFsMenu() {
    const menu = document.getElementById('fsMenu');
    if(menu) menu.classList.toggle('open');
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.getElementById('btn-' + tabId).classList.add('active');
}

const bgmToggle = document.getElementById('bgmToggle');
const bgmVolInput = document.getElementById('bgmVolInput');
const sfxToggle = document.getElementById('sfxToggle');

if(bgmToggle) {
    bgmToggle.checked = localStorage.getItem('bgmEnabled') !== 'false';
    bgmToggle.addEventListener('change', (e) => {
        localStorage.setItem('bgmEnabled', e.target.checked);
        if(e.target.checked) bgmPlayer.play();
        else bgmPlayer.pause();
    });
}
if(bgmVolInput) {
    bgmVolInput.value = localStorage.getItem('bgmVolume') || 0.3;
    bgmVolInput.addEventListener('input', (e) => {
        bgmPlayer.volume = e.target.value;
        localStorage.setItem('bgmVolume', e.target.value);
    });
}
if(sfxToggle) {
    sfxToggle.checked = localStorage.getItem('sfxEnabled') !== 'false';
    sfxToggle.addEventListener('change', (e) => {
        localStorage.setItem('sfxEnabled', e.target.checked);
    });
}

// ==========================================
// 👤 FETCH STATS & USER LOGIN DATA
// ==========================================
const OWNER_ID = '795241173009825853';

async function fetchData() {
    // 1. Fetch Main Stats
    try {
        // PERBAIKAN: Gunakan path relatif, bukan URL statis dengan port 3053
        const res = await fetch('/api/stats');
        const data = await res.json();
        
        if(document.getElementById('botName')) document.getElementById('botName').innerText = data.botName;
        if(document.getElementById('botAvatar')) document.getElementById('botAvatar').src = data.avatar;
        if(document.getElementById('statPing')) document.getElementById('statPing').innerText = data.ping;
        if(document.getElementById('statServers')) document.getElementById('statServers').innerText = data.servers;
        if(document.getElementById('statUsers')) document.getElementById('statUsers').innerText = data.users.toLocaleString();
        if(document.getElementById('statUptime')) document.getElementById('statUptime').innerText = data.uptime;
    } catch (err) {
        // PERBAIKAN: Munculkan pesan error di console browser agar tidak 'Silent'
        logger.error('Gagal mengambil data /api/stats:', err);
    }

    try {
        const res = await fetch('/api/me');
        const data = await res.json();
        
        const loginContainer = document.getElementById('loginContainer');
        const accountData = document.getElementById('accountData');
        const ownerArea = document.getElementById('ownerArea'); 
        
        if (data.loggedIn) {
            const avatarUrl = data.user.avatar ? `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png';

            if(loginContainer) {
                loginContainer.innerHTML = `
                    <div class="flex items-center gap-4 bg-gray-800 p-4 rounded-2xl border border-white/10 mb-4">
                        <img src="${avatarUrl}" class="w-16 h-16 rounded-full border-2 border-pink-400">
                        <div>
                            <p class="text-white font-bold text-xl">${data.user.username}</p>
                            <p class="text-xs text-green-400"><i class="fa-solid fa-circle text-[8px] mr-1"></i>Connected</p>
                        </div>
                    </div>
                    <a href="/auth/logout" class="block text-center w-full bg-red-500/20 hover:bg-red-500/40 text-red-400 font-bold py-3 rounded-xl transition">
                        <i class="fa-solid fa-right-from-bracket mr-2"></i> Logout
                    </a>
                `;
            }

            if (data.db && accountData) {
                accountData.classList.remove('hidden');
                document.getElementById('accWallet').innerText = `Rp ${data.db.economy_wallet.toLocaleString('id-ID')}`;
                document.getElementById('accBank').innerText = `Rp ${data.db.economy_bank.toLocaleString('id-ID')}`;
                document.getElementById('accVIP').innerHTML = data.db.isPremium ? '<span class="text-pink-400 font-bold"><i class="fa-solid fa-crown mr-1"></i> Premium</span>' : 'Member Biasa';
                
                const invDiv = document.getElementById('accInventory');
                if (data.db.inventory && data.db.inventory.length > 0) {
                    invDiv.innerHTML = data.db.inventory.map(i => `<span class="bg-gray-700 px-3 py-1 rounded-full text-xs mr-2 mb-2 inline-block">${i.name || i}</span>`).join('');
                } else {
                    invDiv.innerHTML = '<span class="text-gray-500 text-sm">Inventory kosong.</span>';
                }
            }

            if (data.user.id === OWNER_ID && ownerArea) {
                ownerArea.classList.remove('hidden');
                ownerArea.classList.add('flex');
            }
        }
    } catch (err) {}
}

fetchData();

// Interval dirubah menjadi 30000ms (30 detik) untuk menghemat CPU usage Node.js
setInterval(fetchData, 30000); 

// --- GOD MODE FUNCTIONS ---
async function updateUserData() {
    const targetId = document.getElementById('targetId').value;
    const wallet = document.getElementById('targetWallet').value;
    const bank = document.getElementById('targetBank').value;
    const premiumSelect = document.getElementById('targetPremium').value;
    const log = document.getElementById('ownerLog');

    if (!targetId) return log.innerText = "❌ Masukkan ID Discord target!";
    log.innerText = "⏳ Memproses injeksi...";

    const payload = { targetId };
    if (wallet) payload.wallet = parseInt(wallet);
    if (bank) payload.bank = parseInt(bank);
    if (premiumSelect !== 'none') payload.isPremium = premiumSelect === 'true';

    try {
        const res = await fetch('/api/owner/update_user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const result = await res.json();
        log.innerHTML = result.success ? `<span class="text-emerald-400">✅ ${result.message}</span>` : `<span class="text-red-400">❌ ${result.error}</span>`;
    } catch (e) { log.innerHTML = `<span class="text-red-400">❌ Gagal menghubungi server.</span>`; }
}

async function triggerRestart() {
    if(!confirm("⚠️ Yakin ingin mematikan (restart) mesin Naura Hoshino secara paksa?")) return;
    try {
        const res = await fetch('/api/owner/restart', { method: 'POST' });
        const data = await res.json();
        alert("💥 " + data.message);
    } catch (e) { alert("Gagal mengirim sinyal restart."); }
}