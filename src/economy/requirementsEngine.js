// src/economy/requirementsEngine.js

module.exports = {
    async validateRequirements(interaction, item, userData) {
        const reqs = item.requirements || [];
        const member = interaction.member;
        const guild = interaction.guild;

        let errors = [];

        for (const req of reqs) {
            const [type, op, value, extra] = req.split(":");

            /* ==========================================
               1️⃣  REQUISITO DE ROL
               Formatos:
               role:123456789
            ========================================== */
            if (type === "role") {
                const roleId = op;
                if (!member.roles.cache.has(roleId)) {
                    errors.push(`• Necesitas el rol <@&${roleId}>`);
                }
            }

            /* ==========================================
               2️⃣  REQUISITO DE DINERO
               Formatos:
               balance_money:>=:5000
               balance_bank:<:20000
            ========================================== */
            if (type === "balance_money" || type === "balance_bank") {
                const compare = op;
                const target = Number(value);

                const checkValue = type === "balance_money"
                    ? userData.money
                    : userData.bank;

                if (!eval(`${checkValue} ${compare} ${target}`)) {
                    errors.push(`• Necesitas ${type.replace("_", " ")} ${compare} ${target}. (Tienes ${checkValue})`);
                }
            }

            /* ==========================================
               3️⃣  REQUISITO DE ITEM
               Formato:
               item:NOMBRE:>=:CANTIDAD
            ========================================== */
            if (type === "item") {
                const itemName = op;
                const compare = value;
                const target = Number(extra);

                const invItem = userData.inventory.find(i => i.itemName.toLowerCase() === itemName.toLowerCase());
                const amount = invItem ? invItem.amount : 0;

                if (!eval(`${amount} ${compare} ${target}`)) {
                    errors.push(`• Necesitas tener ${itemName} ${compare} ${target}. (Tienes ${amount})`);
                }
            }
        }

        if (errors.length > 0) {
            return {
                success: false,
                message: "❌ No cumples los requisitos:\n" + errors.join("\n")
            };
        }

        return { success: true };
    }
};
