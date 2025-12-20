const safeReply = require("@utils/safeReply");
const { Item } = require("@database/mongodb");
const { runItem } = require("@items/engine");

module.exports = {
  customId: "shop_buy",

  async execute(interaction) {
    try {
      // =============================
      // OBTENER ITEM SELECCIONADO
      // =============================
      const selectedItemName =
        interaction.message?.components?.[0]?.components?.[0]?.data?.value ||
        interaction.message?.components?.[0]?.components?.[0]?.options?.find(o => o.default)?.value;

      if (!selectedItemName) {
        return safeReply(interaction, {
          content: "❌ No se ha seleccionado ningún item.",
          ephemeral: true
        });
      }

      // =============================
      // BUSCAR ITEM EN BD
      // =============================
      const item = await Item.findOne({ name: selectedItemName });
      if (!item) {
        return safeReply(interaction, {
          content: "❌ El item seleccionado no existe.",
          ephemeral: true
        });
      }

      // =============================
      // EJECUTAR COMPRA (ENGINE)
      // =============================
      await runItem(item, {
        trigger: "buy",
        interaction,
        user: interaction.user,
        guild: interaction.guild
      });

      // =============================
      // RESPUESTA FINAL
      // =============================
      await safeReply(interaction, {
        content: `✅ Has comprado **${item.displayName ?? item.name}** correctamente.`,
        ephemeral: true
      });

    } catch (err) {
      console.error("Error en shopHandler:", err);

      if (err.message === "REQUIRE_NOT_MET") {
        return safeReply(interaction, {
          content: "❌ No cumples los requisitos para comprar este item.",
          ephemeral: true
        });
      }

      return safeReply(interaction, {
        content: "❌ Ha ocurrido un error al procesar la compra.",
        ephemeral: true
      });
    }
  }
};
