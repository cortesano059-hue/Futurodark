// src/handlers/mochila/add.js
const safeReply = require("@src/utils/safeReply");
const { Backpack } = require("@database/mongodb");
const eco = require("@economy");
const escapeRegex = require("@src/utils/escapeRegex");
const { isAdmin } = require("@src/utils/backpackAccess");

module.exports = async interaction => {
  const guildId = interaction.guild.id;
  const member = interaction.member;

  if (!isAdmin(member)) {
    return safeReply(
      interaction,
      "❌ Solo administradores.",
      true
    );
  }

  const mochilaName = interaction.options.getString("mochila");
  const itemName = interaction.options.getString("item");
  const cantidad = interaction.options.getInteger("cantidad");

  const regex = new RegExp(`^${escapeRegex(mochilaName)}$`, "i");
  const bp = await Backpack.findOne({ guildId, name: regex });

  if (!bp) {
    return safeReply(interaction, "❌ Mochila no encontrada.", true);
  }

  const item = await eco.getItemByName(guildId, itemName);
  if (!item) {
    return safeReply(interaction, "❌ Item no encontrado.", true);
  }

  const slotIndex = bp.items.findIndex(
    s => String(s.itemId) === String(item._id)
  );

  if (slotIndex === -1 && bp.items.length >= bp.capacity) {
    return safeReply(
      interaction,
      "❌ La mochila no tiene más slots.",
      true
    );
  }

  if (slotIndex === -1) {
    bp.items.push({ itemId: item._id, amount: cantidad });
  } else {
    bp.items[slotIndex].amount += cantidad;
  }

  await bp.save();

  return safeReply(
    interaction,
    `✅ Añadido **${cantidad}x ${item.itemName}** a **${bp.name}**.`,
    true
  );
};
