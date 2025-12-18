const safeReply = require("@src/utils/safeReply");
const eco = require("@economy");

const findBackpack = require("@src/utils/findBackpack");
const { canAccessBackpack, isAdmin } = require("@src/utils/backpackAccess");

/**
 * /mochila sacar
 * Reglas:
 * - Admin: siempre
 * - Dueño: siempre
 * - Usuarios / roles autorizados: sí
 * - Cantidad resta del slot
 * - Si queda 0 → se elimina el slot
 */
module.exports = async interaction => {
  const guildId = interaction.guild.id;
  const member = interaction.member;

  const mochilaName = interaction.options.getString("mochila");
  const itemName = interaction.options.getString("item");
  const cantidad = interaction.options.getInteger("cantidad") || 1;

  /* ------------------------------------------------------------ */
  /* BUSCAR MOCHILA (RESPETA PERMISOS)                            */
  /* ------------------------------------------------------------ */

  const backpack = await findBackpack({
    guildId,
    member,
    name: mochilaName,
    forceAdmin: interaction.options.getBoolean("admin") === true,
  });

  if (!backpack) {
    return safeReply(
      interaction,
      "❌ No existe esa mochila o no tienes acceso.",
      true
    );
  }

  // Seguridad extra (por coherencia)
  if (!canAccessBackpack(backpack, member)) {
    return safeReply(
      interaction,
      "❌ No tienes permisos para sacar items de esta mochila.",
      true
    );
  }

  /* ------------------------------------------------------------ */
  /* BUSCAR ITEM EN LA MOCHILA                                    */
  /* ------------------------------------------------------------ */

  const item = await eco.getItemByName(guildId, itemName);
  if (!item) {
    return safeReply(interaction, "❌ Ese item no existe.", true);
  }

  const slotIndex = backpack.items.findIndex(
    s => String(s.itemId) === String(item._id)
  );

  if (slotIndex === -1) {
    return safeReply(
      interaction,
      "❌ Esa mochila no contiene ese item.",
      true
    );
  }

  const slot = backpack.items[slotIndex];

  if (slot.amount < cantidad) {
    return safeReply(
      interaction,
      `❌ La mochila solo tiene ${slot.amount} de ese item.`,
      true
    );
  }

  /* ------------------------------------------------------------ */
  /* SACAR ITEM                                                   */
  /* ------------------------------------------------------------ */

  slot.amount -= cantidad;

  // Si llega a 0 → eliminamos el slot completo
  if (slot.amount <= 0) {
    backpack.items.splice(slotIndex, 1);
  }

  await backpack.save();

  // Devolvemos al inventario del usuario
  await eco.addToInventory(
    member.id,
    guildId,
    item.itemName,
    cantidad
  );

  return safeReply(
    interaction,
    `📤 Sacaste **${cantidad}x ${item.itemName}** de **${backpack.name}**.`,
    true
  );
};
