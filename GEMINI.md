# To Do List Gemini

Berikut informasi umum yang harus kamu ingat ;
- Selalu gunakan embed di setiap deskripsi yang ada di dalamnya, dengan menggunakan Bahasa Indonesia yang kasual dan hangat.
- Setiap emoji yang ada di deskripsi ambil dari file src/config/ui.js dan apabila tidak ada kamu bisa tambahkan baris baru yang berisi emojinya agar bisa aku modifikasi nanti.

## Bagian 1 : Peningkatan Keamanan & Stabilitas Core

- [x] **Validasi Hierarki Role pada Automod**
  **Deskripsi**: Di dalam sistem pengurang poin tata krama (`messageCreate.js`), ketika poin user mencapai 0 dan bot harus memberikan `punishRole`, tambahkan pengecekan hierarki role *Discord*. Pastikan bot hanya memberikan hukuman jika posisinya lebih tinggi dari user target agar terhindar dari *Missing Permissions error* yang dapat mengganggu *thread* bot.
  **Kebutuhan Emoji (`ui.js`)**: `error`, `success`, `admin`
  **Status**: ✅ Selesai — Logika validasi hierarki role ditambahkan di `messageCreate.js`.

- [x] **Pembersihan Otomatis (Auto-Cleanup) Modmail Terbengkalai**
  **Deskripsi**: Buatlah sistem pembersih otomatis (*interval/cron job*) yang akan mengecek database ModMail. Jika sebuah tiket modmail tidak ada interaksi obrolan selama lebih dari 48 jam, bot akan otomatis menutupnya dengan rapi dan mengirimkan transkrip ke DM user. Ini mencegah batas maksimal channel Discord cepat penuh.
  **Kebutuhan Emoji (`ui.js`)**: `clock`, `ticket`
  **Status**: ✅ Selesai — Interval cleanup setiap 1 jam ditambahkan di `ready.js`. Emoji `ticket` ditambahkan ke `ui.js`.

## Bagian 2 : Peningkatan Performa & Memory (Optimasi)

- [x] **Sistem Caching Lirik Lagu Terintegrasi (Redis)**
  **Deskripsi**: Saat fitur lirik musik dipanggil, simpan teks lirik tersebut ke dalam Redis Cache (dengan masa kedaluwarsa, misal 24 jam) menggunakan *identifier* lagu. Jadi, jika lagu yang sama diputar kembali oleh server lain, bot langsung mengambilnya dari memori tanpa harus membebani API lirik eksternal.
  **Kebutuhan Emoji (`ui.js`)**: `musicLyrics`, `database_ping`, `latency`
  **Status**: ✅ Selesai — Redis cache 24 jam diintegrasikan ke `LyricsManager.js`.

- [x] **Penyempurnaan Error Handling Fallback AI**
  **Deskripsi**: Pada penanganan *chat* AI di `messageCreate.js`, rapikan logika perpindahan otomatis (fallback) dari Verba API ke Gemini. Jika teks balasan AI melebihi 4000 karakter, pastikan algoritma pemotongan karakter (*chunking*) tidak memutus di tengah-tengah *syntax markdown* (seperti ` ``` ` kode atau tebal ` ** `) agar pesan tetap cantik dan rapi saat dikirim ke user.
  **Kebutuhan Emoji (`ui.js`)**: `naura`, `loading`, `info`
  **Status**: ✅ Selesai — Safe-chunking algorithm dengan deteksi code block (`inCodeBlock` flag) sudah terimplementasi di `messageCreate.js`.

- [x] **Manajemen Koneksi Idle Database MySQL**
  **Deskripsi**: Tambahkan logika *keep-alive* yang lebih responsif pada *connection pool* MySQL di `dbManager.js` agar mematikan koneksi yang sudah sangat lama *idle* secara agresif. Ini akan menghemat penggunaan RAM server (Node.js) saat *traffic* interaksi bot sedang sepi, namun tetap sigap saat dibutuhkan mendadak.
  **Kebutuhan Emoji (`ui.js`)**: `stats`, `database_ping`, `greenping`
  **Status**: ✅ Selesai — Pool diperbarui: `idle: 5000`, `acquire: 30000`, `evict: 5000` di `dbManager.js`.

## Bagian 3 : Fitur Baru & Penyempurnaan Pengalaman Pengguna (UI/UX)

- [x] **Statistik Ekonomi Lanjutan di Dashboard**
  **Deskripsi**: Kembangkan antarmuka Dashboard Web dengan menambahkan tab atau grafis diagram sederhana (bisa via Chart.js) untuk menampilkan inflasi server atau total peredaran *Naura Coin* di seluruh *database*. Biar para user makin betah memantau kekayaan ekonomi mereka!
  **Kebutuhan Emoji (`ui.js`)**: `wallet`, `bank`, `coin`
  **Status**: ✅ Selesai — Endpoint `/api/economy_stats` ditambahkan ke `server.js` (dengan Redis cache 5 menit). Panel "Server Economy Overview" ditambahkan ke `index.html` (Private Vault section) beserta auto-refresh setiap 60 detik.

- [x] **Notifikasi "Daily Reward" Otomatis**
  **Deskripsi**: Buat modul *reminder* harian (daily claim) yang akan secara otomatis mengingatkan user melalui DM bahwa hadiah login (Daily/Work/Mining) mereka sudah *cooldown* dan siap diklaim lagi. Berikan opsi tombol interaktif (*Button Component*) agar user bisa mematikannya jika tidak ingin diganggu.
  **Kebutuhan Emoji (`ui.js`)**: `reward`, `lootbox`, `vip`
  **Status**: ✅ Selesai — Interval setiap jam ditambahkan di `ready.js`. Tombol opt-out `daily_notify_off_` dihandle di `interactionCreate.js`. Kolom `dailyNotify` ditambahkan ke model `UserProfile`.

- [x] **Perbaikan Spotify Helper (`spotifyHelper.js`)**  
  **Deskripsi**: Tambahkan validasi URL, perbaiki regex, implementasikan timeout dengan `AbortController`, fallback ke YouTube Search, serta dokumentasi singkat per fungsi.  
  **Kebutuhan Emoji (`ui.js`)**: `spotify`, `error`, `info`
  **Status**: ✅ Selesai — Full rewrite `spotifyHelper.js`: validasi URL (`validateSpotifyUrl`), regex diperbaiki (`[a-zA-Z0-9_-]+`), timeout `AbortController` 8 detik, fallback `buildYoutubeFallback()`, token auto-reset on failure, dan dokumentasi per fungsi.

- [x] **Perbaikan Downloader (`downloader.js`)**  
  **Deskripsi**: Tangani HEAD‑request yang gagal, gunakan `os.tmpdir()` untuk folder sementara, batasi jumlah attachment, perbaiki fallback server Cobalt dengan retry, serta sesuaikan batas ukuran file (25 MB → 100 MB) dan ekstensi berdasarkan MIME.  
  **Kebutuhan Emoji (`ui.js`)**: `download`, `warning`, `success`
  **Status**: ✅ Selesai — Full rewrite `downloader.js`: HEAD→GET-range fallback, `os.tmpdir()`, batas 10 attachment, retry 2x per server dengan exponential backoff, batas 100MB, MIME-to-ext helper inline (tanpa dependency eksternal). Emoji `download` ditambahkan ke `ui.js`.
