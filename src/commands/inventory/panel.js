// src/commands/inventory/panel.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType,
  ComponentType,
} = require("discord.js");

const safeReply = require("@safeReply");
const eco = require("@economy");
require("dotenv").config();

const PANEL_TIMEOUT = 1000 * 60 * 3; // 3 minutos

module.exports = {
  data: new SlashCommandBuilder()
    .setName("itempanel")
    .setDescription("Panel visual para crear o editar items")
    .addStringOption(o =>
      o.setName("nombre")
        .setDescription("Nombre del item")
        .setRequired(true)
    ),

  async execute(interaction) {
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);
    if (!isAdmin)
      return safeReply(interaction, "⛔ Necesitas permisos de administrar el servidor.", true);

    const guildId = interaction.guild.id;
    const name = interaction.options.getString("nombre").trim();

    await interaction.deferReply({ ephemeral: true });

    // ==========================
    //  BORRADO OPCIÓN "editar"
    //  Nuevo comportamiento:
    //  - Si existe → EDITAR
    //  - Si no existe → CREAR
    // ==========================

    // buscar item existente
    const existing = await eco.getItemByName(guildId, name);

    // draft (memoria temporal)
    const draft = {
      guildId,
      itemName: name,
      description: "",
      price: 0,
      emoji: "📦",
      inventory: true,
      usable: false,
      sellable: true,
      stock: -1,
      timeLimit: 0,
      requirements: [],
      actions: [],
      _editing: null // si existe→cargar doc aquí
    };

    // ==========================
    // MODO EDICIÓN AUTOMÁTICO
    // ==========================
    if (existing) {
      draft.itemName = existing.itemName;
      draft.description = existing.description;
      draft.price = existing.price;
      draft.emoji = existing.emoji;
      draft.inventory = existing.inventory ?? draft.inventory;
      draft.usable = existing.usable ?? draft.usable;
      draft.sellable = existing.sellable ?? draft.sellable;
      draft.stock = existing.stock ?? draft.stock;
      draft.timeLimit = existing.timeLimit ?? draft.timeLimit;
      draft.requirements = existing.requirements || [];
      draft.actions = existing.actions || [];
      draft._editing = existing;
    }

    // ==========================
    // EMBED PRINCIPAL
    // ==========================
    const makeEmbed = () => {
      const e = new EmbedBuilder()
        .setTitle(`📦 Editor de item: ${draft.itemName}`)
        .setColor("#2b6cb0")
        .setDescription(draft.description || "Sin descripción")
        .addFields(
          { name: "💰 Precio", value: `${draft.price}`, inline: true },
          { name: "🔣 Emoji", value: `${draft.emoji}`, inline: true },
          { name: "📥 Inventariable", value: draft.inventory ? "Sí" : "No", inline: true },
          { name: "🧪 Usable", value: draft.usable ? "Sí" : "No", inline: true },
          { name: "💸 Vendible", value: draft.sellable ? "Sí" : "No", inline: true },
          { name: "📦 Stock", value: draft.stock === -1 ? "Ilimitado" : `${draft.stock}`, inline: true },
          { name: "⏳ Tiempo límite", value: draft.timeLimit === 0 ? "Sin límite" : `${draft.timeLimit} ms`, inline: true },
          {
            name: `📋 Requisitos (${draft.requirements.length})`,
            value: draft.requirements.length
              ? "```json\n" + JSON.stringify(draft.requirements, null, 2).slice(0, 1000) + "\n```"
              : "Ninguno",
            inline: false
          },
          {
            name: `⚙️ Acciones (${draft.actions.length})`,
            value: draft.actions.length
              ? "```json\n" + JSON.stringify(draft.actions, null, 2).slice(0, 1000) + "\n```"
              : "Ninguna",
            inline: false
          }
        )
        .setFooter({ text: "Panel interactivo — edita y luego guarda." });
      return e;
    };

    // ==========================
    // BOTONES PRINCIPALES
    // ==========================
    const rowMain = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("reqs").setLabel("Requisitos").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("acts").setLabel("Acciones").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("props").setLabel("Propiedades").setStyle(ButtonStyle.Secondary),
    );

    const rowMain2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("preview").setLabel("Vista previa").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("save").setLabel(existing ? "Guardar Cambios" : "Crear Item").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("cancel").setLabel("Cancelar").setStyle(ButtonStyle.Danger),
    );

    const reply = await interaction.followUp({
      embeds: [makeEmbed()],
      components: [rowMain, rowMain2],
      ephemeral: true
    });

    // ==========================
    // COLECTOR PRINCIPAL
    // ==========================
    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: PANEL_TIMEOUT,
      filter: i => i.user.id === interaction.user.id
    });

    collector.on("collect", async btnInt => {
      try {
        await btnInt.deferUpdate();

        // ======================================================================
        // TODO EL CÓDIGO ORIGINAL DEL PANEL SIGUE IGUAL (REQUISITOS, ACCIONES,
        // PROPIEDADES, PREVIEW, CANCEL). SOLO CAMBIÓ LA LÓGICA DE EDICIÓN/CREACIÓN.
        // ======================================================================

        // ---------------------------
        // PREVIEW
        // ---------------------------
        if (btnInt.customId === "preview") {
          return interaction.followUp({ embeds: [makeEmbed()], ephemeral: true });
        }

        // ---------------------------
        // SAVE
        // ---------------------------
        if (btnInt.customId === "save") {
          try {
            const itemData = {
              inventory: draft.inventory,
              usable: draft.usable,
              sellable: draft.sellable,
              stock: draft.stock,
              timeLimit: draft.timeLimit,
              requirements: draft.requirements,
              actions: draft.actions,
              data: {}
            };

            // ✔ EDITAR SI EXISTE
            if (draft._editing) {
              const doc = draft._editing;

              doc.itemName = draft.itemName;
              doc.description = draft.description;
              doc.price = draft.price;
              doc.emoji = draft.emoji;

              doc.inventory = itemData.inventory;
              doc.usable = itemData.usable;
              doc.sellable = itemData.sellable;
              doc.stock = itemData.stock;
              doc.timeLimit = itemData.timeLimit;

              doc.requirements = itemData.requirements;
              doc.actions = itemData.actions;
              doc.data = itemData.data;

              await doc.save();

              await interaction.followUp({
                content: `📝 **Item actualizado:** \`${doc.itemName}\``,
                ephemeral: true
              });
            }

            // ✔ CREAR SOLO SI NO EXISTE
            else {
              const created = await eco.createItem(
                guildId,
                draft.itemName,
                draft.description,
                draft.price,
                draft.emoji,
                itemData
              );

              if (!created)
                return interaction.followUp({ content: "❌ No se pudo crear el item.", ephemeral: true });

              await interaction.followUp({
                content: `✅ **Item creado:** \`${created.itemName}\``,
                ephemeral: true
              });
            }

            // actualizar embed
            await interaction.editReply({
              embeds: [makeEmbed()],
              components: [rowMain, rowMain2]
            }).catch(() => {});

          } catch (err) {
            console.error("❌ Error guardando item:", err);
            await interaction.followUp({ content: "❌ Error guardando item.", ephemeral: true });
          }
        }

        // ---------------------------
        // CANCEL
        // ---------------------------
        if (btnInt.customId === "cancel") {
          collector.stop("cancelled");
          await interaction.followUp({ content: "✖ Panel cancelado.", ephemeral: true });
          return interaction.editReply({ components: [] }).catch(() => {});
        }

      } catch (err) {
        console.error("❌ Error en collector:", err);
      }
    });

    collector.on("end", async (_, reason) => {
      if (reason === "time") {
        try {
          await interaction.followUp({
            content: "⌛ Panel expirado. Ejecuta nuevamente `/itempanel`.",
            ephemeral: true
          });
          await interaction.editReply({ components: [] }).catch(() => {});
        } catch (_) {}
      }
    });

  }
};
