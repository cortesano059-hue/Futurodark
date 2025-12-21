const safeReply = require("@safeReply");
const { Item } = require("@database/mongodb");

module.exports = async (interaction) => {
  const guildId = interaction.guild.id;
  const name = interaction.options.getString("nombre");

  const item = await Item.findOne({ guildId, itemName: name });
  if (!item) {
    return safeReply(interaction, "❌ Ese item no existe.");
  }

  const updates = {
    itemName: interaction.options.getString("nuevo_nombre"),
    price: interaction.options.getInteger("precio"),
    description: interaction.options.getString("descripcion"),
    emoji: interaction.options.getString("emoji"),
    inventory: interaction.options.getBoolean("inventariable"),
    usable: interaction.options.getBoolean("usable"),
    sellable: interaction.options.getBoolean("vendible"),
    stock: interaction.options.getInteger("stock"),
    timeLimit: interaction.options.getInteger("tiempo"),
  };

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      item[key] = value;
    }
  });

  await item.save();

  return safeReply(
    interaction,
    "✅ Item actualizado correctamente.\n(No se han modificado acciones ni requisitos)"
  );
};
