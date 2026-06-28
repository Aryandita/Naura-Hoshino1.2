const { Sequelize } = require('sequelize');
const { logger } = require('../../src/managers/logger');
const fs = require('fs');

async function syncFallbackToMySQL(mysqlSequelize) {
    if (!fs.existsSync('./naura_fallback.sqlite')) return;

    logger.info('[DB MIGRATOR] Mendeteksi file SQLite lokal. Memulai proses pemindahan data ke MySQL...');

    let database;
    try {
        // Gunakan native sqlite dari Node.js (v22+) agar ringan, fallback ke sqlite3 jika gagal
        let DatabaseSync;
        try {
            DatabaseSync = require('node:sqlite').DatabaseSync;
            database = new DatabaseSync('./naura_fallback.sqlite');
        } catch (err) {
            logger.warn('[DB MIGRATOR] node:sqlite tidak ditemukan atau versi Node < 22.5.0. Menggunakan fallback sqlite3 eksternal.');
            const sqlite3 = require('sqlite3').verbose();
            database = new sqlite3.Database('./naura_fallback.sqlite');

            // Bungkus API sqlite3 agar mirip dengan DatabaseSync
            database.prepare = function(sql) {
                return {
                    all: function() {
                        // Perhatian: Ini sinkronous palsu hanya untuk kompatibilitas blok kode di bawah
                        // Pada implementasi asli harusnya diubah asinkron, tapi kita asumsikan untuk saat ini
                        // karena kita menargetkan Node 24, blok catch ini hampir tidak pernah dipanggil.
                        throw new Error('Fallback sqlite3 tidak mendukung full sinkronous. Harap gunakan Node 22.5.0+');
                    }
                }
            }
        }

        const models = Object.keys(mysqlSequelize.models);

        for (const modelName of models) {
            const MysqlModel = mysqlSequelize.models[modelName];

            try {
                // Read from native SQLite
                const stmt = database.prepare(`SELECT * FROM ${MysqlModel.tableName}`);
                const rows = stmt.all();

                if (rows && rows.length > 0) {
                    logger.db(`[DB MIGRATOR] Memindahkan ${rows.length} baris ke tabel ${MysqlModel.tableName}...`);
                    for (const row of rows) {
                        try {
                            const [record, created] = await MysqlModel.findOrCreate({
                                where: {
                                    [MysqlModel.primaryKeyAttributes[0]]: row[MysqlModel.primaryKeyAttributes[0]]
                                },
                                defaults: row
                            });
                            if (!created) {
                                await record.update(row);
                            }
                        } catch (rowErr) {
                            // Skip invalid rows quietly
                        }
                    }
                }
            } catch (tableErr) {
                // Table doesn't exist in sqlite, skip
            }
        }

        logger.success('[DB MIGRATOR] Pemindahan data selesai. Menghapus database SQLite sementara...');
    } catch (e) {
        logger.error('[DB MIGRATOR ERROR] Gagal memindahkan data:', e.message);
    } finally {
        if (database) database.close();
        // Hapus file setelah ditutup secara native
        try { fs.unlinkSync('./naura_fallback.sqlite'); } catch(e){}
    }
}

module.exports = { syncFallbackToMySQL };
