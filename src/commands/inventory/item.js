// src/commands/inventory/item.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");

const safeReply = require("@safeReply");
const eco = require("@economy");

// Handlers
const buyHandler = require("@handlers/items/buy");
const useHandler = require("@handlers/items/use");
const infoHandler = require("@handlers/items/info");
const giveHandler = require("@handlers/items/give");
const removeHandler = require("@handlers/items/remove");
const deleteHandler = require("@handlers/items/delete");
const editHandler = require("@handlers/items/edit");
const createHandler = require("@handlers/items/create");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("item")
    .setDescription("Sistema completo de items del servidor.")

    /* ===============================
     * CREAR
     * =============================== */
    .addSubcommand(sub =>
      sub.setName("crear")
        .setDescription("Crear un item (admins).")
        .addStringOption(o =>
          o.setName("nombre").setDescription("Nombre del item").setRequired(true)
        )
        .addIntegerOption(o =>
          o.setName("precio").setDescription("Precio").setRequired(true)
        )
        .addStringOption(o => o.setName("descripcion").setDescription("Descripción"))
        .addStringOption(o => o.setName("emoji").setDescription("Emoji"))
        .addBooleanOption(o => o.setName("inventariable").setDescription("¿Se guarda en inventario?"))
        .addBooleanOption(o => o.setName("usable").setDescription("¿Se usa con /item usar?"))
        .addBooleanOption(o => o.setName("vendible").setDescription("¿Se puede vender?"))
        .addIntegerOption(o => o.setName("stock").setDescription("Stock (-1 ilimitado)"))
        .addIntegerOption(o => o.setName("tiempo").setDescription("Tiempo límite en ms"))
        .addStringOption(o => o.setName("requisitos").setDescription("Requisitos separados por ;"))
        .addStringOption(o => o.setName("acciones").setDescription("Acciones separados por ;"))
    )

    /* ===============================
     * EDITAR
     * =============================== */
    .addSubcommand(sub =>
      sub.setName("editar")
        .setDescription("Editar un item existente.")
        .addStringOption(o =>
          o.setName("nombre")
            .setDescription("Item actual")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption(o => o.setName("nuevo_nombre").setDescription("Nuevo nombre"))
        .addIntegerOption(o => o.setName("precio").setDescription("Nuevo precio"))
        .addStringOption(o => o.setName("descripcion").setDescription("Nueva descripción"))
        .addStringOption(o => o.setName("emoji").setDescription("Nuevo emoji"))
        .addBooleanOption(o => o.setName("inventariable").setDescription("Inventariable"))
        .addBooleanOption(o => o.setName("usable").setDescription("Usable"))
        .addBooleanOption(o => o.setName("vendible").setDescription("Vendible"))
        .addIntegerOption(o => o.setName("stock").setDescription("Nuevo stock"))
        .addIntegerOption(o => o.setName("tiempo").setDescription("Nuevo tiempo límite"))
        .addStringOption(o => o.setName("requisitos").setDescription("Requisitos"))
        .addStringOption(o => o.setName("acciones").setDescription("Acciones"))
    )

    /* ===============================
     * ELIMINAR
     * =============================== */
    .addSubcommand(sub =>
      sub.setName("eliminar")
        .setDescription("Eliminar un item.")
        .addStringOption(o =>
          o.setName("nombre")
            .setDescription("Nombre")
            .setRequired(true)
            .setAutocomplete(true)
        )
    )

    /* ===============================
     * DAR
     * =============================== */
    .addSubcommand(sub =>
      sub.setName("dar")
        .setDescription("Dar item a un usuario.")
        .addUserOption(o => o.setName("usuario").setDescription("Usuario").setRequired(true))
        .addStringOption(o =>
          o.setName("nombre")
            .setDescription("Item")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addIntegerOption(o => o.setName("cantidad").setDescription("Cantidad").setRequired(true))
    )

    /* ===============================
     * QUITAR
     * =============================== */
    .addSubcommand(sub =>
      sub.setName("quitar")
        .setDescription("Quitar item del usuario.")
        .addUserOption(o => o.setName("usuario").setDescription("Usuario").setRequired(true))
        .addStringOption(o =>
          o.setName("nombre")
            .setDescription("Item")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addIntegerOption(o => o.setName("cantidad").setDescription("Cantidad").setRequired(true))
    )

    /* ===============================
     * COMPRAR
     * =============================== */
    .addSubcommand(sub =>
      sub.setName("comprar")
        .setDescription("Comprar un item.")
        .addStringOption(o =>
          o.setName("nombre")
            .setDescription("Nombre del item")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addIntegerOption(o => o.setName("cantidad").setDescription("Cantidad").setRequired(true))
    )

    /* ===============================
     * INFO
     * =============================== */
    .addSubcommand(sub =>
      sub.setName("info")
        .setDescription("Información detallada del item.")
        .addStringOption(o =>
          o.setName("nombre")
            .setDescription("Item")
            .setRequired(true)
            .setAutocomplete(true)
        )
    )

    /* ===============================
     * USAR
     * =============================== */
    .addSubcommand(sub =>
      sub.setName("usar")
        .setDescription("Usar un item del inventario.")
        .addStringOption(o =>
          o.setName("nombre")
            .setDescription("Item")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addIntegerOption(o => o.setName("cantidad").setDescription("Cantidad"))
    ),

  /* ============================================================
   * AUTOCOMPLETE
   * ============================================================ */
  async autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== "nombre") return;

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    let items = [];

    if (sub === "usar") {
      const inv = await eco.getUserInventory(userId, guildId);
      items = inv.map(i => i.itemName);

    } else if (sub === "quitar") {
      // 🔑 FORMA CORRECTA EN AUTOCOMPLETE
      const targetId = interaction.options.get("usuario")?.value;
      if (!targetId) return interaction.respond([]);

      const inv = await eco.getUserInventory(targetId, guildId);
      items = inv.map(i => i.itemName);

    } else {
      const all = await eco.getAllItems(guildId);
      items = all.map(i => i.itemName);
    }

    const filtered = items
      .filter(n => n.toLowerCase().includes(focused.value.toLowerCase()))
      .slice(0, 25)
      .map(n => ({ name: n, value: n }));

    return interaction.respond(filtered);
  },

  /* ============================================================
   * EXECUTE
   * ============================================================ */
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);
    const adminCmds = ["crear", "editar", "eliminar", "dar", "quitar"];

    if (adminCmds.includes(sub) && !isAdmin) {
      return safeReply(interaction, "❌ No tienes permisos para esto.", true);
    }

    try {
      if (sub === "crear") return createHandler(interaction);
      if (sub === "editar") return editHandler(interaction);
      if (sub === "eliminar") return deleteHandler(interaction);
      if (sub === "dar") return giveHandler(interaction);
      if (sub === "quitar") return removeHandler(interaction);
      if (sub === "comprar") return buyHandler(interaction);
      if (sub === "info") return infoHandler(interaction);
      if (sub === "usar") return useHandler(interaction);
    } catch (err) {
      console.error("❌ Error en /item:", err);
      return safeReply(interaction, "❌ Ocurrió un error ejecutando el comando.");
    }
  },
};
