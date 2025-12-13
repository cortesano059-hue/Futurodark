// src/handlers/backpackAutocomplete.js
const { Backpack } = require("@database/mongodb");
const eco = require("@economy");
const { isAdmin, canAccessBackpack } = require("@src/utils/backpackAccess.js");
const escapeRegex = require("@src/utils/escapeRegex.js");

module.exports = {
    name: "backpackAutocomplete",

    async execute(interaction) {
        if (!interaction.isAutocomplete()) return;

        const guildId = interaction.guild.id;
        const member = interaction.member;

        const focused = interaction.options.getFocused(true);
        const query = (focused.value || "").toLowerCase();

        try {
            /* ============================================================
               AUTOCOMPLETE DE MOCHILAS
            ============================================================ */
            if (["nombre", "mochila"].includes(focused.name)) {
                const all = await Backpack.find({ guildId }).limit(200);

                const accesibles = all.filter(bp =>
                    bp.ownerId === member.id ||
                    isAdmin(member) ||
                    canAccessBackpack(bp, member)
                );

                return interaction.respond(
                    accesibles
                        .filter(bp => bp.name.toLowerCase().includes(query))
                        .slice(0, 25)
                        .map(bp => ({
                            name: `${bp.emoji || "🎒"} ${bp.name}`,
                            value: bp.name
                        }))
                );
            }

            /* ============================================================
               AUTOCOMPLETE DE ITEMS
            ============================================================ */

            let sub = null;
            try {
                sub = interaction.options.getSubcommand();
            } catch {
                // Durante autocomplete puede fallar si aún no se define el subcomando
            }

            /* ---------- /mochila meter ---------- */
            if (sub === "meter" && focused.name === "item") {
                const inv = await eco.getUserInventory(member.id, guildId);

                return interaction.respond(
                    inv
                        .filter(i => i.name.toLowerCase().includes(query))
                        .slice(0, 25)
                        .map(i => ({
                            name: `${i.emoji || "📦"} ${i.name} (${i.amount})`,
                            value: i.name
                        }))
                );
            }

            /* ---------- /mochila sacar ---------- */
            if (sub === "sacar" && focused.name === "item") {
                const mochilaName = interaction.options.getString("mochila");
                if (!mochilaName) return interaction.respond([]);

                const bp = await Backpack.findOne({
                    guildId,
                    name: new RegExp("^" + escapeRegex(mochilaName) + "$", "i")
                }).populate("items.itemId");

                if (!bp) return interaction.respond([]);

                return interaction.respond(
                    bp.items
                        .filter(i => i.itemId.itemName.toLowerCase().includes(query))
                        .slice(0, 25)
                        .map(i => ({
                            name: `${i.itemId.emoji} ${i.itemId.itemName} (${i.amount})`,
                            value: i.itemId.itemName
                        }))
                );
            }

            return interaction.respond([]);

        } catch (err) {
            console.error("❌ Error en backpackAutocomplete:", err);
            return interaction.respond([]);
        }
    }
};