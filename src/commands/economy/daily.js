const { SlashCommandBuilder } = require('discord.js');
try {
    const ThemedEmbed = require("@src/utils/ThemedEmbed.js");
    const eco = require('@economy');
    const safeReply = require("@src/utils/safeReply.js");
    const { getEconomyConfig } = require("@economyConfig");
    const logger = require("@logger"); // <-- NUEVA IMPORTACIÓN

    const { daily: dailyConfig } = getEconomyConfig();
    const COOLDOWN_TIME = dailyConfig.cooldown;
    const MIN_AMOUNT = dailyConfig.min;
    const MAX_AMOUNT = dailyConfig.max;

    module.exports = {
        data: new SlashCommandBuilder()
            .setName('daily')
            .setDescription('Reclama tu recompensa diaria.'),

        async execute(interaction) {
            await interaction.deferReply({ ephemeral: false });
            try {
                const userId = interaction.user.id;
                const guildId = interaction.guild.id;

                const cooldownTime = COOLDOWN_TIME;
                const balance = await eco.getBalance(userId, guildId);
                const lastClaim = balance.dailyClaim || 0;
                const now = Date.now();

                if (now < lastClaim + cooldownTime) {
                    const remaining = lastClaim + cooldownTime - now;
                    const hours = Math.floor(remaining / 3600000);
                    const minutes = Math.floor((remaining % 3600000) / 60000);
                    const seconds = Math.floor((remaining % 60000) / 1000);

                    return await safeReply(interaction, {
                        embeds: [ThemedEmbed.error(
                            '⏳ Cooldown Activo',
                            `Ya reclamaste tu daily. Vuelve en ${hours}h ${minutes}m ${seconds}s.`
                        )]
                    });
                }

                const actions = [
                    { text: 'Hoy encontraste un tesoro escondido' },
                    { text: 'Recibiste un pago por un trabajo especial' },
                    { text: 'Tu inversión diaria dio frutos' },
                    { text: 'La suerte estuvo de tu lado hoy' },
                    { text: 'Alguien te recompensó por tu ayuda' }
                ];
                
                const action = actions[Math.floor(Math.random() * actions.length)];
                const amount = Math.floor(Math.random() * (MAX_AMOUNT - MIN_AMOUNT + 1)) + MIN_AMOUNT;

                // --- FIX: Añadir al BANCO directamente ---
                const userDoc = await eco.getUser(userId, guildId);
                if (userDoc) {
                    userDoc.bank = (userDoc.bank || 0) + amount;
                    await userDoc.save();

                    logger.logTransaction?.({
                        userId,
                        guildId,
                        type: 'daily',
                        amount: amount,
                        to: 'bank',
                    });
                }
                // ----------------------------------------
                
                await eco.claimDaily(userId, guildId);

                const newBalance = await eco.getBalance(userId, guildId);

                const embed = new ThemedEmbed(interaction)
                    .setTitle('🎁 Recompensa Diaria')
                    .setColor('#2ecc71')
                    .setDescription(`${action.text} y ganaste **$${amount}**.`)
                    .addFields(
                        { name: 'Usuario', value: `${interaction.user.tag}`, inline: true },
                        // --- FIX: Se corrige newBalance.balance por newBalance.money ---
                        { name: 'Dinero en mano', value: `$${newBalance.money}`, inline: true }, 
                        { name: 'Dinero en el banco', value: `$${newBalance.bank}`, inline: true }
                    );

                return await safeReply(interaction, { embeds: [embed] });

            } catch (err) {
                console.error('❌ ERROR EN COMANDO daily.js:', err);
                return await safeReply(interaction, {
                    embeds: [ThemedEmbed.error('Error', 'No se pudo reclamar la daily.')]
                });
            }
        }
    };
} catch(e) {
    console.error('❌ ERROR EN COMANDO daily.js:', e);
}