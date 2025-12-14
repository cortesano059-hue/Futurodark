// src/commands/economia/vender-mari.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const safeReply = require("@safeReply");
const eco = require("@economy");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("vendermari")
        .setDescription("Vende marihuana (requiere rol ilegal y item configurado)."), // FIX: Se elimina la opción 'privado'

    async execute(interaction) {
        // FIX: Forzamos ephemeral a 'true' en el deferReply para todas las respuestas
        await interaction.deferReply({ ephemeral: true });

        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        /* ============================================================
            1. Obtener configuración
        ============================================================ */
        const cfg = await eco.getMariConfig(guildId);

        if (!cfg)
            return safeReply(interaction, {
                content: "❌ No se ha configurado la venta de marihuana. Usa `/config-mari`.",
                ephemeral: true
            });

        const { itemName, roleId, minConsume, maxConsume, minPrice, maxPrice } = cfg;

        /* ============================================================
            2. Comprobar rol ilegal
        ============================================================ */
        if (roleId && !interaction.member.roles.cache.has(roleId)) {
            return safeReply(interaction, {
                content: `❌ No tienes el rol ilegal requerido para vender. Debes tener: <@&${roleId}>`,
                ephemeral: true
            });
        }

        /* ============================================================
            3. Realizar venta
        ============================================================ */
        const result = await eco.sellMari(userId, guildId);

        if (!result.success) {
            return safeReply(interaction, {
                content: `❌ ${result.message || "No se pudo completar la venta."}`,
                ephemeral: true
            });
        }

        /* ============================================================
            4. Embed final
        ============================================================ */
        const embed = new EmbedBuilder()
            .setTitle("🌿 Venta realizada con éxito")
            .setColor("#2ecc71")
            .setThumbnail(interaction.user.displayAvatarURL())
            .setDescription(`Has vendido **${itemName}** en el mercado ilegal.`)
            .addFields(
                {
                    name: "📦 Cantidad consumida",
                    value: `${result.consume} unidades`,
                    inline: true
                },
                {
                    name: "💰 Precio por unidad",
                    value: `${result.priceUnit}$`,
                    inline: true
                },
                {
                    name: "🤑 Ganancia total",
                    value: `**${result.earn.toLocaleString()}$**`,
                    inline: false
                },
            )
            .setFooter({ text: "Mercado ilegal | DarkRP" })
            .setTimestamp();

        // safeReply usará el ephemeral: true de deferReply.
        return safeReply(interaction, { embeds: [embed] });
    }
};