const safeReply = require("@src/utils/safeReply");
const { Backpack } = require("@database/mongodb");
const escapeRegex = require("@src/utils/escapeRegex");
const { canManageBackpack, isAdmin } = require("@src/utils/backpackAccess");

module.exports = async interaction => {
  const guildId = interaction.guild.id;
  const member = interaction.member;

  const mochilaName = interaction.options.getString("mochila");
  const accion = interaction.options.getString("accion"); // add | remove
  const targetUser = interaction.options.getUser("usuario");
  const targetRole = interaction.options.getRole("rol");
  const adminFlag = interaction.options.getBoolean("admin") === true;

  if (!targetUser && !targetRole) {
    return safeReply(
      interaction,
      "❌ Debes indicar un usuario o un rol.",
      true
    );
  }

  const regex = new RegExp(`^${escapeRegex(mochilaName)}$`, "i");
  const bp = await Backpack.findOne({ guildId, name: regex });

  if (!bp) {
    return safeReply(interaction, "❌ Mochila no encontrada.", true);
  }

  if (!canManageBackpack(bp, member) && !(isAdmin(member) && adminFlag)) {
    return safeReply(
      interaction,
      "❌ No tienes permisos para autorizar esta mochila.",
      true
    );
  }

  if (accion === "add") bp.accessType = "custom";

  if (targetUser) {
    const id = targetUser.id;
    if (accion === "add") {
      if (!bp.allowedUsers.includes(id)) bp.allowedUsers.push(id);
    } else {
      bp.allowedUsers = bp.allowedUsers.filter(u => u !== id);
    }
  }

  if (targetRole) {
    const id = targetRole.id;
    if (accion === "add") {
      if (!bp.allowedRoles.includes(id)) bp.allowedRoles.push(id);
    } else {
      bp.allowedRoles = bp.allowedRoles.filter(r => r !== id);
    }
  }

  if (bp.allowedUsers.length === 0 && bp.allowedRoles.length === 0) {
    bp.accessType = "owner_only";
  }

  await bp.save();

  return safeReply(
    interaction,
    `✅ Permisos actualizados para **${bp.name}**.`,
    true
  );
};
