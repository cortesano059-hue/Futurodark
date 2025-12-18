const { EmbedBuilder } = require("discord.js");
const safeReply = require("@src/utils/safeReply");
const { Backpack } = require("@database/mongodb");
const { isAdmin } = require("@src/utils/backpackAccess");

module.exports = async interaction => {
  const guildId = interaction.guild.id;
  const member = interaction.member;

  const adminFlag = interaction.options.getBoolean("admin") === true;
  const adminMode = adminFlag && isAdmin(member);

  let backpacks = await Backpack.find({ guildId });

  if (!adminMode) {
    backpacks = backpacks.filter(bp => {
      if (bp.ownerType === "user" && bp.ownerId === member.id) return true;
      if (
        bp.ownerType === "role" &&
        bp.ownerId &&
        member.roles.cache.has(bp.ownerId)
      ) return true;

      if (bp.allowedUsers?.includes(member.id)) return true;
      if (bp.allowedRoles?.some(r => member.roles.cache.has(r))) return true;

      return false;
    });
  }

  if (!backpacks.length) {
    return safeReply(interaction, "🎒 No tienes acceso a ninguna mochila.", true);
  }

  const embed = new EmbedBuilder()
    .setColor(adminMode ? "#e67e22" : "#3498db")
    .setTitle(adminMode ? "🎒 Mochilas (modo admin)" : "🎒 Tus mochilas");

  for (const bp of backpacks) {
    const used = bp.items?.length || 0;
    const max = bp.capacity || 0;

    let owner = "❓";
    if (bp.ownerType === "user") owner = `👤 <@${bp.ownerId}>`;
    else if (bp.ownerType === "role") owner = `🏷️ <@&${bp.ownerId}>`;
    else if (bp.ownerType === "system") owner = "⚙️ Sistema";

    embed.addFields({
      name: `🎒 ${bp.name} — ${used}/${max}`,
      value: `└ ${owner}`,
    });
  }

  embed.setFooter({ text: `Total: ${backpacks.length} mochilas` });

  return safeReply(interaction, { embeds: [embed] });
};
