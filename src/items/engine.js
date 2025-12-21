// src/items/engine.js

const actionHandlers = require("./actions");

async function runItem(item, ctx) {
  // 🔒 Las actions NO pueden responder a Discord
  delete ctx.interaction;

  if (!item || !Array.isArray(item.actions)) return;

  /* =========================
   * CONTEXTO BASE
   * ========================= */
  ctx.rolesGiven = [];
  ctx.itemsGiven = {};
  ctx.money = {
    money: { add: 0, remove: 0 },
    bank: { add: 0, remove: 0 },
  };
  ctx.customMessage = ctx.customMessage ?? null;

  /* =========================
   * EJECUTAR ACTIONS
   * ========================= */
  for (const action of item.actions) {
    if (typeof action !== "string") continue;

    try {
      const parts = action.split(":");
      const type = parts[0];

      /* ========== ROLE ========== */
      if (type === "role") {
        const roleId = parts[1];
        const mode = parts[2] ?? "add";

        await actionHandlers.role(
          { mode, roleId },
          ctx
        );

        if (mode === "add") ctx.rolesGiven.push(roleId);
      }

      /* ========== MONEY ========== */
      else if (type === "money") {
        const mode = parts[1];
        const amount = Number(parts[2] ?? 0);
        if (amount <= 0) continue;

        await actionHandlers.balance(
          { target: "money", mode, amount },
          ctx
        );

        ctx.money.money[mode] += amount;
      }

      /* ========== BANK ========== */
      else if (type === "bank") {
        const mode = parts[1];
        const amount = Number(parts[2] ?? 0);
        if (amount <= 0) continue;

        await actionHandlers.balance(
          { target: "bank", mode, amount },
          ctx
        );

        ctx.money.bank[mode] += amount;
      }

      /* ========== ITEM ADD ========== */
      else if (type === "item") {
        const itemName = parts[1];
        const amount = Number(parts[2] ?? 1);
        if (amount <= 0) continue;

        await actionHandlers.item(
          { mode: "add", itemName, amount },
          ctx
        );

        ctx.itemsGiven[itemName] =
          (ctx.itemsGiven[itemName] ?? 0) + amount;
      }

      /* ========== ITEM REMOVE ========== */
      else if (type === "itemremove") {
        const itemName = parts[1];
        const amount = Number(parts[2] ?? 1);
        if (amount <= 0) continue;

        await actionHandlers.item(
          { mode: "remove", itemName, amount },
          ctx
        );
      }

      /* ========== MESSAGE ========== */
      else if (type === "message") {
        await actionHandlers.message(
          { text: parts.slice(1).join(":") },
          ctx
        );
      }

    } catch (err) {
      console.error("❌ Error ejecutando action:", action, err);
    }
  }
}

module.exports = {
  runItem,
};
