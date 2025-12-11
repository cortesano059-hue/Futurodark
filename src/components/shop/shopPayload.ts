// src/components/shop/shopPayload.ts
import {
  StringSelectMenuBuilder,
  ActionRowBuilder,
  Client,
  Interaction,
} from "discord.js";
import eco from "@economy";
import safeReply from "@src/utils/safeReply";

interface ShopItem {
  itemName: string;
  description?: string;
  type: string;
}

interface ShopPayloadOptions {
  customId: string;
  placeholder?: string;
}

export async function shopPayload(
  interaction: Interaction,
  shopItems: ShopItem[],
  client: Client,
  options?: ShopPayloadOptions
): Promise<void> {
  try {
    if (!shopItems || shopItems.length === 0) return;

    // Construimos las opciones del select menu
    const selectOptions = shopItems.map((item) => ({
      label: item.itemName,
      description: item.description || "Sin descripción",
      value: item.itemName,
      emoji: item.type === "food" ? "🍔" : "📦",
    }));

    const menu = new StringSelectMenuBuilder()
      .setCustomId("shop_select_item")
      .setPlaceholder("Selecciona un item para comprar")
      .addOptions(selectOptions);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      menu
    );

    if (interaction.isRepliable()) {
      await interaction.editReply({
        content: "🛒 Selecciona un item para comprar:",
        components: [row],
      });
    }
  } catch (err) {
    console.error("🔴 Error en shopPayload:", err);
    if (interaction.isRepliable()) {
      await safeReply(
        interaction,
        "❌ Error al mostrar la tienda."
      );
    }
  }
}

export default shopPayload;
