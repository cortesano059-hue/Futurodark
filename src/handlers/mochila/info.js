const { EmbedBuilder } = require("discord.js");
const safeReply = require("@src/utils/safeReply");
const findBackpack = require("@src/utils/findBackpack");
const { isAdmin } = require("@src/utils/backpackAccess");

module.exports = async interaction => {
  const guildId = interaction.guild.id;
  const member = interaction.member;

  const name = interaction.options.getString("nombre");
  const adminFlag = interaction.options.getBoolean("admin") === true;
  const adminMode = adminFlag && isAdmin(member);

  const bp = await findBackpack({
    guildId,
    member,
    name,
    forceAdmin: adminMode,
  });

  if (!bp) {
    return safeReply(interaction, "❌ No tienes acceso a esa mochila.", true);
  }

  let owner = "❓";
  let access = "—";

  if (bp.ownerType === "user") {
    owner = `👤 <@${bp.ownerId}>`;
    access = "Solo el dueño";
  } else if (bp.ownerType === "role") {
    owner = `🏷️ <@&${bp.ownerId}>`;
    access = "Miembros del rol";
  } else if (bp.ownerType === "system") {
    owner = "⚙️ Sistema";
    access = "Sistema";
  }

  const users =
    bp.allowedUsers?.length
      ? bp.allowedUsers.map(id => `<@${id}>`).join(", ")
      : "—";

  const roles =
    bp.allowedRoles?.length
      ? bp.allowedRoles.map(id => `<@&${id}>`).join(", ")
      : "—";

  const embed = new EmbedBuilder()
    .setColor("#2ecc71")
    .setTitle(`🎒 Mochila: ${bp.name}`)
    .setDescription(bp.description || "Sin descripción")
    .addFields(
      { name: "👤 Dueño", value: owner, inline: true },
      { name: "📦 Capacidad", value: `${bp.items?.length || 0}/${bp.capacity}`, inline: true },
      { name: "🔐 Acceso", value: access },
      { name: "👥 Usuarios autorizados", value: users },
      { name: "🏷️ Roles autorizados", value: roles }
    );

  return safeReply(interaction, { embeds: [embed] });
};
