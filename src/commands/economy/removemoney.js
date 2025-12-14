const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
try {
    const ThemedEmbed = require("@src/utils/ThemedEmbed.js");
    const eco = require('@economy');
    const safeReply = require("@src/utils/safeReply.js");
    const logger = require("@logger"); 

    module.exports = {
        data: new SlashCommandBuilder()
            .setName('removemoney')
            .setDescription('Quitar dinero a un usuario (Admin).')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
            .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad').setRequired(true))
            .addStringOption(o => o.setName('origen') 
                .setDescription('Desde dónde quitar el dinero')
                .addChoices(
                    { name: "Dinero en mano", value: "money" },
                    { name: "Banco", value: "bank" }
                )
                .setRequired(true)
            )
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

        async execute(interaction) {
            await interaction.deferReply({ });

            try {
                const member = interaction.options.getMember('usuario');
                const targetUser = member?.user || interaction.options.getUser('usuario');
                const source = interaction.options.getString('origen');
                const guildId = interaction.guild.id;

                if (!targetUser) {
                    return await safeReply(interaction, ThemedEmbed.error('Error', 'Usuario no encontrado.'));
                }

                const amount = interaction.options.getInteger('cantidad');
                if (amount <= 0) {
                    return await safeReply(interaction, ThemedEmbed.error('Error', 'Cantidad inválida.'));
                }

                const balance = await eco.getBalance(targetUser.id, guildId);
                let removedAmount = 0;
                let removeResult = { success: false, message: "" };

                // --- LÓGICA DE RETIRO ---
                if (source === "money") {
                    if ((balance.money ?? 0) < amount)
                        return safeReply(interaction, ThemedEmbed.error('Error', 'El usuario no tiene suficiente dinero en mano.'));

                    // Retirar dinero en mano
                    removeResult = await eco.removeMoney(targetUser.id, guildId, amount, 'admin_removemoney');
                    removedAmount = amount;
                } else if (source === "bank") {
                    if ((balance.bank ?? 0) < amount)
                        return safeReply(interaction, ThemedEmbed.error('Error', 'El usuario no tiene suficiente dinero en el banco.'));

                    // Retirar del Banco
                    const userDoc = await eco.getUser(targetUser.id, guildId);
                    if (userDoc) {
                        userDoc.bank = Math.max(0, (userDoc.bank || 0) - amount);
                        await userDoc.save();

                        logger.logTransaction?.({
                            userId: targetUser.id,
                            guildId: guildId,
                            type: 'admin_removebank',
                            amount: -amount, 
                            from: 'bank',
                        });
                        removeResult.success = true;
                        removedAmount = amount;
                    }
                }
                
                if (!removeResult.success) {
                    return safeReply(interaction, ThemedEmbed.error('Error', 'No se pudo retirar el dinero.'));
                }

                // Obtener balance actualizado
                const newBalance = await eco.getBalance(targetUser.id, guildId);

                const embed = new ThemedEmbed(interaction)
                    .setTitle('💸 Dinero Retirado')
                    .setColor('#e74c3c')
                    // FIX: Usar la Mención del usuario
                    .setDescription(`Se han quitado **$${removedAmount.toLocaleString()}** de su **${source === "money" ? "cartera" : "banco"}** a **${member}**.`)
                    .addFields(
                        { name: 'Dinero en Mano', value: `$${(newBalance.money ?? 0).toLocaleString()}`, inline: true },
                        { name: 'Dinero en Banco', value: `$${(newBalance.bank ?? 0).toLocaleString()}`, inline: true }
                    );

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