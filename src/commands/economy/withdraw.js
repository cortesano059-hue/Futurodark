const { SlashCommandBuilder } = require("discord.js");
const eco = require("@economy");
const safeReply = require("@src/utils/safeReply.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("withdraw")
        .setDescription("Retira dinero del banco.")
        .addStringOption(option =>
            option.setName("cantidad")
                .setDescription("Cantidad o 'all'")
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const raw = interaction.options.getString("cantidad");

        // Obtener balance del usuario
        const bal = await eco.getBalance(userId, guildId);
        if (!bal)
            return safeReply(interaction, "❌ No se pudo obtener tu balance.", true);

        // Determinar cantidad final
        let amount;

        if (raw.toLowerCase() === "all") {
            if (bal.bank <= 0)
                return safeReply(interaction, "❌ No tienes dinero en el banco.", true);

            amount = bal.bank; // todo el banco
        } else {
            amount = Number(raw);
            if (isNaN(amount) || amount <= 0)
                return safeReply(interaction, "❌ Ingresa una cantidad válida.", true);
        }

        // Procesar retirada
        const result = await eco.withdraw(userId, guildId, amount);

        if (!result.success)
            return safeReply(interaction, "❌ No tienes suficiente dinero en el banco.", true);

        // Obtener valores actualizados
        const newBal = await eco.getBalance(userId, guildId);

        return safeReply(interaction, {
            content: `🏦 Has retirado **$${amount.toLocaleString()}**.\n` +
                     `💵 Ahora tienes **$${newBal.money.toLocaleString()}** en mano.`
        }, true);
    }
};
