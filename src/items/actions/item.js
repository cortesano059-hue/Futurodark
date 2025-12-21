// src/items/actions/item.js

const eco = require("@economy");

module.exports = async (action, ctx) => {
  try {
    const { user, guild } = ctx;
    if (!user || !guild) return;

    const { mode, itemName, amount } = action;
    const qty = Number(amount ?? 1);
    if (!itemName || qty <= 0) return;

    if (mode === "add") {
      await eco.addToInventory(user.id, guild.id, itemName, qty);
    }

    if (mode === "remove") {
      await eco.removeItem(user.id, guild.id, itemName, qty);
    }

  } catch (err) {
    console.error("❌ Error en action item:", err);
  }
};
