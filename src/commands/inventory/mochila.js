const { SlashCommandBuilder } = require("discord.js");

const { Backpack } = require("@database/mongodb");
const { isAdmin } = require("@src/utils/backpackAccess");
const findBackpack = require("@src/utils/findBackpack");
const eco = require("@economy");

// Handlers
const listHandler = require("@handlers/mochila/list");
const openHandler = require("@handlers/mochila/open");
const meterHandler = require("@handlers/mochila/meter");
const sacarHandler = require("@handlers/mochila/sacar");
const addHandler = require("@handlers/mochila/add");
const infoHandler = require("@handlers/mochila/info");
const autorizarHandler = require("@handlers/mochila/autorizar");
const createHandler = require("@handlers/mochila/create");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mochila")
    .setDescription("Sistema de mochilas por slots")

    /* ===================== CREAR ===================== */
    .addSubcommand(sub =>
      sub
        .setName("crear")
        .setDescription("Crear una mochila")
        .addStringOption(o =>
          o.setName("tipo")
            .setDescription("Tipo de mochila")
            .setRequired(true)
            .addChoices(
              { name: "Personal", value: "user" },
              { name: "Rol (comunitaria)", value: "role" },
              { name: "Sistema", value: "system" }
            )
        )
        .addStringOption(o =>
          o.setName("nombre")
            .setDescription("Nombre de la mochila")
            .setRequired(true)
        )
        .addUserOption(o =>
          o.setName("usuario")
            .setDescription("Dueño (solo tipo personal)")
        )
        .addRoleOption(o =>
          o.setName("rol")
            .setDescription("Rol dueño (solo tipo rol)")
        )
        .addIntegerOption(o =>
          o.setName("capacidad")
            .setDescription("Capacidad")
            .setMinValue(1)
        )
        .addStringOption(o =>
          o.setName("emoji").setDescription("Emoji")
        )
        .addStringOption(o =>
          o.setName("descripcion").setDescription("Descripción")
        )
    )

    /* ===================== LISTAR ===================== */
    .addSubcommand(sub =>
      sub
        .setName("listar")
        .setDescription("Listar mochilas")
        .addBooleanOption(o =>
          o.setName("admin").setDescription("Ver todas (solo admins)")
        )
    )

    /* ===================== ABRIR ===================== */
    .addSubcommand(sub =>
      sub
        .setName("abrir")
        .setDescription("Abrir mochila")
        .addStringOption(o =>
          o.setName("nombre")
            .setDescription("Mochila")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addBooleanOption(o =>
          o.setName("admin").setDescription("Ignorar permisos")
        )
    )

    /* ===================== INFO ===================== */
    .addSubcommand(sub =>
      sub
        .setName("info")
        .setDescription("Info de mochila")
        .addStringOption(o =>
          o.setName("nombre")
            .setDescription("Mochila")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addBooleanOption(o =>
          o.setName("admin").setDescription("Ignorar permisos")
        )
    )

    /* ===================== METER ===================== */
    .addSubcommand(sub =>
      sub
        .setName("meter")
        .setDescription("Meter items")
        .addStringOption(o =>
          o.setName("mochila")
            .setDescription("Mochila")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption(o =>
          o.setName("item")
            .setDescription("Item")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addIntegerOption(o =>
          o.setName("cantidad")
            .setDescription("Cantidad")
            .setMinValue(1)
        )
        .addBooleanOption(o =>
          o.setName("admin").setDescription("Ignorar permisos")
        )
    )

    /* ===================== SACAR ===================== */
    .addSubcommand(sub =>
      sub
        .setName("sacar")
        .setDescription("Sacar items")
        .addStringOption(o =>
          o.setName("mochila")
            .setDescription("Mochila")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption(o =>
          o.setName("item")
            .setDescription("Item")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addIntegerOption(o =>
          o.setName("cantidad")
            .setDescription("Cantidad")
            .setMinValue(1)
        )
        .addBooleanOption(o =>
          o.setName("admin").setDescription("Ignorar permisos")
        )
    )

    /* ===================== AÑADIR ===================== */
    .addSubcommand(sub =>
      sub
        .setName("añadir")
        .setDescription("Añadir items (admin)")
        .addStringOption(o =>
          o.setName("mochila")
            .setDescription("Mochila")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption(o =>
          o.setName("item")
            .setDescription("Item")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addIntegerOption(o =>
          o.setName("cantidad")
            .setDescription("Cantidad")
            .setRequired(true)
            .setMinValue(1)
        )
    )

    /* ===================== AUTORIZAR ===================== */
    .addSubcommand(sub =>
      sub
        .setName("autorizar")
        .setDescription("Autorizar acceso")
        .addStringOption(o =>
          o.setName("mochila")
            .setDescription("Mochila")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption(o =>
          o.setName("accion")
            .setDescription("Acción")
            .setRequired(true)
            .addChoices(
              { name: "Añadir", value: "add" },
              { name: "Quitar", value: "remove" }
            )
        )
        .addUserOption(o =>
          o.setName("usuario").setDescription("Usuario")
        )
        .addRoleOption(o =>
          o.setName("rol").setDescription("Rol")
        )
        .addBooleanOption(o =>
          o.setName("admin").setDescription("Ignorar permisos")
        )
    ),

  /* ====================================================================== */
  /* AUTOCOMPLETE                                                           */
  /* ====================================================================== */

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);
    if (!focused) return;

    const guildId = interaction.guild.id;
    const member = interaction.member;
    const sub = interaction.options.getSubcommand();

    const adminMode =
      isAdmin(member) && interaction.options.getBoolean("admin") === true;

    /* ===================== MOCHILAS ===================== */
    if (focused.name === "nombre" || focused.name === "mochila") {
      let backpacks = await Backpack.find({ guildId });

      if (!adminMode) {
        backpacks = backpacks.filter(bp => {
          if (bp.ownerType === "user" && bp.ownerId === member.id) return true;
          if (
            bp.ownerType === "role" &&
            member.roles.cache.has(bp.ownerId)
          ) return true;
          if (bp.allowedUsers?.includes(member.id)) return true;
          if (bp.allowedRoles?.some(r => member.roles.cache.has(r))) return true;
          return false;
        });
      }

      return interaction.respond(
        backpacks
          .filter(bp =>
            bp.name.toLowerCase().includes(focused.value.toLowerCase())
          )
          .slice(0, 25)
          .map(bp => ({ name: bp.name, value: bp.name }))
      );
    }

    /* ===================== ITEMS ===================== */
    if (focused.name === "item") {

      /* -------- METER -------- */
      if (sub === "meter") {
        const inventory = await eco.getUserInventory(member.id, guildId);

        return interaction.respond(
          inventory
            .map(i => ({
              name: `${i.itemName} (${i.amount})`,
              value: i.itemName,
            }))
            .filter(i =>
              i.name.toLowerCase().includes(focused.value.toLowerCase())
            )
            .slice(0, 25)
        );
      }

      /* -------- SACAR (FIX REAL) -------- */
      if (sub === "sacar") {
        const mochilaName = interaction.options.getString("mochila");
        if (!mochilaName) return interaction.respond([]);

        const bp = await Backpack
          .findOne({
            guildId,
            name: new RegExp(`^${mochilaName}$`, "i"),
          })
          .populate("items.itemId");

        if (!bp || !bp.items?.length) return interaction.respond([]);

        return interaction.respond(
          bp.items
            .filter(i => i.itemId)
            .map(i => ({
              name: `${i.itemId.itemName} (${i.amount})`,
              value: i.itemId.itemName,
            }))
            .filter(i =>
              i.name.toLowerCase().includes(focused.value.toLowerCase())
            )
            .slice(0, 25)
        );
      }

      /* -------- AÑADIR -------- */
      if (sub === "añadir") {
        const items = await eco.getAllItems(guildId);

        return interaction.respond(
          items
            .map(i => ({ name: i.itemName, value: i.itemName }))
            .slice(0, 25)
        );
      }
    }

    return interaction.respond([]);
  },

  /* ====================================================================== */
  /* EXECUTE                                                                */
  /* ====================================================================== */

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "crear") return createHandler(interaction);
    if (sub === "listar") return listHandler(interaction);
    if (sub === "abrir") return openHandler(interaction);
    if (sub === "info") return infoHandler(interaction);
    if (sub === "meter") return meterHandler(interaction);
    if (sub === "sacar") return sacarHandler(interaction);
    if (sub === "añadir") return addHandler(interaction);
    if (sub === "autorizar") return autorizarHandler(interaction);
  },
};
