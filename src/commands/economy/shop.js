const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle} = require("discord.js");
const safeReply = require("@utils/safeReply");
const { Item } = require("@database/mongodb");
const { runItem } = require("@items/engine");
const generateShopEmbed = require("@utils/generateShopEmbed");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Abre la tienda del servidor"),

  async execute(interaction) {
    try {
      // =============================
      // OBTENER ITEMS DE LA TIENDA
      // =============================
      const items = await Item.find({
        price: { $gt: 0 }
      }).lean();

      if (!items.length) {
        return safeReply(interaction, {
          content: "❌ No hay items disponibles en la tienda.",
          ephemeral: true
        });
      }

      // =============================
      // EMBED PRINCIPAL
      // =============================
      const embed = generateShopEmbed(items);

      // =============================
      // SELECT MENU
      // =============================
      const menu = new StringSelectMenuBuilder()
        .setCustomId("shop_select")
        .setPlaceholder("Selecciona un item")
        .addOptions(
          items.map(item => ({
            label: item.displayName ?? item.name,
            value: item.name,
            description: item.description?.slice(0, 100) ?? "Sin descripción"
          }))
        );

      const rowMenu = new ActionRowBuilder().addComponents(menu);

      // =============================
      // BOTONES
      // =============================
      const rowButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("shop_buy")
          .setLabel("Comprar")
          .setStyle(ButtonStyle.Success)
      );

      // =============================
      // RESPUESTA
      // =============================
      await interaction.reply({
        embeds: [embed],
        components: [rowMenu, rowButtons],
        ephemeral: true
      });
    } catch (err) {
      console.error("Error en /shop:", err);
      return safeReply(interaction, {
        content: "❌ Error al abrir la tienda.",
        ephemeral: true
      });
    }
  }
};
