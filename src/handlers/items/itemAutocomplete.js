// src/handlers/items/itemAutocomplete.js
const eco = require("@economy");

module.exports = {
  async execute(interaction) {
    // Solo nos interesa el autocomplete del nombre del item
    const focused = interaction.options.getFocused(true);
    if (focused.name !== "nombre") {
      return interaction.respond([]);
    }

    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();

    let items = [];

    /* =====================================================
       /item usar → inventario del usuario que ejecuta
    ===================================================== */
    if (sub === "usar") {
      const inv = await eco.getUserInventory(interaction.user.id, guildId);
      items = inv.map(i => i.itemName);
    }

    /* =====================================================
       /item quitar → inventario del usuario seleccionado
    ===================================================== */
    else if (sub === "quitar") {
      const target = interaction.options.getUser("usuario");
      if (!target) {
        return interaction.respond([]);
      }

      const inv = await eco.getUserInventory(target.id, guildId);
      items = inv.map(i => i.itemName);
    }

    /* =====================================================
       resto de subcomandos → todos los items del servidor
    ===================================================== */
    else {
      const all = await eco.getAllItems(guildId);
      items = all.map(i => i.itemName);
    }

    const filtered = items
      .filter(name =>
        name.toLowerCase().includes(focused.value.toLowerCase())
      )
      .slice(0, 25);

    return interaction.respond(
      filtered.map(name => ({ name, value: name }))
    );
  },
};
