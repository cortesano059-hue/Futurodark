// src/commands/inventory/item.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

const safeReply = require("@safeReply");
const eco = require("@economy");
const requirements = require("../../economy/requirementsEngine");
const actions = require("../../economy/actionsEngine");

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
        .addStringOption(o => o.setName("nombre").setDescription("Nombre del item").setRequired(true))
        .addIntegerOption(o => o.setName("precio").setDescription("Precio").setRequired(true))
        .addStringOption(o => o.setName("descripcion").setDescription("Descripción"))
        .addStringOption(o => o.setName("emoji").setDescription("Emoji"))
        .addBooleanOption(o => o.setName("inventariable").setDescription("¿Se guarda en inventario?"))
        .addBooleanOption(o => o.setName("usable").setDescription("¿Se usa con /item usar?"))
        .addBooleanOption(o => o.setName("vendible").setDescription("¿Se puede vender?"))
        .addIntegerOption(o => o.setName("stock").setDescription("Stock (-1 ilimitado)"))
        .addIntegerOption(o => o.setName("tiempo").setDescription("Tiempo límite en ms"))
        .addStringOption(o => o.setName("requisitos").setDescription("Requisitos separados por ;"))
        .addStringOption(o => o.setName("acciones").setDescription("Acciones separadas por ;"))
    )

    /* ===============================
     * EDITAR
     * =============================== */
    .addSubcommand(sub =>
      sub.setName("editar")
        .setDescription("Editar un item existente.")
        .addStringOption(o => o.setName("nombre").setDescription("Item actual").setRequired(true))
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
        .addStringOption(o => o.setName("nombre").setDescription("Nombre").setRequired(true))
    )

    /* ===============================
     * DAR
     * =============================== */
    .addSubcommand(sub =>
      sub.setName("dar")
        .setDescription("Dar item a un usuario.")
        .addUserOption(o => o.setName("usuario").setDescription("Usuario").setRequired(true))
        .addStringOption(o => o.setName("nombre").setDescription("Item").setRequired(true))
        .addIntegerOption(o => o.setName("cantidad").setDescription("Cantidad").setRequired(true))
    )

    /* ===============================
     * QUITAR
     * =============================== */
    .addSubcommand(sub =>
      sub.setName("quitar")
        .setDescription("Quitar item del usuario.")
        .addUserOption(o => o.setName("usuario").setDescription("Usuario").setRequired(true))
        .addStringOption(o => o.setName("nombre").setDescription("Item").setRequired(true))
        .addIntegerOption(o => o.setName("cantidad").setDescription("Cantidad").setRequired(true))
    )

    /* ===============================
     * COMPRAR
     * =============================== */
    .addSubcommand(sub =>
      sub.setName("comprar")
        .setDescription("Comprar un item.")
        .addStringOption(o => o.setName("nombre").setDescription("Nombre del item").setRequired(true))
        .addIntegerOption(o => o.setName("cantidad").setDescription("Cantidad").setRequired(true))
    )

    /* ===============================
     * INFO
     * =============================== */
    .addSubcommand(sub =>
      sub.setName("info")
        .setDescription("Información detallada del item.")
        .addStringOption(o => o.setName("nombre").setDescription("Item").setRequired(true))
    )

    /* ===============================
     * USAR
     * =============================== */
    .addSubcommand(sub =>
      sub.setName("usar")
        .setDescription("Usar un item del inventario.")
        .addStringOption(o => o.setName("nombre").setDescription("Item").setRequired(true))
        .addIntegerOption(o => o.setName("cantidad").setDescription("Cantidad"))
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const sub = interaction.options.getSubcommand();

    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);
    const adminCmds = ["crear", "editar", "eliminar", "dar", "quitar"];

    if (adminCmds.includes(sub) && !isAdmin)
      return safeReply(interaction, "❌ No tienes permisos para esto.", true);

    try {
      /* ============================================================
       * CREAR
       * ============================================================ */
      if (sub === "crear") {
        const name = interaction.options.getString("nombre");
        const price = interaction.options.getInteger("precio");
        const desc = interaction.options.getString("descripcion") || "";
        const emoji = interaction.options.getString("emoji") || "📦";

        const inventory = interaction.options.getBoolean("inventariable");
        const usable = interaction.options.getBoolean("usable");
        const sellable = interaction.options.getBoolean("vendible");
        const stock = interaction.options.getInteger("stock");
        const time = interaction.options.getInteger("tiempo");

        const req = interaction.options.getString("requisitos");
        const act = interaction.options.getString("acciones");

        const payload = {
          inventory: inventory ?? true,
          usable: usable ?? false,
          sellable: sellable ?? true,
          stock: stock ?? -1,
          timeLimit: time ?? 0,
          requirements: req ? req.split(";").map(t => t.trim()) : [],
          actions: act ? act.split(";").map(t => t.trim()) : [],
          data: {}
        };

        const exists = await eco.getItemByName(guildId, name);
        if (exists) return safeReply(interaction, "❌ Ya existe ese item.");

        // Create item (economy.js updated to accept data object)
        const item = await eco.createItem(guildId, name, desc, price, emoji, payload);

        if (!item) return safeReply(interaction, "❌ No se pudo crear el item.");

        return safeReply(interaction, `✅ Item **${name}** creado correctamente.`);
      }

      /* ============================================================
       * EDITAR
       * ============================================================ */
      if (sub === "editar") {
        const name = interaction.options.getString("nombre");
        const item = await eco.getItemByName(guildId, name);

        if (!item) return safeReply(interaction, "❌ Ese item no existe.");

        const newName = interaction.options.getString("nuevo_nombre");
        const price = interaction.options.getInteger("precio");
        const desc = interaction.options.getString("descripcion");
        const emoji = interaction.options.getString("emoji");
        const inventory = interaction.options.getBoolean("inventariable");
        const usable = interaction.options.getBoolean("usable");
        const sellable = interaction.options.getBoolean("vendible");
        const stock = interaction.options.getInteger("stock");
        const time = interaction.options.getInteger("tiempo");
        const req = interaction.options.getString("requisitos");
        const act = interaction.options.getString("acciones");

        if (newName) item.itemName = newName;
        if (price !== null) item.price = price;
        if (desc !== null) item.description = desc;
        if (emoji) item.emoji = emoji;

        if (inventory !== null) item.inventory = inventory;
        if (usable !== null) item.usable = usable;
        if (sellable !== null) item.sellable = sellable;

        if (stock !== null) item.stock = stock;
        if (time !== null) item.timeLimit = time;

        if (req !== null) item.requirements = req.split(";").map(t => t.trim());
        if (act !== null) item.actions = act.split(";").map(t => t.trim());

        await item.save();
        return safeReply(interaction, `✏️ Item **${item.itemName}** actualizado.`);
      }

      /* ============================================================
       * ELIMINAR
       * ============================================================ */
      if (sub === "eliminar") {
        const name = interaction.options.getString("nombre");
        const ok = await eco.deleteItem(guildId, name);

        if (!ok) return safeReply(interaction, "❌ Ese item no existe.");

        return safeReply(interaction, `🗑️ Item **${name}** eliminado.`);
      }

      /* ============================================================
       * DAR
       * ============================================================ */
      if (sub === "dar") {
        const u = interaction.options.getUser("usuario");
        const name = interaction.options.getString("nombre");
        const qty = interaction.options.getInteger("cantidad");

        const ok = await eco.addToInventory(u.id, guildId, name, qty);
        if (!ok) return safeReply(interaction, "❌ Ese item no existe.");

        return safeReply(interaction, `🎁 Entregado **${qty}x ${name}** a <@${u.id}>.`);
      }

      /* ============================================================
       * QUITAR
       * ============================================================ */
      if (sub === "quitar") {
        const u = interaction.options.getUser("usuario");
        const name = interaction.options.getString("nombre");
        const qty = interaction.options.getInteger("cantidad");

        const ok = await eco.removeItem(u.id, guildId, name, qty);
        if (!ok) return safeReply(interaction, "❌ No tiene suficientes items.");

        return safeReply(interaction, `🗑️ Quitado **${qty}x ${name}** a <@${u.id}>.`);
      }

      /* ============================================================
       * COMPRAR
       * ============================================================ */
      if (sub === "comprar") {
        const name = interaction.options.getString("nombre");
        const qty = interaction.options.getInteger("cantidad");
        const item = await eco.getItemByName(guildId, name);

        if (!item) return safeReply(interaction, "❌ Ese item no existe.");

        // STOCK
        if (item.stock !== -1 && item.stock < qty)
          return safeReply(interaction, `❌ Stock insuficiente. Disponible: ${item.stock}`);

        // REQUISITOS
        const userData = {
          money: (await eco.getBalance(userId, guildId)).money,
          inventory: await eco.getUserInventory(userId, guildId),
        };

        const valid = await requirements.validateRequirements(interaction, item, userData);
        if (!valid.success) return safeReply(interaction, valid.message);

        // COBRAR
        const total = item.price * qty;
        const removed = await eco.removeMoney(userId, guildId, total);

        if (!removed || removed.success === false)
          return safeReply(interaction, "❌ No tienes suficiente dinero.");

        // AÑADIR INVENTARIO POR NOMBRE
        await eco.addToInventory(userId, guildId, name, qty);

        // ACTUALIZAR STOCK
        if (item.stock !== -1) {
          item.stock -= qty;
          if (item.stock < 0) item.stock = 0;
          await item.save();
        }

        // EJECUTAR ACCIONES
        const msgs = await actions.executeActions(interaction, item, userId, guildId);

        const embed = new EmbedBuilder()
          .setTitle("🛒 Compra realizada")
          .setColor("#2ecc71")
          .setDescription(`Has comprado **${qty}x ${item.itemName}** por **$${total}**`)
          .addFields(
            { name: "💵 Nuevo saldo", value: `${(await eco.getBalance(userId, guildId)).money}`, inline: true },
            { name: "📦 Stock restante", value: `${item.stock}`, inline: true }
          );

        if (msgs.length)
          embed.addFields({ name: "Acciones ejecutadas", value: msgs.join("\n") });

        return safeReply(interaction, { embeds: [embed] });
      }

      /* ============================================================
       * INFO
       * ============================================================ */
      if (sub === "info") {
        const name = interaction.options.getString("nombre");
        const item = await eco.getItemByName(guildId, name);

        if (!item) return safeReply(interaction, "❌ Ese item no existe.");

        const embed = new EmbedBuilder()
          .setTitle(`${item.emoji} ${item.itemName}`)
          .setColor("#3498db")
          .setDescription(item.description || "Sin descripción.")
          .addFields(
            { name: "💰 Precio", value: `${item.price}`, inline: true },
            { name: "📦 Inventariable", value: item.inventory ? "Sí" : "No", inline: true },
            { name: "🧪 Usable", value: item.usable ? "Sí" : "No", inline: true },
            { name: "💸 Vendible", value: item.sellable ? "Sí" : "No", inline: true },
            { name: "📦 Stock", value: `${item.stock}`, inline: true },
            { name: "📋 Requisitos", value: item.requirements.length ? item.requirements.join("\n") : "Ninguno" },
            { name: "⚙️ Acciones", value: item.actions.length ? item.actions.join("\n") : "Ninguna" }
          );

        return safeReply(interaction, { embeds: [embed] });
      }

      /* ============================================================
       * USAR
       * ============================================================ */
      if (sub === "usar") {
        const name = interaction.options.getString("nombre");
        const qty = interaction.options.getInteger("cantidad") || 1;
        const item = await eco.getItemByName(guildId, name);

        if (!item) return safeReply(interaction, "❌ Ese item no existe.");

        if (!item.usable)
          return safeReply(interaction, `❌ El item **${item.itemName}** no es usable.`);

        // INVENTARIO
        if (item.inventory) {
          const inv = await eco.getUserInventory(userId, guildId);
          const owned = inv.find(i => i.itemName.toLowerCase() === name.toLowerCase());

          if (!owned || owned.amount < qty)
            return safeReply(interaction, `❌ No tienes suficientes **${item.itemName}**.`);
        }

        // REQUISITOS
        const userData = {
          money: (await eco.getBalance(userId, guildId)).money,
          inventory: await eco.getUserInventory(userId, guildId),
        };

        const valid = await requirements.validateRequirements(interaction, item, userData);
        if (!valid.success) return safeReply(interaction, valid.message);

        // ACCIONES
        const msgs = await actions.executeActions(interaction, item, userId, guildId);

        // CONSUMIR
        if (item.inventory) await eco.removeItem(userId, guildId, name, qty);

        const embed = new EmbedBuilder()
          .setTitle(`🧪 Usaste ${item.emoji} ${item.itemName}`)
          .setColor("#2ecc71")
          .setDescription(msgs.length ? msgs.join("\n") : "✔️ Item usado.")
          .addFields({ name: "Cantidad usada", value: `${qty}` });

        return safeReply(interaction, { embeds: [embed] });
      }
    } catch (err) {
      console.error("❌ Error en /item:", err);
      return safeReply(interaction, "❌ Ocurrió un error ejecutando el comando.");
    }
  },
};
