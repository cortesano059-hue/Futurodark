const safeReply = require("@safeReply");
const eco = require("@economy");

module.exports = async (interaction) => {
  const guildId = interaction.guild.id;
  const name = interaction.options.getString("nombre");

  const ok = await eco.deleteItem(guildId, name);

  if (!ok) {
    return safeReply(interaction, "❌ Ese item no existe.");
  }

  return safeReply(interaction, `🗑️ Item **${name}** eliminado.`);
};
