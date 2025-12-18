const { PermissionFlagsBits } = require("discord.js");

/**
 * ¿Es admin del servidor?
 */
function isAdmin(member) {
  if (!member || !member.guild) return false;
  if (member.id === member.guild.ownerId) return true;
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

/**
 * ¿Puede VER / ABRIR una mochila?
 */
function canAccessBackpack(backpack, member) {
  if (!backpack || !member) return false;

  // 🔑 Admin siempre
  if (isAdmin(member)) return true;

  // 🔑 Fallback legacy: ownerId manda
  if (backpack.ownerId && backpack.ownerId === member.id) {
    return true;
  }

  // 👥 Mochila por rol
  if (
    backpack.ownerType === "role" &&
    backpack.ownerId &&
    member.roles?.cache?.has(backpack.ownerId)
  ) {
    return true;
  }

  // 🔐 owner_only
  if (backpack.accessType === "owner_only") return false;

  // 👤 Usuario autorizado
  if (
    Array.isArray(backpack.allowedUsers) &&
    backpack.allowedUsers.includes(member.id)
  ) {
    return true;
  }

  // 🛡️ Rol autorizado
  if (
    Array.isArray(backpack.allowedRoles) &&
    backpack.allowedRoles.some(roleId =>
      member.roles?.cache?.has(roleId)
    )
  ) {
    return true;
  }

  return false;
}

/**
 * ¿Puede METER / SACAR items?
 */
function canModifyBackpack(backpack, member) {
  if (!backpack || !member) return false;

  // Admin
  if (isAdmin(member)) return true;

  // Dueño (fallback incluido)
  if (backpack.ownerId && backpack.ownerId === member.id) {
    return true;
  }

  // Usuarios autorizados
  if (
    Array.isArray(backpack.allowedUsers) &&
    backpack.allowedUsers.includes(member.id)
  ) {
    return true;
  }

  // Roles autorizados
  if (
    Array.isArray(backpack.allowedRoles) &&
    backpack.allowedRoles.some(roleId =>
      member.roles?.cache?.has(roleId)
    )
  ) {
    return true;
  }

  return false;
}

/**
 * ¿Puede CAMBIAR permisos?
 */
function canManageBackpack(backpack, member) {
  if (!backpack || !member) return false;

  if (isAdmin(member)) return true;

  if (backpack.ownerId && backpack.ownerId === member.id) {
    return true;
  }

  return false;
}

module.exports = {
  isAdmin,
  canAccessBackpack,
  canModifyBackpack,
  canManageBackpack,
};
