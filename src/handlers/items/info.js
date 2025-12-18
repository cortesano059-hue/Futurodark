const { EmbedBuilder } = require("discord.js");
const safeReply = require("@safeReply");
const eco = require("@economy");

module.exports = async (interaction) => {
  const guildId = interaction.guild.id;
  const name = interaction.options.getString("nombre");

  const item = await eco.getItemByName(guildId, name);
  if (!item) return safeReply(interaction, "❌ Ese item no existe.");

  const embed = new EmbedBuilder()
    .setTitle(`${item.emoji} ${item.itemName}`)
    .setColor("#3498db")
    .setDescription(item.description || "Sin descripción.")
    .addFields(
      { name: "💰 Precio", value: `${item.price.toLocaleString()}`, inline: true },
      { name: "📦 Inventariable", value: item.inventory ? "Sí" : "No", inline: true },
      { name: "🧪 Usable", value: item.usable ? "Sí" : "No", inline: true },
      { name: "💸 Vendible", value: item.sellable ? "Sí" : "No", inline: true },
      { name: "📦 Stock", value: item.stock === -1 ? "Ilimitado" : `${item.stock}`, inline: true },
      { name: "⏳ Tiempo límite", value: item.timeLimit === 0 ? "Sin límite" : `${item.timeLimit}ms`, inline: true },
      {
        name: "📋 Requisitos",
        value: item.requirements.length ? item.requirements.join("\n") : "Ninguno",
      },
      {
        name: "⚙️ Acciones",
        value: item.actions.length ? item.actions.join("\n") : "Ninguna",
      }
    );

  return safeReply(interaction, { embeds: [embed] });
};
