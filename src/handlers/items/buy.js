const safeReply = require("@safeReply");
const { Item } = require("@database/mongodb");
const { runItem } = require("@items/engine");

module.exports = async function buyHandler(interaction) {
  try {
    const guildId = interaction.guild.id;
    const itemName = interaction.options.getString("nombre");
    const cantidad = interaction.options.getInteger("cantidad") ?? 1;

    const item = await Item.findOne({ guildId, itemName });
    if (!item) {
      return safeReply(interaction, "❌ Ese item no existe.", true);
    }

    for (let i = 0; i < cantidad; i++) {
      await runItem(item, {
        trigger: "buy",
        interaction,
        user: interaction.user,
        guild: interaction.guild,
      });
    }

    return safeReply(
      interaction,
      `✅ Has comprado **${cantidad}x ${item.itemName}**.`,
      true
    );

  } catch (err) {
    console.error("❌ Error en /item comprar:", err);

    if (err.message === "REQUIRE_NOT_MET") {
      return safeReply(interaction, "❌ No cumples los requisitos.", true);
    }

    return safeReply(interaction, "❌ Error al comprar el item.", true);
  }
};
