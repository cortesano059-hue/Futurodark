// src/commands/developer/reloadbot.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import safeReply from '@src/utils/safeReply';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const command = {
    data: new SlashCommandBuilder()
        .setName("reloadbot")
        .setDescription("Recarga comandos, handlers y utils sin reiniciar (Owner Only)."),

    async execute(interaction) {

        // OWNER CHECK
        if (interaction.user.id !== process.env.OWNER_ID) {
            return safeReply(interaction, "❌ Solo el owner del bot puede usar este comando.");
        }

        await interaction.deferReply({ ephemeral: true });

        const client = interaction.client;

        try {
            /* ---------------------------------------------------------
               1️⃣ LIMPIAR CACHE DE CARPETAS IMPORTANTES
            --------------------------------------------------------- */

            const foldersToReload = [
                "commands",
                "handlers",
                "utils"
            ];

            const basePath = path.join(__dirname, "../../");

            for (const folder of foldersToReload) {
                const folderPath = path.join(basePath, folder);
                if (!fs.existsSync(folderPath)) continue;

                const files = getAllFiles(folderPath);

                for (const file of files) {
                    delete require.cache[require.resolve(file)];
                }
            }

            /* ---------------------------------------------------------
               2️⃣ VOLVER A CARGAR COMMANDS AL CLIENTE
            --------------------------------------------------------- */

            client.commands.clear();
            client.commandsArray = [];

            const commandsPath = path.join(basePath, "commands");
            loadCommandsRecursive(client, commandsPath);

            /* ---------------------------------------------------------
               3️⃣ RESPUESTA
            --------------------------------------------------------- */

            const embed = new EmbedBuilder()
                .setTitle("🔄 Bot recargado")
                .setDescription(
                    `Se han recargado:\n` +
                    `• **${client.commandsArray.length} comandos**\n` +
                    `• Handlers y utils\n\n` +
                    `El bot sigue funcionando sin reiniciar.`
                )
                .setColor("Yellow")
                .setTimestamp();

            return safeReply(interaction, { embeds: [embed] });

        } catch (err) {
            console.error("❌ Error en /reloadbot:", err);
            return safeReply(interaction, "❌ Ocurrió un error al recargar el bot.");
        }
    }
};


/* ---------------------------------------------------------
   FUNCIONES AUXILIARES
--------------------------------------------------------- */

function getAllFiles(dir, arr = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const full = path.join(dir, file);
        if (fs.statSync(full).isDirectory()) {
            getAllFiles(full, arr);
        } else if (file.endsWith(".js")) {
            arr.push(full);
        }
    }
    return arr;
}

function loadCommandsRecursive(client, folderPath) {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(folderPath, entry.name);

        if (entry.isDirectory()) {
            loadCommandsRecursive(client, fullPath);
        } else if (entry.name.endsWith(".js")) {
            const cmd = require(fullPath);

            if (cmd?.data?.name) {
                client.commands.set(cmd.data.name, cmd);
                client.commandsArray.push(cmd.data.toJSON());
            }
        }
    }
};

export default command;
