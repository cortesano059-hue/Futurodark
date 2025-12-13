// src/commands/economia/items/inventario.js
const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const safeReply = require("@safeReply");
const eco = require("@economy");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("inventario")
        .setDescription("Muestra tu inventario o el de otro usuario.")
        .addUserOption(option =>
            option
                .setName("usuario")
                .setDescription("Usuario del que ver el inventario")
        ),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const targetUser =
                interaction.options.getUser("usuario") || interaction.user;

            const guildId = interaction.guild.id;

            // Obtener inventario
            const items = await eco.getUserInventory(targetUser.id, guildId);

            if (!items || items.length === 0)
                return safeReply(
                    interaction,
                    `📦 El inventario de **${targetUser.username}** está vacío.`
                );

            // Ordenar
            items.sort((a, b) => a.itemName.localeCompare(b.itemName));

            const ITEMS_PER_PAGE = 8;
            let page = 0;

            const maxPages = Math.ceil(items.length / ITEMS_PER_PAGE);

            const getPageEmbed = (pageIndex) => {
                const start = pageIndex * ITEMS_PER_PAGE;
                const pageItems = items.slice(start, start + ITEMS_PER_PAGE);

                const embed = new EmbedBuilder()
                    .setTitle(`📦 Inventario de ${targetUser.username}`)
                    .setColor("#3498DB")
                    .setFooter({
                        text: `Página ${pageIndex + 1} de ${maxPages} — Total items: ${items.length}`
                    });

                for (const item of pageItems) {
                    embed.addFields({
                        name: `${item.emoji} ${item.itemName} × ${item.amount}`,
                        value: item.description || "Sin descripción.",
                        inline: false
                    });
                }

                return embed;
            };

            const getButtons = (pageIndex) => {
                return new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("prev_page")
                        .setLabel("⬅️")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(pageIndex === 0),

                    new ButtonBuilder()
                        .setCustomId("next_page")
                        .setLabel("➡️")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(pageIndex === maxPages - 1)
                );
            };

            // Enviar primera página
            let msg = await safeReply(interaction, {
                embeds: [getPageEmbed(page)],
                components: [getButtons(page)]
            });

            // Crear collector de botones
            const collector = msg.createMessageComponentCollector({
                time: 60_000 // 1 minuto
            });

            collector.on("collect", async (btn) => {
                if (btn.user.id !== interaction.user.id)
                    return btn.reply({ content: "❌ No puedes usar estos botones.", ephemeral: true });

                if (btn.customId === "prev_page") page--;
                if (btn.customId === "next_page") page++;

                await btn.update({
                    embeds: [getPageEmbed(page)],
                    components: [getButtons(page)]
                });
            });

            collector.on("end", async () => {
                if (!msg.editable) return;

                msg.edit({
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId("disabled")
                                .setLabel("⏱️ Tiempo expirado")
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true)
                        )
                    ]
                }).catch(() => {});
            });

        } catch (err) {
            console.error("❌ Error en inventario:", err);
            return safeReply(interaction, "❌ Error al mostrar el inventario.");
        }
    }
};
