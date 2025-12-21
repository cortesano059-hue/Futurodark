const safeReply = require("@safeReply");
const { Item } = require("@database/mongodb");

/* ==========================================================================
 * HELPERS
 * ========================================================================== */

function normalizeArray(arr) {
  return Array.from(new Set(arr));
}

function parseItemString(str) {
  if (!str) return null;

  const parts = str.split(":");
  const name = parts[0];
  const amount = Number(parts[1] ?? 1);

  if (!name || amount <= 0) return null;
  return { name, amount };
}

/* ==========================================================================
 * HANDLER
 * ========================================================================== */

module.exports = async (interaction) => {
  const guildId = interaction.guild.id;
  const itemName = interaction.options.getString("item");

  const item = await Item.findOne({ guildId, itemName });
  if (!item) {
    return safeReply(interaction, "❌ Ese item no existe.");
  }

  // Asegurar arrays
  let actions = Array.isArray(item.actions) ? [...item.actions] : [];
  let requirements = Array.isArray(item.requirements)
    ? [...item.requirements]
    : [];

  /* ==========================================================================
   * ACCIONES
   * ========================================================================== */

  // ===== ROLES =====
  const addRole = interaction.options.getRole("addrole");
  if (addRole) {
    actions.push(`role:${addRole.id}:add`);
  }

  const removeRole = interaction.options.getRole("removerole");
  if (removeRole) {
    actions.push(`role:${removeRole.id}:remove`);
  }

  // ===== DINERO WALLET =====
  const addMoney = interaction.options.getInteger("addmoney");
  if (addMoney && addMoney > 0) {
    actions.push(`money:add:${addMoney}`);
  }

  const removeMoney = interaction.options.getInteger("removemoney");
  if (removeMoney && removeMoney > 0) {
    actions.push(`money:remove:${removeMoney}`);
  }

  // ===== DINERO BANCO =====
  const addMoneyBank = interaction.options.getInteger("addmoneybank");
  if (addMoneyBank && addMoneyBank > 0) {
    actions.push(`bank:add:${addMoneyBank}`);
  }

  const removeMoneyBank = interaction.options.getInteger("removemoneybank");
  if (removeMoneyBank && removeMoneyBank > 0) {
    actions.push(`bank:remove:${removeMoneyBank}`);
  }

  // ===== ITEMS =====
  const addItemRaw = interaction.options.getString("additem");
  const addItem = parseItemString(addItemRaw);
  if (addItem) {
    actions.push(`item:${addItem.name}:${addItem.amount}`);
  }

  const removeItemRaw = interaction.options.getString("removeitem");
  const removeItem = parseItemString(removeItemRaw);
  if (removeItem) {
    actions.push(`itemremove:${removeItem.name}:${removeItem.amount}`);
  }

  // ===== MENSAJE =====
  const message = interaction.options.getString("sendmessage");
  if (message) {
    // solo un mensaje activo → sustituye el anterior
    actions = actions.filter(a => !a.startsWith("message:"));
    actions.push(`message:${message}`);
  }

  /* ==========================================================================
   * REQUISITOS
   * ========================================================================== */

  const requireRole = interaction.options.getRole("requirerole");
  if (requireRole) {
    requirements.push(`role:${requireRole.id}`);
  }

  const requireItemRaw = interaction.options.getString("requireitem");
  const requireItem = parseItemString(requireItemRaw);
  if (requireItem) {
    requirements.push(`item:${requireItem.name}:${requireItem.amount}`);
  }

  const requireMoney = interaction.options.getInteger("requiremoney");
  if (requireMoney && requireMoney > 0) {
    requirements.push(`money:${requireMoney}`);
  }

  /* ==========================================================================
   * FINALIZAR
   * ========================================================================== */

  item.actions = normalizeArray(actions);
  item.requirements = normalizeArray(requirements);

  await item.save();

  return safeReply(
    interaction,
    "✅ Configuración del item actualizada correctamente.\n" +
      "Se han aplicado solo las opciones indicadas."
  );
};
