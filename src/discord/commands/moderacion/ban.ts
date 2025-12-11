import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import safeReply from '@src/utils/safeReply';
import ThemedEmbed from '@src/utils/ThemedEmbed';

try {

    module.exports = {
        data: new SlashCommandBuilder()
            .setName('ban')
            .setDescription('Banear usuario.')
            .addUserOption(o => o.setName('target').setDescription('Usuario').setRequired(true))
            .addStringOption(o => o.setName('razon').setDescription('Motivo'))
            .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

        async execute(interaction) {
            await interaction.deferReply({ });

            try {
                const target = interaction.options.getMember('target');
                if (!target) {
                    return await safeReply(interaction, {
                        embeds: [ThemedEmbed.error('Usuario no encontrado', '❌ No se pudo encontrar al usuario especificado.')]
                    });
                }

                await target.ban({ reason: interaction.options.getString('razon') || 'Sin motivo' });

                const embed = ThemedEmbed.success('Usuario Baneado', `✅ ${target.user.tag} ha sido baneado.`)
                    .setFooter({ text: `Acción ejecutada por ${interaction.user.username}` })
                    .setTimestamp();

                return await safeReply(interaction, { embeds: [embed] });

            } catch (e) {
                console.error('❌ ERROR AL EJECUTAR COMANDO ban.js:', e);

                const embed = ThemedEmbed.error('Error', '❌ No tengo permisos suficientes o ocurrió un error.')
                    .setFooter({ text: `Intentado por ${interaction.user.username}` })
                    .setTimestamp();

                return await safeReply(interaction, { embeds: [embed] });
            }
        }
    };
} catch (e) {
    console.error('❌ ERROR EN COMANDO ban.js:', e);
}
