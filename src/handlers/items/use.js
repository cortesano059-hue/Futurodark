const { runItem, checkRequires } = require("@items/engine");
const eco = require("@economy");

module.exports = async function useHandler(interaction) {
  // RESPONDER INMEDIATAMENTE
  await interaction.reply({
    content: "⏳ Usando item...",
    ephemeral: true,
  });

  try {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const itemName = interaction.options.getString("nombre");
    const cantidad = interaction.options.getInteger("cantidad") ?? 1;

    const item = await eco.getItemByName(guildId, itemName);
    if (!item) {
      return interaction.editReply("❌ Ese item no existe.");
    }

    if (!item.usable) {
      return interaction.editReply("❌ Este item no se puede usar.");
    }

    // VALIDAR REQUISITOS
    await checkRequires(item, {
      interaction,
      user: interaction.user,
      guild: interaction.guild,
    });

    // CONSUMIR ITEM
    const removed = await eco.removeItem(
      userId,
      guildId,
      itemName,
      cantidad
    );

    if (!removed.success) {
      return interaction.editReply("❌ No tienes suficientes items.");
    }

    // EJECUTAR ACCIONES
    for (let i = 0; i < cantidad; i++) {
      await runItem(item, {
        interaction,
        user: interaction.user,
        guild: interaction.guild,
      });
    }

    // MENSAJE FINAL SI NO HUBO MESSAGE ACTION
    return interaction.editReply("✅ Item usado correctamente.");

  } catch (err) {
    console.error("❌ Error en /item usar:", err);

    if (err.message === "REQUIRE_NOT_MET") {
      return interaction.editReply(
        "❌ No cumples los requisitos para usar este item."
      );
    }

    return interaction.editReply("❌ Error interno al usar el item.");
  }
};
