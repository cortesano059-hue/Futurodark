const { SlashCommandBuilder } = require('discord.js');
const safeReply = require("@src/utils/safeReply.js");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ooc')
        .setDescription('Hablar fuera de rol.')
        .addStringOption(o => o
            .setName('mensaje')
            .setDescription('Texto')
            .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply({ });

        try {
            const text = interaction.options.getString('mensaje');
            
            const embed = new ThemedEmbed(interaction)
                .setTitle('🛡️ Fuera de Rol (OOC)')
                .setColor('#95A5A6') // Gris
                .setDescription(text);

            await safeReply(interaction, { embeds: [embed] });
        } catch (err) {
            console.error('❌ Error en ooc.js:', err);
            await safeReply(interaction, { content: '❌ Ocurrió un error al enviar el mensaje OOC.' });
        }
    }
};
