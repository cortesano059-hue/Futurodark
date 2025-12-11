import { StringSelectMenuInteraction } from "discord.js";
import eco from "@economy";
import safeReply from "@safeReply";
import MyClient from "@structures/MyClient";

export default {
    customId: "tienda_buy",

    check: (id: string): boolean => id.startsWith("tienda_buy_"),

    async execute(interaction: StringSelectMenuInteraction, client: MyClient): Promise<void> {
        const guildId = interaction.guild!.id;
        const userId = interaction.user.id;

        const selected = interaction.values[0];
        if (!selected)
            return safeReply(interaction, { content: "❌ No seleccionaste ningún item." });

        const item = await eco.getItemByName(guildId, selected);
        if (!item)
            return safeReply(interaction, { content: "❌ El ítem no existe." });

        if (!item.price || item.price <= 0) {
            return safeReply(interaction, {
                content: "❌ Este ítem no está en venta.",
                flags: 64
            });
        }

        const bal = await eco.getBalance(userId, guildId);

        if (bal.money < item.price) {
            return safeReply(interaction, {
                content: `❌ No tienes suficiente dinero. Necesitas **$${item.price}**`,
                flags: 64
            });
        }

        const remove = await eco.removeMoney(userId, guildId, item.price, "shop_buy");
        if (!remove.success)
            return safeReply(interaction, { content: "❌ Error al procesar el pago." });

        const add = await eco.addToInventory(userId, guildId, item.itemName, 1);
        if (!add)
            return safeReply(interaction, { content: "❌ Error al añadir el ítem al inventario." });

        return safeReply(interaction, {
            content: `✅ Has comprado **${item.emoji} ${item.itemName}** por **$${item.price}**.`,
            flags: 64
        });
    }
};

