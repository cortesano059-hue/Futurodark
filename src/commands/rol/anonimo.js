const { SlashCommandBuilder } = require('discord.js');
const safeReply = require("@src/utils/safeReply.js");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('anonimo')
        .setDescription('Envía un mensaje anónimo.')
        .addStringOption(o => o
            .setName('mensaje')
            .setDescription('Contenido')
            .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ });

        try {
            const text = interaction.options.getString('mensaje');

            // Embed anónimo, sin asociar usuario
            const embed = new ThemedEmbed()
                .setTitle('🕵️ Mensaje Anónimo')
                .setColor('#000001')
                .setDescription(text)
                .setFooter({ text: 'Identidad Oculta', iconURL: 'https://cdn-icons-png.flaticon.com/512/4645/4645305.png' })
                .setTimestamp();

            await safeReply(interaction, { embeds: [embed] });
        } catch (err) {
            console.error('❌ Error en anonimo.js:', err);
            await safeReply(interaction, { content: '❌ Ocurrió un error al enviar el mensaje anónimo.' });
        }
    }
};
