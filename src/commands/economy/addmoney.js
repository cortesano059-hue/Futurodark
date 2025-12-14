const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
try {
    const ThemedEmbed = require("@src/utils/ThemedEmbed.js");
    const eco = require('@economy');
    const safeReply = require("@src/utils/safeReply.js");
    const logger = require("@logger"); 

    module.exports = {
        data: new SlashCommandBuilder()
            .setName('addmoney')
            .setDescription('Añadir dinero a un usuario (Admin).')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
            .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad').setRequired(true))
            .addStringOption(o => o.setName('destino')
                .setDescription('Destino del dinero')
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
                const targetUser = interaction.options.getMember('usuario');
                const destination = interaction.options.getString('destino');
                const guildId = interaction.guild.id;

                if (!targetUser) return safeReply(interaction, ThemedEmbed.error('Error', 'Usuario no encontrado.'));

                const amount = interaction.options.getInteger('cantidad');
                if (amount <= 0) return safeReply(interaction, ThemedEmbed.error('Error', 'Cantidad inválida.'));
                
                let actionSuccess = false;

                if (destination === "money") {
                    // Añadir a Dinero en Mano
                    actionSuccess = await eco.addMoney(targetUser.id, guildId, amount, 'admin_addmoney');
                } else if (destination === "bank") {
                    // Añadir al Banco
                    const userDoc = await eco.getUser(targetUser.id, guildId);
                    if (userDoc) {
                        userDoc.bank = (userDoc.bank || 0) + amount;
                        await userDoc.save();
                        
                        logger.logTransaction?.({
                            userId: targetUser.id,
                            guildId: guildId,
                            type: 'admin_addbank',
                            amount: amount,
                            to: 'bank',
                        });
                        actionSuccess = true;
                    }
                }
                
                if (!actionSuccess) {
                    return safeReply(interaction, ThemedEmbed.error('Error', 'No se pudo añadir el dinero.'));
                }

                // Obtener balance actualizado
                const balance = await eco.getBalance(targetUser.id, guildId);

                const embed = new ThemedEmbed(interaction)
                    .setTitle('💰 Dinero Añadido')
                    // FIX: Usar la Mención del usuario
                    .setDescription(`Se han añadido **$${amount.toLocaleString()}** a ${targetUser} en su **${destination === "money" ? "cartera" : "banco"}**.`)
                    .addFields(
                        { name: 'Dinero en Mano', value: `$${(balance.money ?? 0).toLocaleString()}`, inline: true }, 
                        { name: 'Dinero en Banco', value: `$${(balance.bank ?? 0).toLocaleString()}`, inline: true }
                    )
                    .setThumbnail(targetUser.user.displayAvatarURL({ dynamic: true }))
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