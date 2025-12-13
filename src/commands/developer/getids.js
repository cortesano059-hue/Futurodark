const { SlashCommandBuilder } = require('discord.js');
try {
    const safeReply = require("@src/utils/safeReply.js");
    const ThemedEmbed = require("@src/utils/ThemedEmbed.js");

    module.exports = {
        data: new SlashCommandBuilder()
            .setName('getids')
            .setDescription('Obtener IDs de usuario/servidor.'),

        async execute(interaction) {
            await interaction.deferReply({ });

            try {
                const embed = new ThemedEmbed(interaction)
                    .setTitle('🆔 Información de IDs')
                    .addFields(
                        { name: 'Tu ID', value: `\`${interaction.user.id}\``, inline: true },
                        { name: 'ID del Servidor', value: `\`${interaction.guild.id}\``, inline: true },
                        { name: 'ID del Canal', value: `\`${interaction.channel.id}\``, inline: true }
                    );

                await safeReply(interaction, { embeds: [embed] });
            } catch (err) {
                console.error('❌ ERROR AL EJECUTAR COMANDO getids.js:', err);
                await safeReply(interaction, { content: '❌ Ocurrió un error al obtener los IDs.' });
            }
        }
    };
} catch (e) {
    console.error('❌ ERROR EN COMANDO getids.js:', e);
}
