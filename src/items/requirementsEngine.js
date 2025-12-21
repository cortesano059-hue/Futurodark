// src/items/requirementsEngine.js

const eco = require("@economy");

module.exports = async function checkRequires(item, ctx) {
  if (!Array.isArray(item.requirements)) return true;

  const { user, guild } = ctx;
  if (!user || !guild) throw new Error("INVALID_CONTEXT");

  for (const req of item.requirements) {
    if (typeof req !== "string") continue;

    const parts = req.split(":");
    const type = parts[0];

    /* ===== ROLE ===== */
    if (type === "role") {
      const roleId = parts[1];
      const member = await guild.members.fetch(user.id).catch(() => null);
      if (!member || !member.roles.cache.has(roleId)) {
        throw new Error("REQUIRE_ROLE");
      }
    }

    /* ===== ITEM ===== */
    if (type === "item") {
      const itemName = parts[1];
      const amount = Number(parts[2] ?? 1);

      const inv = await eco.getUserInventory(user.id, guild.id);
      const slot = inv.find(
        i => i.itemName.toLowerCase() === itemName.toLowerCase()
      );

      if (!slot || slot.amount < amount) {
        throw new Error("REQUIRE_ITEM");
      }
    }

    /* ===== MONEY ===== */
    if (type === "money") {
      const amount = Number(parts[1] ?? 0);
      const bal = await eco.getBalance(user.id, guild.id);

      if (bal.money < amount) {
        throw new Error("REQUIRE_MONEY");
      }
    }
  }

  return true;
};
