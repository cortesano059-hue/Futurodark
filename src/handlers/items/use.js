const { EmbedBuilder } = require("discord.js");
const safeReply = require("@safeReply");
const eco = require("@economy");
const requirements = require("@src/economy/requirementsEngine");
const actions = require("@src/economy/actionsEngine");

module.exports = async (interaction) => {
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;

  const name = interaction.options.getString("nombre");
  const qty = interaction.options.getInteger("cantidad") || 1;

  const item = await eco.getItemByName(guildId, name);
  if (!item) return safeReply(interaction, "❌ Ese item no existe.");

  if (!item.usable)
    return safeReply(interaction, `❌ El item **${item.itemName}** no es usable.`);

  if (item.inventory) {
    const inv = await eco.getUserInventory(userId, guildId);
    const owned = inv.find(i => i.itemName.toLowerCase() === name.toLowerCase());

    if (!owned || owned.amount < qty)
      return safeReply(interaction, `❌ No tienes suficientes **${item.itemName}**.`);
  }

  const userData = {
    money: (await eco.getBalance(userId, guildId)).money,
    inventory: await eco.getUserInventory(userId, guildId),
  };

  const valid = await requirements.validateRequirements(interaction, item, userData);
  if (!valid.success) return safeReply(interaction, valid.message);

  const msgs = await actions.executeActions(interaction, item, userId, guildId);

  if (item.inventory) {
    await eco.removeItem(userId, guildId, name, qty);
  }

  const embed = new EmbedBuilder()
    .setTitle(`🧪 Usaste ${item.itemName}`)
    .setColor("#2ecc71")
    . setDescription(msgs.length ? msgs.join("\n") : "✔️ Item usado.")
    .addFields({ name: "Cantidad usada", value: `${qty}` });

  return safeReply(interaction, { embeds: [embed] });
};
