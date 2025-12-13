// src/utils/backpackAccess.js
const { PermissionFlagsBits } = require("discord.js");

function isAdmin(member) {
  if (!member || !member.guild) return false;
  if (member.id === member.guild.ownerId) return true;
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

function canAccessBackpack(backpack, member) {
  if (!backpack || !member) return false;

  // Admin
  if (isAdmin(member)) return true;

  // Dueño
  if (backpack.ownerId === member.id) return true;

  // owner_only → no hay más permisos
  if (backpack.accessType === "owner_only") return false;

  // Usuarios permitidos
  if (Array.isArray(backpack.allowedUsers) && backpack.allowedUsers.includes(member.id))
    return true;

  // Roles permitidos
  if (
    member.roles?.cache &&
    backpack.allowedRoles?.some(roleId => member.roles.cache.has(roleId))
  )
    return true;

  return false;
}

module.exports = { isAdmin, canAccessBackpack };