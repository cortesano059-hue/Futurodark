const { SlashCommandBuilder } = require('discord.js');
const safeReply = require("@src/utils/safeReply.js");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('me')
        .setDescription('Acción de personaje.')
        .addStringOption(o => o
            .setName('texto')
            .setDescription('Acción')
            .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply({ });

        try {
            const text = interaction.options.getString('texto');

            const embed = new ThemedEmbed(interaction)
                .setTitle('🎭 Me')
                .setColor('#9B59B6')
                .setDescription(`${text}`);

            await safeReply(interaction, { embeds: [embed] });
        } catch (err) {
            console.error('❌ Error en me.js:', err);
            await safeReply(interaction, { content: '❌ Ocurrió un error al ejecutar el comando.' });
        }
    }
};
