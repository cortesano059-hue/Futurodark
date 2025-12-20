const { EmbedBuilder } = require("discord.js");
const safeReply = require("@safeReply");
const eco = require("@economy");

function formatRequirement(req, guild) {
  if (req.startsWith("role:")) {
    const id = req.split(":")[1];
    return `🛂 **Rol requerido:** <@&${id}>`;
  }

  if (req.startsWith("balance:")) {
    const [, , amount] = req.split(":");
    return `💰 **Dinero requerido:** ${Number(amount).toLocaleString()}`;
  }

  if (req.startsWith("item:")) {
    const [, name, amount = 1] = req.split(":");
    return `📦 **Item requerido:** ${name} x${amount}`;
  }

  return `• ${req}`;
}

function formatAction(act, guild) {
  if (act.startsWith("role:")) {
    const [, id, mode] = act.split(":");
    return mode === "remove"
      ? `➖ **Quita rol:** <@&${id}>`
      : `➕ **Da rol:** <@&${id}>`;
  }

  if (act.startsWith("balance:")) {
    const [, , amount] = act.split(":");
    return amount.startsWith("-")
      ? `➖ **Quita dinero:** ${Number(amount.slice(1)).toLocaleString()}`
      : `➕ **Da dinero:** ${Number(amount).toLocaleString()}`;
  }

  if (act.startsWith("item:")) {
    const [, name, amount = 1] = act.split(":");
    return amount.startsWith("-")
      ? `➖ **Quita item:** ${name} x${Math.abs(amount)}`
      : `📦 **Da item:** ${name} x${amount}`;
  }

  if (act.startsWith("message:")) {
    return `💬 **Mensaje personalizado**`;
  }

  return `• ${act}`;
}

module.exports = async (interaction) => {
  const guildId = interaction.guild.id;
  const name = interaction.options.getString("nombre");

  const item = await eco.getItemByName(guildId, name);
  if (!item) {
    return safeReply(interaction, "❌ Ese item no existe.");
  }

  const embed = new EmbedBuilder()
    .setTitle(`${item.emoji ?? "📦"} ${item.itemName}`)
    .setDescription(item.description || "*Sin descripción*")
    .addFields(
      {
        name: "💰 Precio",
        value: item.price.toLocaleString(),
        inline: true,
      },
      {
        name: "📦 Inventariable",
        value: item.inventory ? "Sí" : "No",
        inline: true,
      },
      {
        name: "🧪 Usable",
        value: item.usable ? "Sí" : "No",
        inline: true,
      },
      {
        name: "🛒 Vendible",
        value: item.sellable ? "Sí" : "No",
        inline: true,
      },
      {
        name: "📦 Stock",
        value: item.stock === -1 ? "Ilimitado" : item.stock.toString(),
        inline: true,
      },
      {
        name: "⏳ Tiempo límite",
        value: item.timeLimit ? `${item.timeLimit} ms` : "Sin límite",
        inline: true,
      }
    );

  /* ===============================
   * REQUISITOS
   * =============================== */
  const requirements = item.requirements?.length
    ? item.requirements.map(r => formatRequirement(r, interaction.guild)).join("\n")
    : "Ninguno";

  embed.addFields({
    name: "📜 Requisitos",
    value: requirements,
  });

  /* ===============================
   * ACCIONES
   * =============================== */
  const actions = item.actions?.length
    ? item.actions.map(a => formatAction(a, interaction.guild)).join("\n")
    : "Ninguna";

  embed.addFields({
    name: "⚙️ Acciones",
    value: actions,
  });

  return interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
};
