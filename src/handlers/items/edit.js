const safeReply = require("@safeReply");
const eco = require("@economy");

module.exports = async (interaction) => {
  const guildId = interaction.guild.id;

  const name = interaction.options.getString("nombre");
  const item = await eco.getItemByName(guildId, name);

  if (!item) {
    return safeReply(interaction, "❌ Ese item no existe.");
  }

  const newName = interaction.options.getString("nuevo_nombre");
  const price = interaction.options.getInteger("precio");
  const desc = interaction.options.getString("descripcion");
  const emoji = interaction.options.getString("emoji");
  const inventory = interaction.options.getBoolean("inventariable");
  const usable = interaction.options.getBoolean("usable");
  const sellable = interaction.options.getBoolean("vendible");
  const stock = interaction.options.getInteger("stock");
  const time = interaction.options.getInteger("tiempo");
  const req = interaction.options.getString("requisitos");
  const act = interaction.options.getString("acciones");

  if (newName) item.itemName = newName;
  if (price !== null) item.price = price;
  if (desc !== null) item.description = desc;
  if (emoji) item.emoji = emoji;

  if (inventory !== null) item.inventory = inventory;
  if (usable !== null) item.usable = usable;
  if (sellable !== null) item.sellable = sellable;

  if (stock !== null) item.stock = stock;
  if (time !== null) item.timeLimit = time;

  if (req !== null) {
    item.requirements = req
      ? req.split(";").map(t => t.trim())
      : [];
  }

  if (act !== null) {
    item.actions = act
      ? act.split(";").map(t => t.trim())
      : [];
  }

  await item.save();

  return safeReply(
    interaction,
    `✏️ Item **${item.itemName}** actualizado.`
  );
};
