// src/items/actions/balance.js

const eco = require("@economy");

module.exports = async (action, ctx) => {
  try {
    const { user, guild } = ctx;
    if (!user || !guild) return;

    const { mode, amount, target } = action;
    const value = Number(amount);

    if (!["add", "remove"].includes(mode)) return;
    if (!["money", "bank"].includes(target)) return;
    if (!value || value <= 0) return;

    /* =========================
     * APLICAR ECONOMÍA
     * ========================= */

    if (target === "money") {
      if (mode === "add") {
        await eco.addMoney(user.id, guild.id, value);
      } else {
        await eco.removeMoney(user.id, guild.id, value);
      }
    }

    if (target === "bank") {
      if (mode === "add") {
        await eco.addBank(user.id, guild.id, value);
      } else {
        // retirar del banco
        await eco.withdraw(user.id, guild.id, value);
      }
    }

    // ❌ NO tocar ctx.money aquí
    // ❌ NO tocar ctx.moneyChanges
    // El engine se encarga del tracking visual

  } catch (err) {
    console.error("❌ Error en action balance:", err);
  }
};
