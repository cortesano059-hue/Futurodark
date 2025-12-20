const eco = require("@economy");

module.exports = async (action, ctx) => {
  try {
    if (!action?.raw || !ctx?.interaction) return;

    const interaction = ctx.interaction;
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    // Formato: item:nombre:cantidad
    const parts = action.raw.split(":");
    if (parts.length < 2) return;

    const itemName = parts[1];
    let amount = parseInt(parts[2], 10);

    if (!itemName) return;
    if (isNaN(amount) || amount <= 0) amount = 1;

    // ✅ FUNCIÓN REAL DE TU ECONOMY
    await eco.addToInventory(userId, guildId, itemName, amount);

  } catch (err) {
    console.error("❌ Error en action item:", err);
    // No lanzar error para no romper /item usar
  }
};
