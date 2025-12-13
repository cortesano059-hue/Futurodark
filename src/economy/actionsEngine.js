// src/economy/actionsEngine.js

const eco = require("@economy");

module.exports = {
    async executeActions(interaction, item, userId, guildId) {
        const actions = item.actions || [];
        const member = interaction.member;
        const guild = interaction.guild;

        let messages = [];

        for (const act of actions) {
            const [type, a, b] = act.split(":");

            /* ==========================================
               1️⃣ MENSAJE
               msg:Has usado una mochila
            ========================================== */
            if (type === "msg") {
                messages.push(a);
            }

            /* ==========================================
               2️⃣ EDITAR ROLES
               role_add:ID
               role_remove:ID
            ========================================== */
            if (type === "role_add") {
                await member.roles.add(a).catch(() => {});
                messages.push(`+ Se te añadió el rol <@&${a}>`);
            }

            if (type === "role_remove") {
                await member.roles.remove(a).catch(() => {});
                messages.push(`- Se te quitó el rol <@&${a}>`);
            }

            /* ==========================================
               3️⃣ DINERO
               money_add:500
               money_remove:200
            ========================================== */
            if (type === "money_add") {
                await eco.addMoney(userId, guildId, Number(a));
                messages.push(`💰 Ganaste **$${a}**`);
            }

            if (type === "money_remove") {
                await eco.removeMoney(userId, guildId, Number(a));
                messages.push(`💸 Perdiste **$${a}**`);
            }

            /* ==========================================
               4️⃣ ITEMS
               item_add:Pan:1
               item_remove:Llave:2
            ========================================== */
            if (type === "item_add") {
                await eco.addToInventory(userId, guildId, a, Number(b));
                messages.push(`🎁 Recibiste **${b}x ${a}**`);
            }

            if (type === "item_remove") {
                await eco.removeItem(userId, guildId, a, Number(b));
                messages.push(`🗑️ Se te quitó **${b}x ${a}**`);
            }
        }

        return messages;
    }
};
