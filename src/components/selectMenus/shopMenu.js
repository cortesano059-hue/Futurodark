// src/components/selectMenus/shopMenu.js
const eco = require("@economy");
const safeReply = require("@safeReply");

module.exports = {
    customId: "tienda_buy",

    // Detecta cualquier menú tienda_buy_XXXXXXXX
    check: id => id.startsWith("tienda_buy_"),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const selected = interaction.values[0]; // nombre del item
        if (!selected)
            return safeReply(interaction, { content: "❌ No seleccionaste ningún item." });

        /* ============================================================
           1) Verificar si el ítem existe
        ============================================================ */
        const item = await eco.getItemByName(guildId, selected);
        if (!item)
            return safeReply(interaction, { content: "❌ El ítem no existe." });

        /* ============================================================
           2) Verificar si TIENE PRECIO → condición para estar en venta
        ============================================================ */
        if (!item.price || item.price <= 0) {
            return safeReply(interaction, {
                content: "❌ Este ítem no está en venta.",
                flags: 64
            });
        }

        /* ============================================================
           3) Verificar dinero del usuario
        ============================================================ */
        const bal = await eco.getBalance(userId, guildId);

        if (bal.money < item.price) {
            return safeReply(interaction, {
                content: `❌ No tienes suficiente dinero. Necesitas **$${item.price}**`,
                flags: 64
            });
        }

        /* ============================================================
           4) Cobrar y añadir al inventario
        ============================================================ */
        const remove = await eco.removeMoney(userId, guildId, item.price, "shop_buy");
        if (!remove.success)
            return safeReply(interaction, { content: "❌ Error al procesar el pago." });

        const add = await eco.addToInventory(userId, guildId, item.itemName, 1);
        if (!add)
            return safeReply(interaction, { content: "❌ Error al añadir el ítem al inventario." });

        /* ============================================================
           5) Respuesta final
        ============================================================ */
        return safeReply(interaction, {
            content: `✅ Has comprado **${item.emoji} ${item.itemName}** por **$${item.price}**.`,
            flags: 64
        });
    }
};
