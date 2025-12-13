const { SlashCommandBuilder } = require('discord.js');
const eco = require("@economy");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");
const safeReply = require("@src/utils/safeReply.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pay")
        .setDescription("Envía dinero a otro usuario.")
        .addUserOption(option =>
            option.setName("usuario")
                .setDescription("Usuario al que pagar")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("cantidad")
                .setDescription("Cantidad a enviar")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("desde")
                .setDescription("Desde dónde enviar el dinero")
                .addChoices(
                    { name: "Dinero en mano", value: "money" },
                    { name: "Banco", value: "bank" }
                )
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const sender = interaction.user;
        const receiver = interaction.options.getUser("usuario");
        const amount = interaction.options.getInteger("cantidad");
        const method = interaction.options.getString("desde");
        const guildId = interaction.guild.id;

        if (receiver.bot)
            return safeReply(interaction, { content: "❌ No puedes pagar a bots.", ephemeral: true });

        if (receiver.id === sender.id)
            return safeReply(interaction, { content: "❌ No puedes pagarte a ti mismo.", ephemeral: true });

        if (amount <= 0)
            return safeReply(interaction, { content: "❌ La cantidad debe ser mayor a 0.", ephemeral: true });

        const senderBal = await eco.getBalance(sender.id, guildId);

        /* ======================================================
           VALIDACIONES
        ====================================================== */
        if (method === "money" && senderBal.money < amount)
            return safeReply(interaction, { content: "❌ No tienes suficiente dinero en mano.", ephemeral: true });

        if (method === "bank" && senderBal.bank < amount)
            return safeReply(interaction, { content: "❌ No tienes suficiente dinero en el banco.", ephemeral: true });

        /* ======================================================
           TRANSFERENCIA REAL SEGÚN MÉTODO
        ====================================================== */

        if (method === "money") {
            // RESTAMOS DE LA MANO DEL EMISOR
            await eco.removeMoney(sender.id, guildId, amount, "money");

            // SUMAMOS A LA MANO DEL RECEPTOR
            await eco.addMoney(receiver.id, guildId, amount, "money");

        } else if (method === "bank") {
            // SACAR DEL BANCO DEL EMISOR
            const withdraw = await eco.withdraw(sender.id, guildId, amount);
            if (!withdraw.success)
                return safeReply(interaction, { content: "❌ Error al retirar del banco.", ephemeral: true });

            // SUMAR AL BANCO DEL RECEPTOR
            const receiverData = await eco.getUser(receiver.id, guildId);
            receiverData.bank += amount;
            await receiverData.save();
        }

        /* ======================================================
           RESULTADOS
        ====================================================== */

        const newSender = await eco.getBalance(sender.id, guildId);
        const newReceiver = await eco.getBalance(receiver.id, guildId);

        const embed = new ThemedEmbed(interaction)
            .setTitle("💸 Transferencia Exitosa")
            .setDescription(
                `Has pagado **$${amount.toLocaleString()}** a ${receiver} desde **${method === "money" ? "tu cartera" : "tu banco"}**.\n` +
                `📤 El dinero fue enviado al **${method === "money" ? "dinero en mano" : "banco"}** del receptor.`
            )
            .addFields(
                {
                    name: "Emisor",
                    value: `${sender}`
                },
                {
                    name: "Dinero en mano",
                    value: `$${newSender.money.toLocaleString()}`,
                    inline: true
                },
                {
                    name: "Banco",
                    value: `$${newSender.bank.toLocaleString()}`,
                    inline: true
                },
                {
                    name: "Receptor",
                    value: `${receiver}`
                },
                {
                    name: "Dinero en mano",
                    value: `$${newReceiver.money.toLocaleString()}`,
                    inline: true
                },
                {
                    name: "Banco",
                    value: `$${newReceiver.bank.toLocaleString()}`,
                    inline: true
                }
            );

        return safeReply(interaction, { embeds: [embed], ephemeral: true });
    }
};
