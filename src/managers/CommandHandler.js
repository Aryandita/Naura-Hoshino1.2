const { REST, Routes, Collection } = require('discord.js');
const { logger } = require('../../src/managers/logger');
const path = require('path');
const glob = require('fast-glob');
const env = require('../config/env');

class CommandHandler {
    constructor(client, commandsPath) {
        this.client = client;
        this.commandsPath = commandsPath;
        if (!client.commands) client.commands = new Collection();
        this.commands = client.commands;
    }

    async load(autoDeploy = false) {
        let commandsArray = [];
        let commandNames = new Set();

        try {
            // Menggunakan fast-glob untuk pencarian rekursif
            // Tanda backslash pada Windows akan diubah ke forward slash oleh fast-glob (disarankan)
            const searchPattern = path.posix.join(this.commandsPath.split(path.sep).join('/'), '**/*.js');
            const commandFiles = await glob(searchPattern);

            for (const filePath of commandFiles) {
                try {
                    delete require.cache[require.resolve(filePath)];
                    const command = require(filePath);

                    // Pastikan file tersebut adalah command yang valid
                    if (('data' in command || 'name' in command) && 'execute' in command) {
                        const cmdName = command.data ? command.data.name : command.name;

                        if (commandNames.has(cmdName)) {
                            console.log(
                                `\x1b[43m\x1b[30m ⚠️ WARNING \x1b[0m \x1b[33mDuplikat command "/${cmdName}" pada file ${path.basename(filePath)}! File dilewati.\x1b[0m`
                            );
                            continue;
                        }

                        commandNames.add(cmdName);

                        // Menentukan kategori berdasarkan nama folder tempat file itu berada
                        // Misalnya plugin/music/subfolder/cmd.js -> kategorinya 'music'
                        const relativePath = path.relative(this.commandsPath, filePath);
                        const category = relativePath.split(path.sep)[0];
                        command.category = category;

                        this.commands.set(cmdName, command);

                        if (command.aliases && Array.isArray(command.aliases)) {
                            command.aliases.forEach(alias => this.commands.set(alias, command));
                        }

                        if (command.data) {
                            commandsArray.push(command.data.toJSON());
                        }
                    }
                } catch (err) {
                    logger.error(`\n\x1b[41m\x1b[37m 💥 ERROR \x1b[0m \x1b[31mGagal memuat file ${filePath}:\x1b[0m`, err.message);
                }
            }

            console.log(
                `\x1b[44m\x1b[37m 📂 COMMANDS \x1b[0m \x1b[34mMemuat ${this.commands.size} command secara lokal.\x1b[0m`
            );

            // ==========================================
            // 🚀 AUTO DEPLOY SLASH COMMANDS
            // ==========================================
            if (commandsArray.length > 0 && autoDeploy) {
                const rest = new REST({ version: '10' }).setToken(env.TOKEN);
                const clientId = env.CLIENT_ID;
                const guildId = env.GUILD_ID;

                if (!clientId)
                    return console.log(
                        '\x1b[41m\x1b[37m 💥 ERROR \x1b[0m \x1b[31mCLIENT_ID tidak ada di .env! Deploy dibatalkan.\x1b[0m'
                    );

                process.stdout.write(
                    '\x1b[43m\x1b[30m ⏳ API \x1b[0m \x1b[33mSinkronisasi Slash Commands ke Discord...\x1b[0m '
                );

                // 1. Daftar secara Global (agar tersedia di semua server, walau ada cache delay)
                await rest.put(Routes.applicationCommands(clientId), { body: commandsArray });
                console.log(
                    `\x1b[42m\x1b[30m ✨ SUCCESS \x1b[0m \x1b[32m(${commandsArray.length} Commands didaftarkan secara Global)\x1b[0m`
                );

                // 2. Daftar ke Guild Spesifik jika ada (ini dijamin 100% instan untuk testing/server utama)
                if (guildId) {
                    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commandsArray });
                    console.log(
                        `\x1b[42m\x1b[30m ✨ SUCCESS \x1b[0m \x1b[32m(${commandsArray.length} Commands instan ke Server ${guildId})\x1b[0m`
                    );
                }
            }
        } catch (error) {
            logger.error('\n\x1b[41m\x1b[37m 💥 ERROR \x1b[0m \x1b[31mGagal memuat atau deploy command:\x1b[0m', error
            );
        }
    }
}

module.exports = { CommandHandler };
