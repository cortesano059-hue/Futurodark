const safeReply = require("@safeReply");
const eco = require("@economy");

module.exports = async (interaction) => {
  const guildId = interaction.guild.id;

  const name = interaction.options.getString("nombre");
  const price = interaction.options.getInteger("precio");
  const desc = interaction.options.getString("descripcion") || "";
  const emoji = interaction.options.getString("emoji") || "📦";

  const inventory = interaction.options.getBoolean("inventariable");
  const usable = interaction.options.getBoolean("usable");
  const sellable = interaction.options.getBoolean("vendible");
  const stock = interaction.options.getInteger("stock");
  const time = interaction.options.getInteger("tiempo");

  const req = interaction.options.getString("requisitos");
  const act = interaction.options.getString("acciones");

  const exists = await eco.getItemByName(guildId, name);
  if (exists) {
    return safeReply(interaction, "❌ Ya existe ese item.");
  }

  const payload = {
    inventory: inventory ?? true,
    usable: usable ?? false,
    sellable: sellable ?? true,
    stock: stock ?? -1,
    timeLimit: time ?? 0,
    requirements: req ? req.split(";").map(t => t.trim()) : [],
    actions: act ? act.split(";").map(t => t.trim()) : [],
    data: {},
  };

  const item = await eco.createItem(
    guildId,
    name,
    price,
    desc,
    emoji,
    payload
  );

  if (!item) {
    return safeReply(interaction, "❌ No se pudo crear el item.");
  }

  return safeReply(
    interaction,
    `✅ Item **${name}** creado correctamente.`
  );
};
