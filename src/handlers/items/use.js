const { runItem } = require("@items/engine");
const checkRequires = require("@items/requirementsEngine");
const eco = require("@economy");
const { EmbedBuilder } = require("discord.js");

module.exports = async function useHandler(interaction) {
  // ⚠️ UNA sola respuesta
  await interaction.deferReply({ ephemeral: true });

  try {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const itemName = interaction.options.getString("nombre");
    const cantidad = interaction.options.getInteger("cantidad") ?? 1;

    const item = await eco.getItemByName(guildId, itemName);
    if (!item) {
      return interaction.editReply("❌ Ese item no existe.");
    }

    if (!item.usable) {
      return interaction.editReply("❌ Este item no se puede usar.");
    }

    /* ================= CONTEXTO ================= */
    const ctx = {
      interaction,
      guild: interaction.guild,
      user: interaction.user,
      member: interaction.member,
      item,

      customMessage: null,
      rolesGiven: [],
      itemsGiven: {},
      money: {
        money: { add: 0, remove: 0 },
        bank: { add: 0, remove: 0 },
      },
    };

    /* ================= REQUISITOS ================= */
    await checkRequires(item, ctx);

    /* ================= CONSUMIR ITEM ================= */
    const removed = await eco.removeItem(userId, guildId, itemName, cantidad);
    if (!removed?.success) {
      return interaction.editReply("❌ No tienes suficientes items.");
    }

    /* ================= ACTIONS ================= */
    // Blindaje: las actions no pueden responder
    delete ctx.interaction;
    await runItem(item, ctx);

    /* ================= CONSTRUIR TEXTO ================= */
    const lines = [];

    // Mensaje personalizado
    if (typeof ctx.customMessage === "string" && ctx.customMessage.length > 0) {
      lines.push(`**${ctx.customMessage}**`, "");
    }

    // Items recibidos
    if (Object.keys(ctx.itemsGiven).length > 0) {
      for (const [name, qty] of Object.entries(ctx.itemsGiven)) {
        if (qty > 0) {
          lines.push(`📦 Has recibido **${name} x${qty}**`);
        }
      }
      lines.push("");
    }

    // Roles otorgados
    if (ctx.rolesGiven.length > 0) {
      for (const roleId of ctx.rolesGiven) {
        lines.push(`🎭 Has recibido el rol <@&${roleId}>`);
      }
      lines.push("");
    }

    /* ================= DINERO (TEXTO NATURAL) ================= */
    const moneyLines = [];

    // Efectivo recibido
    if (ctx.money.money.add > 0) {
      moneyLines.push(
        `💰 Has recibido **${ctx.money.money.add.toLocaleString("es-ES")} $** en efectivo`
      );
    }

    // Banco recibido
    if (ctx.money.bank.add > 0) {
      moneyLines.push(
        `🏦 Has recibido **${ctx.money.bank.add.toLocaleString("es-ES")} $** en el banco`
      );
    }

    // Efectivo quitado
    if (ctx.money.money.remove > 0) {
      moneyLines.push(
        `💸 Te han quitado **${ctx.money.money.remove.toLocaleString("es-ES")} $** en efectivo`
      );
    }

    // Banco quitado
    if (ctx.money.bank.remove > 0) {
      moneyLines.push(
        `🏦 Te han quitado **${ctx.money.bank.remove.toLocaleString("es-ES")} $** del banco`
      );
    }

    if (moneyLines.length > 0) {
      lines.push(...moneyLines, "");

      const balance = await eco.getBalance(userId, guildId);
      lines.push(
        `💼 **En mano:** ${balance.money.toLocaleString("es-ES")}`,
        `🏦 **En el banco:** ${balance.bank.toLocaleString("es-ES")}`
      );
    }

    if (lines.length === 0) {
      lines.push("_El item no produjo ningún efecto visible._");
    }

    /* ================= EMBED ÚNICO ================= */
    const embed = new EmbedBuilder()
      .setTitle(`✅ Has usado x${cantidad} ${item.itemName}`)
      .setDescription(lines.join("\n"))
      .setColor(0x2ecc71)
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });

  } catch (err) {
    console.error("❌ Error en /item usar:", err);

    if (err?.message === "REQUIRE_NOT_MET") {
      return interaction.editReply(
        "❌ No cumples los requisitos para usar este item."
      );
    }

    return interaction.editReply("❌ Error interno al usar el item.");
  }
};