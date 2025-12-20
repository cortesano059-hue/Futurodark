const safeReply = require("@safeReply");
const { Item } = require("@database/mongodb");

module.exports = async (interaction) => {
  const guildId = interaction.guild.id;
  const name = interaction.options.getString("nombre");

  const item = await Item.findOne({ guildId, itemName: name });
  if (!item) {
    return safeReply(interaction, "❌ Ese item no existe.");
  }

  /* ===============================
   * CAMPOS BÁSICOS
   * =============================== */
  const basicFields = {
    itemName: interaction.options.getString("nuevo_nombre"),
    price: interaction.options.getInteger("precio"),
    description: interaction.options.getString("descripcion"),
    emoji: interaction.options.getString("emoji"),
    inventory: interaction.options.getBoolean("inventariable"),
    usable: interaction.options.getBoolean("usable"),
    sellable: interaction.options.getBoolean("vendible"),
    stock: interaction.options.getInteger("stock"),
    timeLimit: interaction.options.getInteger("tiempo"),
  };

  Object.entries(basicFields).forEach(([k, v]) => {
    if (v !== null && v !== undefined) item[k] = v;
  });

  /* ===============================
   * REQUISITOS (SIEMPRE REEMPLAZAR)
   * =============================== */
  const newRequirements = [];

  const roleRequire = interaction.options.getRole("rolrequire");
  if (roleRequire) {
    newRequirements.push(`role:${roleRequire.id}`);
  }

  // 🔑 CLAVE DEL FIX:
  // Siempre sobrescribimos, incluso si queda vacío
  item.requirements = newRequirements;

  /* ===============================
   * ACCIONES (REEMPLAZAR)
   * =============================== */
  const newActions = [];

  const addRole = interaction.options.getRole("addrol");
  if (addRole) {
    newActions.push(`role:${addRole.id}:add`);
  }

  const addItem = interaction.options.getString("additem");
  if (addItem) {
    newActions.push(`item:${addItem}:1`);
  }

  const message = interaction.options.getString("message");
  if (message) {
    newActions.push(`message:${message}`);
  }

  if (newActions.length > 0) {
    item.actions = newActions;
  }

  await item.save();

  return safeReply(
    interaction,
    "✅ Item actualizado correctamente.\n(Requisitos y acciones reemplazados)"
  );
};
