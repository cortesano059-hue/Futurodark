const safeReply = require("@src/utils/safeReply");

const { Backpack } = require("@database/mongodb");
const eco = require("@economy");

const findBackpack = require("@src/utils/findBackpack");
const { canAccessBackpack, isAdmin } = require("@src/utils/backpackAccess");

module.exports = async interaction => {
  const guildId = interaction.guild.id;
  const member = interaction.member;

  const backpackName = interaction.options.getString("mochila");
  const itemName = interaction.options.getString("item");
  const amount = interaction.options.getInteger("cantidad") || 1;

  /* ---------------------------------------------------- */
  /* BUSCAR MOCHILA (RESPETA PERMISOS)                    */
  /* ---------------------------------------------------- */

  const bp = await findBackpack({
    guildId,
    member,
    name: backpackName,
  });

  if (!bp) {
    return safeReply(
      interaction,
      "❌ No existe esa mochila o no tienes acceso.",
      true
    );
  }

  /* ---------------------------------------------------- */
  /* PERMISO PARA MODIFICAR                              */
  /* ---------------------------------------------------- */

  if (!canAccessBackpack(bp, member) && !isAdmin(member)) {
    return safeReply(
      interaction,
      "❌ No tienes permiso para meter items en esta mochila.",
      true
    );
  }

  /* ---------------------------------------------------- */
  /* ITEM                                                */
  /* ---------------------------------------------------- */

  const item = await eco.getItemByName(guildId, itemName);
  if (!item) {
    return safeReply(interaction, "❌ Ese item no existe.", true);
  }

  /* ---------------------------------------------------- */
  /* INVENTARIO USUARIO                                  */
  /* ---------------------------------------------------- */

  const inventory = await eco.getUserInventory(member.id, guildId);
  const invSlot = inventory.find(
    s => s.itemName.toLowerCase() === item.itemName.toLowerCase()
  );

  if (!invSlot || invSlot.amount < amount) {
    return safeReply(
      interaction,
      "❌ No tienes suficientes de ese item.",
      true
    );
  }

  /* ---------------------------------------------------- */
  /* CAPACIDAD (POR SLOT, NO POR CANTIDAD)               */
  /* ---------------------------------------------------- */

  const slotIndex = bp.items.findIndex(
    s => String(s.itemId) === String(item._id)
  );

  // Si es item nuevo y no hay slots libres → bloquear
  if (slotIndex === -1 && bp.items.length >= bp.capacity) {
    return safeReply(
      interaction,
      "❌ La mochila no tiene más slots libres.",
      true
    );
  }

  /* ---------------------------------------------------- */
  /* MOVER ITEM                                          */
  /* ---------------------------------------------------- */

  await eco.removeItem(member.id, guildId, item.itemName, amount);

  if (slotIndex === -1) {
    bp.items.push({
      itemId: item._id,
      amount,
    });
  } else {
    bp.items[slotIndex].amount += amount;
  }

  await bp.save();

  /* ---------------------------------------------------- */
  /* RESPUESTA                                           */
  /* ---------------------------------------------------- */

  return safeReply(
    interaction,
    `📥 Has metido **${amount}× ${item.itemName}** en **${bp.name}**.`,
    true
  );
};
