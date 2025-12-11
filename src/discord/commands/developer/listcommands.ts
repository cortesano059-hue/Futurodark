import { SlashCommandBuilder, PermissionFlagsBits, REST, Routes } from 'discord.js';
import safeReply from '@src/utils/safeReply';

// Función para dividir texto en partes de máximo 1024 chars
function chunkText(text, max = 1024) {
    const chunks = [];
    while (text.length > max) {
        chunks.push(text.slice(0, max));
        text = text.slice(max);
    }
    chunks.push(text);
    return chunks;
}

const command = {
    data: new SlashCommandBuilder()
        .setName("listcommands")
        .setDescription("Muestra solo los comandos globales y sus IDs.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
        const appId = process.env.CLIENT_ID;

        try {
            // --- SOLO globales ---
            const response = await rest.get(Routes.applicationCommands(appId));
            const global = Array.isArray(response) ? response : [];

            // Texto de lista
            const globalList = global.length
                ? global.map(c => `🌍 **${c.name}** — ID: \`${c.id}\``).join("\n")
                : "❌ No hay comandos globales.";

            const embed = {
                title: "📋 Lista de Comandos Globales",
                color: 0x00aaff,
                fields: [],
                timestamp: new Date().toISOString()
            };

            // Dividir si es demasiado largo
            const globalChunks = chunkText(globalList);
            globalChunks.forEach((chunk, i) => {
                embed.fields.push({
                    name: `🌍 Globales ${globalChunks.length > 1 ? `(Parte ${i + 1})` : ""}`,
                    value: chunk || "—"
                });
            });

            return safeReply(interaction, { embeds: [embed] });

        } catch (error) {
            console.error("❌ Error en /listcommands:", error);
            return safeReply(interaction, "❌ Error al obtener los comandos globales.");
        }
    }
};

export default command;
