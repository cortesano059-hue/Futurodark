const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const safeReply = require("@src/utils/safeReply.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("shop")
        .setDescription("Abre el menú de la tienda"),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle("🛒 Tienda del Servidor")
            .setDescription("Pulsa el botón de abajo para abrir la tienda.")
            .setColor("#2b2d31");

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("shop_open")
                .setLabel("🛍️ Abrir tienda")
                .setStyle(ButtonStyle.Primary)
        );

        await safeReply(interaction, {
            embeds: [embed],
            components: [button]
        });
    }
};
