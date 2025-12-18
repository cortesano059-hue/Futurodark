const safeReply = require("@safeReply");
const eco = require("@economy");

module.exports = async (interaction) => {
  const guildId = interaction.guild.id;

  const user = interaction.options.getUser("usuario");
  const name = interaction.options.getString("nombre");
  const qty = interaction.options.getInteger("cantidad");

  const ok = await eco.addToInventory(user.id, guildId, name, qty);

  if (!ok) {
    return safeReply(interaction, "❌ Ese item no existe.");
  }

  return safeReply(
    interaction,
    `🎁 Entregado **${qty}x ${name}** a <@${user.id}>.`
  );
};
