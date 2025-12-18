const safeReply = require("@safeReply");
const eco = require("@economy");

module.exports = async (interaction) => {
  const guildId = interaction.guild.id;

  const user = interaction.options.getUser("usuario");
  const name = interaction.options.getString("nombre");
  const qty = interaction.options.getInteger("cantidad") ?? 1;

  const result = await eco.removeItem(user.id, guildId, name, qty);

  if (!result.success) {
    return safeReply(interaction, "❌ No tiene suficientes items o el item no existe.");
  }

  return safeReply(
    interaction,
    `🗑️ Quitado **${qty}x ${name}** a <@${user.id}>.`
  );
};
