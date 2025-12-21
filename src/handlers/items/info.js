const eco = require("@economy");
const { EmbedBuilder } = require("discord.js");

module.exports = async function infoHandler(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const guildId = interaction.guild.id;
    const itemName = interaction.options.getString("nombre");

    const item = await eco.getItemByName(guildId, itemName);
    if (!item) {
      return interaction.editReply("❌ Ese item no existe.");
    }

    /* ======================================================
     * EMBED BASE
     * ====================================================== */
    const embed = new EmbedBuilder()
      .setColor(0x1f2937)
      .setTitle(`${item.emoji ?? "📦"} ${item.itemName}`)
      .setDescription(item.description || "Sin descripción.")
      .setFooter({ text: "Sistema de items • Dark RP" })
      .setTimestamp();

    /* ======================================================
     * INFO DEL ITEM (INLINE GRID)
     * ====================================================== */
    embed.addFields(
      {
        name: "💰 Precio",
        value: `${Number(item.price ?? 0).toLocaleString("es-ES")} $`,
        inline: true,
      },
      {
        name: "🎒 Inventario",
        value: item.inventory ? "Sí" : "No",
        inline: true,
      },
      {
        name: "🧩 Usable",
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
        value:
          item.stock === -1 || item.stock == null
            ? "Ilimitado"
            : item.stock.toString(),
        inline: true,
      },
      {
        name: "⏳ Tiempo límite",
        value: item.timeLimit ? `${item.timeLimit} ms` : "Sin límite",
        inline: true,
      }
    );

    /* ======================================================
     * REQUISITOS
     * ====================================================== */
    if (Array.isArray(item.requirements) && item.requirements.length > 0) {
      const reqLines = [];

      for (const req of item.requirements) {
        if (typeof req !== "string") continue;

        const parts = req.split(":");
        const type = parts[0];

        if (type === "role") {
          reqLines.push(`🎭 Requiere el rol <@&${parts[1]}>`);
        }

        if (type === "money") {
          reqLines.push(
            `💰 Requiere al menos **${Number(parts[1]).toLocaleString("es-ES")} $**`
          );
        }

        if (type === "item") {
          const name = parts[1];
          const qty = Number(parts[2] ?? 1);
          reqLines.push(`📦 Requiere **${name} x${qty}**`);
        }
      }

      embed.addFields({
        name: "🔒 Requisitos",
        value: reqLines.join("\n"),
      });
    }

    /* ======================================================
     * ACCIONES (AGRUPADAS + TEXTO COMPLETO)
     * ====================================================== */
    if (Array.isArray(item.actions) && item.actions.length > 0) {
      const give = [];
      const take = [];
      const extra = [];

      for (const action of item.actions) {
        if (typeof action !== "string") continue;

        const parts = action.split(":");
        const type = parts[0];

        // -------- ROLES --------
        if (type === "role") {
          const roleId = parts[1];
          const mode = parts[2] ?? "add";

          if (mode === "add") {
            give.push(`🎭 Otorga el rol <@&${roleId}>`);
          } else {
            take.push(`🎭 Quita el rol <@&${roleId}>`);
          }
        }

        // -------- MONEY --------
        if (type === "money") {
          const mode = parts[1];
          const amount = Number(parts[2] ?? 0);

          if (mode === "add") {
            give.push(`💰 Da **${amount.toLocaleString("es-ES")} $**`);
          } else {
            take.push(`💸 Quita **${amount.toLocaleString("es-ES")} $**`);
          }
        }

        // -------- BANK --------
        if (type === "bank") {
          const mode = parts[1];
          const amount = Number(parts[2] ?? 0);

          if (mode === "add") {
            give.push(
              `🏦 Añade **${amount.toLocaleString("es-ES")} $** al banco`
            );
          } else {
            take.push(
              `🏦 Retira **${amount.toLocaleString("es-ES")} $** del banco`
            );
          }
        }

        // -------- ITEMS --------
        if (type === "item") {
          give.push(
            `📦 Da **${parts[1]} x${Number(parts[2] ?? 1)}**`
          );
        }

        if (type === "itemremove") {
          take.push(
            `📦 Quita **${parts[1]} x${Number(parts[2] ?? 1)}**`
          );
        }

        // -------- MESSAGE --------
        if (type === "message") {
          extra.push("💬 Muestra un mensaje personalizado");
        }
      }

      const blocks = [];

      if (give.length > 0) {
        blocks.push(`🎁 **Otorga**\n${give.join("\n")}`);
      }

      if (take.length > 0) {
        blocks.push(`📤 **Quita**\n${take.join("\n")}`);
      }

      if (extra.length > 0) {
        blocks.push(`⚙️ **Extra**\n${extra.join("\n")}`);
      }

      if (blocks.length > 0) {
        embed.addFields({
          name: "⚙️ Acciones al usarlo",
          value: blocks.join("\n\n"),
        });
      }
    }

    return interaction.editReply({ embeds: [embed] });

  } catch (err) {
    console.error("❌ Error en /item info:", err);
    return interaction.editReply("❌ Error al mostrar la información del item.");
  }
};
