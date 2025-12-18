const { EmbedBuilder } = require("discord.js");
const safeReply = require("@src/utils/safeReply");

// IMPORT CORRECTO
const findBackpack = require("@src/utils/findBackpack");
const { Backpack } = require("@database/mongodb");

module.exports = async interaction => {
  const guildId = interaction.guild.id;
  const member = interaction.member;

  const name = interaction.options.getString("nombre");
  const adminFlag = interaction.options.getBoolean("admin") === true;

  /* ------------------------------------------------------------ */
  /* BUSCAR MOCHILA + POPULATE                                    */
  /* ------------------------------------------------------------ */

  let bp;

  if (adminFlag) {
    // Admin forzado: buscamos directamente y populamos
    bp = await Backpack
      .findOne({
        guildId,
        name: new RegExp(`^${name}$`, "i"),
      })
      .populate("items.itemId");
  } else {
    // Usuario normal: usamos findBackpack y luego populate
    bp = await findBackpack({
      guildId,
      member,
      name,
    });

    if (bp) {
      await bp.populate("items.itemId");
    }
  }

  if (!bp) {
    return safeReply(
      interaction,
      "❌ No existe esa mochila o no tienes acceso.",
      true
    );
  }

  /* ------------------------------------------------------------ */
  /* EMBED                                                        */
  /* ------------------------------------------------------------ */

  const usedSlots = bp.items.length;
  const maxSlots = bp.capacity;

  const embed = new EmbedBuilder()
    .setColor("#2ecc71")
    .setTitle(`${bp.emoji || "🎒"} Mochila: ${bp.name}`)
    .setDescription(bp.description || "Sin descripción.")
    .setFooter({
      text: `Capacidad: ${usedSlots}/${maxSlots}`,
    });

  if (usedSlots === 0) {
    embed.addFields({
      name: "Contenido",
      value: "📦 Vacía",
    });
  } else {
    const content = bp.items
      .filter(s => s.itemId)
      .map(s => {
        const itemName = s.itemId.itemName || "Item desconocido";
        return `• **${itemName}** — Cantidad: ${s.amount.toLocaleString()}`;
      })
      .join("\n")
      .slice(0, 4096);

    embed.addFields({
      name: "Contenido",
      value: content,
    });
  }

  return safeReply(interaction, { embeds: [embed] });
};
