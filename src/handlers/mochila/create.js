const safeReply = require("@src/utils/safeReply");
const { Backpack } = require("@database/mongodb");
const { isAdmin } = require("@src/utils/backpackAccess");

module.exports = async interaction => {
  const member = interaction.member;
  const guildId = interaction.guild.id;

  /* ====================================================== */
  /* PERMISOS                                               */
  /* ====================================================== */

  if (!isAdmin(member)) {
    return safeReply(
      interaction,
      "❌ Solo los administradores pueden crear mochilas.",
      true
    );
  }

  /* ====================================================== */
  /* OPCIONES                                               */
  /* ====================================================== */

  const tipo = interaction.options.getString("tipo"); // user | role | system
  const nombre = interaction.options.getString("nombre");
  const capacidad = interaction.options.getInteger("capacidad") ?? 10;
  const emoji = interaction.options.getString("emoji") ?? null;
  const descripcion = interaction.options.getString("descripcion") ?? null;

  const usuario = interaction.options.getUser("usuario");
  const rol = interaction.options.getRole("rol");

  /* ====================================================== */
  /* VALIDACIONES                                           */
  /* ====================================================== */

  if (tipo === "user" && !usuario) {
    return safeReply(
      interaction,
      "❌ Debes indicar un **usuario** para una mochila personal.",
      true
    );
  }

  if (tipo === "role" && !rol) {
    return safeReply(
      interaction,
      "❌ Debes indicar un **rol** para una mochila comunitaria.",
      true
    );
  }

  if (tipo === "system" && (usuario || rol)) {
    return safeReply(
      interaction,
      "❌ Las mochilas de sistema no tienen usuario ni rol.",
      true
    );
  }

  /* ====================================================== */
  /* OWNER                                                  */
  /* ====================================================== */

  let ownerType = tipo;
  let ownerId = null;

  if (tipo === "user") {
    ownerId = usuario.id;
  }

  if (tipo === "role") {
    ownerId = rol.id;
  }

  /* ====================================================== */
  /* CREACIÓN                                               */
  /* ====================================================== */

  try {
    const backpack = await Backpack.create({
      guildId,
      ownerType,
      ownerId,
      name: nombre,
      emoji,
      description: descripcion,
      capacity: capacidad,
      accessType: "owner_only",
      allowedUsers: [],
      allowedRoles: [],
      items: [],
    });

    return safeReply(
      interaction,
      `✅ Mochila **${backpack.name}** creada correctamente.\n` +
      `Tipo: **${ownerType}**`,
      true
    );
  } catch (err) {
    if (err.code === 11000) {
      return safeReply(
        interaction,
        "❌ Ya existe una mochila con ese nombre en este servidor.",
        true
      );
    }

    console.error("Error creando mochila:", err);

    return safeReply(
      interaction,
      "❌ Error al crear la mochila.",
      true
    );
  }
};
