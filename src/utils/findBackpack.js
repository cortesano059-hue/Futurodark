//src/utils/findBackpack.js

const { Backpack } = require("@database/mongodb");
const escapeRegex = require("@src/utils/escapeRegex");
const { canAccessBackpack, isAdmin } = require("@src/utils/backpackAccess");

/**
 * Busca una mochila por nombre respetando permisos
 *
 * @param {Object} params
 * @param {string} params.guildId
 * @param {GuildMember} params.member
 * @param {string} params.name
 * @param {boolean} [params.forceAdmin=false]  // ignora permisos si es admin
 */
async function findBackpack({
  guildId,
  member,
  name,
  forceAdmin = false,
}) {
  if (!guildId || !member || !name) return null;

  const regex = new RegExp(`^${escapeRegex(name)}$`, "i");

  // 🔓 Admin forzado → cualquiera
  if (forceAdmin && isAdmin(member)) {
    return Backpack.findOne({ guildId, name: regex });
  }

  // 🔍 Buscar todas con ese nombre
  const backpacks = await Backpack.find({ guildId, name: regex });

  // 🔐 Devolver la primera accesible
  return backpacks.find(bp => canAccessBackpack(bp, member)) || null;
}

module.exports = findBackpack;
