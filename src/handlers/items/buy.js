const { EmbedBuilder } = require("discord.js");
const eco = require("@economy");
const safeReply = require("@safeReply");
const requirements = require("@src/economy/requirementsEngine");
const actions = require("@src/economy/actionsEngine");

module.exports = async function buy(interaction) {
  const guildId = interaction.guild.id;
  const userId = interaction.user.id;

  const name = interaction.options.getString("nombre");
  const qty = interaction.options.getInteger("cantidad");
  const payWith = interaction.options.getString("pagar_con") || "money";

  const item = await eco.getItemByName(guildId, name);
  if (!item) return safeReply(interaction, "❌ Ese item no existe.");

  // ───── STOCK (solo validar, no mostrar) ─────
  if (item.stock !== -1 && item.stock < qty)
    return safeReply(interaction, "❌ Stock insuficiente.");

  const balance = await eco.getBalance(userId, guildId);
  const total = item.price * qty;

  // ───── VALIDAR SALDO ─────
  if (payWith === "money" && balance.money < total)
    return safeReply(interaction, "❌ No tienes suficiente dinero en mano.");

  if (payWith === "bank" && balance.bank < total)
    return safeReply(interaction, "❌ No tienes suficiente dinero en el banco.");

  // ───── REQUISITOS ─────
  const valid = await requirements.validateRequirements(interaction, item, {
    money: balance.money,
    bank: balance.bank,
    inventory: await eco.getUserInventory(userId, guildId),
  });

  if (!valid.success) return safeReply(interaction, valid.message);

  // ───── COBRAR ─────
  if (payWith === "money") {
    await eco.removeMoney(userId, guildId, total);
  } else {
    await eco.withdraw(userId, guildId, total);
  }

  // ───── DAR ITEM ─────
  await eco.addToInventory(userId, guildId, item.itemName, qty);

  // ───── STOCK ─────
  if (item.stock !== -1) {
    item.stock -= qty;
    if (item.stock < 0) item.stock = 0;
    await item.save();
  }

  // ───── ACCIONES ─────
  const msgs = await actions.executeActions(
    interaction,
    item,
    userId,
    guildId
  );

  const newBalance = await eco.getBalance(userId, guildId);

  // ───── EMBED LIMPIO ─────
  const embed = new EmbedBuilder()
    .setColor("#2ecc71")
    .setTitle("🛒 Compra realizada")
    .setDescription(
      `Has comprado **${qty}x ${item.itemName}** por **$${total.toLocaleString()}**`
    )
    .addFields(
      {
        name: "💵 Dinero en mano",
        value: `$${newBalance.money.toLocaleString()}`,
        inline: true,
      },
      {
        name: "🏦 Dinero en banco",
        value: `$${newBalance.bank.toLocaleString()}`,
        inline: true,
      },
      {
        name: "💳 Método de pago",
        value: payWith === "money" ? "Mano" : "Banco",
        inline: true,
      }
    );

  if (msgs.length) {
    embed.addFields({
      name: "⚙️ Acciones",
      value: msgs.join("\n").slice(0, 1024),
    });
  }

  return safeReply(interaction, { embeds: [embed] });
};
