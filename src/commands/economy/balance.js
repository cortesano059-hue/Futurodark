// src/commands/economy/balance.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const safeReply = require("@safeReply");
const eco = require("@economy");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("balance")
        .setDescription("Muestra tu balance o el de otro usuario.")
        .addUserOption(o =>
            o.setName("usuario")
                .setDescription("Usuario (opcional)")
                .setRequired(false)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser("usuario") || interaction.user;
        const guildId = interaction.guild.id;

        try {
            const bal = await eco.getBalance(user.id, guildId);

            if (!bal)
                return safeReply(interaction, "❌ No se pudo obtener el balance.");

            // Valores seguros para evitar undefined
            const money = Number(bal.money || 0);
            const bank = Number(bal.bank || 0);

            const embed = new EmbedBuilder()
                .setTitle(`💰 Balance de ${user.username}`)
                .setColor("#f1c40f")
                .addFields(
                    {
                        name: "🪙 Dinero en mano",
                        value: `${money.toLocaleString()}$`,
                        inline: false
                    },
                    {
                        name: "🏦 Banco",
                        value: `${bank.toLocaleString()}$`,
                        inline: false
                    },
                    {
                        name: "💼 Total",
                        value: `${(money + bank).toLocaleString()}$`,
                        inline: false
                    }
                )

            return safeReply(interaction, { embeds: [embed] });

        } catch (err) {
            console.error("❌ Error en /balance:", err);
            return safeReply(interaction, "❌ Ha ocurrido un error al obtener el balance.");
        }
    }
};
