import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ButtonInteraction,
} from "discord.js";
import eco from "@src/database/economy";
import safeReply from "@src/utils/safeReply";
import MyClient from "@structures/MyClient";

const ITEMS_PER_PAGE = 8;

export default {
    customId: "shop_open",

    check: (id: string): boolean =>
        id === "shop_open" ||
        id === "shop_close" ||
        id.startsWith("tienda_prev") ||
        id.startsWith("tienda_next"),

    async execute(interaction: ButtonInteraction, client: MyClient): Promise<void> {
        const guildId = interaction.guild!.id;
        const userId = interaction.user.id;

        let page = 0;

        if (interaction.customId.startsWith("tienda_prev_"))
            page = parseInt(interaction.customId.split("_")[2]) - 1;

        if (interaction.customId.startsWith("tienda_next_"))
            page = parseInt(interaction.customId.split("_")[2]) + 1;

        return renderShop(interaction, client, guildId, userId, page);
    }
};

async function renderShop(interaction: ButtonInteraction, client: MyClient, guildId: string, userId: string, pageIndex: number = 0): Promise<void> {
    let items = await eco.getShop(guildId);
    items = items.filter((i: any) => i.price !== 0);

    const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

    pageIndex = Math.max(0, Math.min(totalPages - 1, pageIndex));

    const start = pageIndex * ITEMS_PER_PAGE;
    const pageItems = items.slice(start, start + ITEMS_PER_PAGE);

    const embedBanner = new EmbedBuilder()
        .setImage("https://cdn.discordapp.com/attachments/1438575452288581632/1445207801331712214/image.png")
        .setColor("#2b2d31" as any);

    const embed = new EmbedBuilder()
        .setTitle(`🛒 Tienda (Página ${pageIndex + 1}/${totalPages})`)
        .setColor("#2b2d31" as any)
        .setThumbnail(client.user!.displayAvatarURL())
        .setImage("https://cdn.discordapp.com/attachments/1438575452288581632/1445213527617966201/Tienda_abajo.png")
        .setDescription(
            pageItems.length
                ? pageItems
                      .map((it: any, i: number) => `**${start + i + 1}. ${it.itemName}** — $${it.price}\n${it.description}`)
                      .join("\n\n")
                : "⛔ No hay artículos disponibles."
        )
        .setFooter({
            text: `Mostrando ${start + 1}-${start + pageItems.length} de ${items.length} artículos.`
        });

    const select = new StringSelectMenuBuilder()
        .setCustomId(`tienda_buy_${userId}`)
        .setPlaceholder("🛒 Selecciona un artículo para comprar")
        .addOptions(
            items.map((it: any) => ({
                label: `${it.itemName} ($${it.price})`,
                value: it.itemName,
                description: (it.description || "Sin descripción").slice(0, 50)
            }))
        );

    const rowSelect = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

    const rowButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`tienda_prev_${pageIndex}`)
            .setLabel("⬅️ Anterior")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(pageIndex === 0),

        new ButtonBuilder()
            .setCustomId("shop_close")
            .setLabel("Cerrar")
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId(`tienda_next_${pageIndex}`)
            .setLabel("Siguiente ➡️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(pageIndex >= totalPages - 1)
    );

    if (interaction.replied || interaction.deferred) {
        return interaction.editReply({
            embeds: [embedBanner, embed],
            components: [rowSelect, rowButtons]
        }) as any;
    }

    return safeReply(interaction, {
        embeds: [embedBanner, embed],
        components: [rowSelect, rowButtons]
    });
}

