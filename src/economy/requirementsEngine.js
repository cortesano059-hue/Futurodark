module.exports = {
  async validateRequirements(interaction, item, userData) {
    const reqs = item.requirements || [];
    const member = interaction.member;

    let errors = [];

    for (const req of reqs) {

      /* =====================================================
         🧠 NUEVO FORMATO (OBJETO)
      ===================================================== */
      if (typeof req === "object" && req.type) {

        // ───── ROL ─────
        if (req.type === "role") {
          if (!member.roles.cache.has(req.roleId)) {
            errors.push(`• Necesitas el rol <@&${req.roleId}>`);
          }
        }

        // ───── DINERO (CARTERA) ─────
        if (req.type === "money") {
          if ((userData.money || 0) < req.amount) {
            errors.push(`• Necesitas $${req.amount.toLocaleString()} en cartera`);
          }
        }

        // ───── DINERO (BANCO) ─────
        if (req.type === "bank") {
          if ((userData.bank || 0) < req.amount) {
            errors.push(`• Necesitas $${req.amount.toLocaleString()} en el banco`);
          }
        }

        // ───── ITEM ─────
        if (req.type === "item") {
          const invItem = userData.inventory.find(
            i => i.itemName.toLowerCase() === req.item.toLowerCase()
          );
          const amount = invItem ? invItem.amount : 0;

          if (amount < req.amount) {
            errors.push(`• Necesitas ${req.amount}x ${req.item}`);
          }
        }

        continue; // ⬅️ muy importante
      }

      /* =====================================================
         🧓 FORMATO ANTIGUO (STRING)
      ===================================================== */
      if (typeof req === "string") {
        const parts = req.split(":");
        const type = parts[0];

        // ───── ROL ─────
        if (type === "role") {
          const roleId = parts[1];
          if (!member.roles.cache.has(roleId)) {
            errors.push(`• Necesitas el rol <@&${roleId}>`);
          }
        }

        // ───── DINERO ─────
        if (type === "balance_money" || type === "balance_bank") {
          const compare = parts[1];
          const target = Number(parts[2]);
          const value =
            type === "balance_money"
              ? userData.money
              : userData.bank;

          if (!eval(`${value} ${compare} ${target}`)) {
            errors.push(`• Necesitas ${type.replace("_", " ")} ${compare} ${target}`);
          }
        }

        // ───── ITEM ─────
        if (type === "item") {
          const itemName = parts[1];
          const compare = parts[2];
          const target = Number(parts[3]);

          const invItem = userData.inventory.find(
            i => i.itemName.toLowerCase() === itemName.toLowerCase()
          );
          const amount = invItem ? invItem.amount : 0;

          if (!eval(`${amount} ${compare} ${target}`)) {
            errors.push(`• Necesitas ${itemName} ${compare} ${target}`);
          }
        }
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: "❌ No cumples los requisitos:\n" + errors.join("\n"),
      };
    }

    return { success: true };
  },
};
