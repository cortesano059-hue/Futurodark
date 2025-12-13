const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
try {
    const ThemedEmbed = require("@src/utils/ThemedEmbed.js");
    const eco = require('@economy');
    const safeReply = require("@src/utils/safeReply.js");

    module.exports = {
        data: new SlashCommandBuilder()
            .setName('addmoney')
            .setDescription('Añadir dinero a un usuario (Admin).')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
            .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad').setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

        async execute(interaction) {
            await interaction.deferReply({ });
            try {
                const targetUser = interaction.options.getMember('usuario');
                if (!targetUser) return safeReply(interaction, ThemedEmbed.error('Error', 'Usuario no encontrado.'));

                const amount = interaction.options.getInteger('cantidad');
                if (amount <= 0) return safeReply(interaction, ThemedEmbed.error('Error', 'Cantidad inválida.'));

                await eco.addMoney(targetUser.id, interaction.guild.id, amount);
                const balance = await eco.getBalance(targetUser.id, interaction.guild.id);

                const embed = new ThemedEmbed(interaction)
                    .setTitle('💰 Dinero Añadido')
                    .setDescription(`Se han a��adido **$${amount}** a ${targetUser.tag}.`)
                    .addFields(
                        { name: 'Dinero en Mano', value: `$${balance.balance}`, inline: true },
                        { name: 'Dinero en Banco', value: `$${balance.bank}`, inline: true }
                    )
                    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                    .setColor('#2ecc71');

                return safeReply(interaction, { embeds: [embed] });

            } catch (err) {
                console.error('❌ ERROR EN COMANDO addmoney.js:', err);
                return safeReply(interaction, ThemedEmbed.error('Error', 'No se pudo añadir el dinero.'));
            }
        }
    };
} catch(e) {
    console.error('❌ ERROR EN COMANDO addmoney.js:', e);
}
