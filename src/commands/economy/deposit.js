const { SlashCommandBuilder } = require("discord.js");
const eco = require("@economy");
const safeReply = require("@src/utils/safeReply.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("deposit")
        .setDescription("Deposita dinero en el banco.")
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

        // Obtener balance
        const bal = await eco.getBalance(userId, guildId);
        if (!bal)
            return safeReply(interaction, "❌ No se pudo obtener tu balance.", true);

        let amount;

        /* ============================================================
           DETECCIÓN DE "ALL"
        ============================================================ */
        if (raw.toLowerCase() === "all") {
            if (bal.money <= 0)
                return safeReply(interaction, "❌ No tienes dinero en mano.", true);

            amount = bal.money; // todo el dinero en mano
        } else {
            amount = Number(raw);
            if (isNaN(amount) || amount <= 0)
                return safeReply(interaction, "❌ Ingresa una cantidad válida.", true);
        }

        /* ============================================================
           PROCESAR DEPÓSITO
        ============================================================ */
        const result = await eco.deposit(userId, guildId, amount);

        if (!result.success)
            return safeReply(interaction, "❌ No tienes suficiente dinero en mano.", true);

        const newBal = await eco.getBalance(userId, guildId);

        return safeReply(interaction, {
            content:
                `🏦 Has depositado **$${amount.toLocaleString()}**.\n` +
                `💵 Ahora tienes **$${newBal.money.toLocaleString()}** en mano.\n` +
                `🏛️ Banco: **$${newBal.bank.toLocaleString()}**`
        }, true);
    }
};
