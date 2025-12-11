import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import safeReply from "@src/utils/safeReply.js";
import ThemedEmbed from "@src/utils/ThemedEmbed.js";

const command = {
    data: new SlashCommandBuilder()
        .setName('ooc')
        .setDescription('Hablar fuera de rol.')
        .addStringOption((o: any) => o
            .setName('mensaje')
            .setDescription('Texto')
            .setRequired(true)
        ),

    async execute(interaction: CommandInteraction) {
        await interaction.deferReply({ });

        try {
            const text = interaction.options.getString('mensaje');
            
            const embed = new ThemedEmbed(interaction)
                .setTitle('🛡️ Fuera de Rol (OOC)')
                .setColor('#95A5A6') // Gris
                .setDescription(text);

            await safeReply(interaction, { embeds: [embed] });
        } catch (err) {
            console.error('Error en ooc.ts:', err);
            await safeReply(interaction, { content: 'Error al enviar el mensaje OOC.' });
        }
    }
};

export default command;
