const { SlashCommandBuilder, PermissionFlagsBits, REST, Routes } = require('discord.js');
try {
    const safeReply = require("@src/utils/safeReply.js");
    const ThemedEmbed = require("@src/utils/ThemedEmbed.js");

    module.exports = {
        data: new SlashCommandBuilder()
            .setName('borrarlocales')
            .setDescription('Elimina TODOS los comandos registrados solo en este servidor.')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

        async execute(interaction) {
            // Seguridad extra: solo el owner puede borrar
            if (interaction.user.id !== process.env.OWNER_ID) {
                return await safeReply(interaction, { 
                    embeds: [ThemedEmbed.error('Acceso Denegado', '❌ Solo el dueño del bot puede usar esto.')] 
                });
            }

            await interaction.deferReply({ });

            try {
                const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

                // Borra todos los comandos locales del servidor
                await rest.put(
                    Routes.applicationGuildCommands(process.env.CLIENT_ID, interaction.guild.id),
                    { body: [] });

                const embed = new ThemedEmbed(interaction)
                    .setTitle('✅ Comandos Locales Eliminados')
                    .setDescription('Se han eliminado correctamente todos los comandos locales de este servidor.\nAhora solo deberían verse los comandos globales.')
                    .setColor('Green')
                    .setFooter({ text: `Ejecutado por ${interaction.user.username}` })
                    .setTimestamp();

                await safeReply(interaction, { embeds: [embed] });

            } catch (error) {
                console.error('❌ ERROR AL EJECUTAR BORRAR LOCALES:', error);
                await safeReply(interaction, { 
                    embeds: [ThemedEmbed.error('Error Crítico', `❌ ${error.message}`)] 
                });
            }
        },
    };
} catch(e) {
    console.error('❌ ERROR EN COMANDO borrarlocales.js:', e);
}
