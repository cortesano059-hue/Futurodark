import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import ThemedEmbed from '@src/utils/ThemedEmbed';
import eco from '@economy';
import safeReply from '@src/utils/safeReply';

try {

    module.exports = {
        data: new SlashCommandBuilder()
            .setName('removemoney')
            .setDescription('Quitar dinero a un usuario (Admin).')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
            .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad').setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

        async execute(interaction) {
            await interaction.deferReply({ });

            try {
                const member = interaction.options.getMember('usuario');
                const targetUser = member?.user || interaction.options.getUser('usuario');

                if (!targetUser) {
                    return await safeReply(interaction, ThemedEmbed.error('Error', 'Usuario no encontrado.'));
                }

                const amount = interaction.options.getInteger('cantidad');
                if (amount <= 0) {
                    return await safeReply(interaction, ThemedEmbed.error('Error', 'Cantidad inválida.'));
                }

                // Retirar dinero
                await eco.removeMoney(targetUser.id, interaction.guild.id, amount);

                // Obtener balance actualizado
                const balance = await eco.getBalance(targetUser.id, interaction.guild.id);

                const embed = new ThemedEmbed(interaction)
                    .setTitle('💸 Dinero Retirado')
                    .setColor('#e74c3c')
                    .setDescription(`Se han quitado **$${amount}** a **${targetUser.tag}**.\n` +
                                    `💰 Balance actualizado: **$${balance.balance}** (Banco: **${balance.bank}**)`);

                return await safeReply(interaction, { embeds: [embed] });

            } catch (err) {
                console.error('❌ ERROR al ejecutar removemoney:', err);
                return await safeReply(interaction, ThemedEmbed.error('Error', 'No se pudo retirar el dinero.'));
            }
        }
    };
} catch (e) {
    console.error('❌ ERROR EN COMANDO removemoney.js:', e);
}
