const eco = require("@economy");

/**
 * Valida los requisitos de un item
 * Lanza Error("REQUIRE_NOT_MET") si falla alguno
 * NUNCA debe quedarse colgado
 */
module.exports = async function checkRequires(item, ctx) {
  if (!item?.requirements || !Array.isArray(item.requirements)) return;

  const interaction = ctx.interaction;
  const user = ctx.user;
  const guild = ctx.guild;

  if (!interaction || !user || !guild) return;

  for (const req of item.requirements) {
    const raw = req.raw || "";

    try {
      // =========================
      // ROLE REQUIRE
      // =========================
      if (req.type === "role") {
        let roleId = raw.replace(/[<@&>]/g, "").split(":").pop();

        const member = await guild.members
          .fetch(user.id)
          .catch(() => null);

        if (!member || !member.roles.cache.has(roleId)) {
          throw new Error("REQUIRE_NOT_MET");
        }
      }

      // =========================
      // ITEM REQUIRE
      // =========================
      if (req.type === "item") {
        const parts = raw.split(":");
        const itemName = parts[1];
        const amount = Number(parts[2] ?? 1);

        const inv = await eco.getUserInventory(user.id, guild.id);
        const slot = inv.find(
          (i) => i.itemName.toLowerCase() === itemName.toLowerCase()
        );

        if (!slot || slot.amount < amount) {
          throw new Error("REQUIRE_NOT_MET");
        }
      }

      // =========================
      // BALANCE REQUIRE
      // =========================
      if (req.type === "balance") {
        const parts = raw.split(":");
        const where = parts[1]; // money | bank
        const amount = Number(parts[2] ?? 0);

        const bal = await eco.getBalance(user.id, guild.id);

        if (where === "money" && bal.money < amount) {
          throw new Error("REQUIRE_NOT_MET");
        }

        if (where === "bank" && bal.bank < amount) {
          throw new Error("REQUIRE_NOT_MET");
        }
      }

    } catch (err) {
      // Cualquier error = requisito no cumplido
      if (err.message === "REQUIRE_NOT_MET") {
        throw err;
      }

      console.error("❌ Error interno en requirementsEngine:", err);
      throw new Error("REQUIRE_NOT_MET");
    }
  }
};
