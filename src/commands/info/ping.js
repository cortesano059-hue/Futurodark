const { SlashCommandBuilder } = require('discord.js');
const mongoose = require("mongoose"); // <--- CAMBIO AQUÍ: Importamos la librería oficial
const safeReply = require("@src/utils/safeReply.js");
const Embed = require("@src/utils/ThemedEmbed.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Muestra la latencia del bot y la base de datos.'),

    async execute(interaction, client) {
        // Deferimos la respuesta para tener tiempo de calcular el ping
        await interaction.deferReply();

        // 1. Medir latencia DB
        const start = Date.now();
        let dbLatency = "Desconectada";

        try {
            // Ahora sí funcionará porque mongoose.connection existe en la librería global
            await mongoose.connection.db.admin().ping();
            dbLatency = `${Date.now() - start}ms`;
        } catch (err) {
            console.error('❌ Error al hacer ping a MongoDB:', err);
            dbLatency = "Error";
        }

        // 2. Uptime del bot
        const uptime = client.uptime;
        const uptimeString = `${Math.floor(uptime / 86400000)}d ${Math.floor((uptime % 86400000) / 3600000)}h ${Math.floor((uptime % 3600000) / 60000)}m ${Math.floor((uptime % 60000) / 1000)}s`;

        // 3. Embed
        const embed = new Embed(interaction)
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 64 }))
            .addFields([
                { name: 'Ping del Bot', value: `> \`${Math.abs(client.ws.ping)}ms\``, inline: true },
                { name: 'Ping de la DB', value: `> \`${dbLatency}\``, inline: true },
                { name: 'Tiempo en Línea', value: `> \`${uptimeString}\``, inline: true },
            ])
            .setFooter({ text: 'Estos tiempos de respuesta son aproximados' });

        return await safeReply(interaction, { embeds: [embed] });
    },
};