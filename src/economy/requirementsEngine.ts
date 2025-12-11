import { ChatInputCommandInteraction } from "discord.js";

export default {
    async validateRequirements(interaction: ChatInputCommandInteraction, item: any, userData: any): Promise<any> {
        const reqs = item.requirements || [];
        const member = interaction.member as any;
        const guild = interaction.guild!;

        let errors: string[] = [];

        for (const req of reqs) {
            const [type, op, value, extra] = req.split(":");

            if (type === "role") {
                const roleId = op;
                if (!member.roles.cache.has(roleId)) {
                    errors.push(`• Necesitas el rol <@&${roleId}>`);
                }
            }

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

            if (type === "item") {
                const itemName = op;
                const compare = value;
                const target = Number(extra);

                const invItem = userData.inventory.find((i: any) => i.itemName.toLowerCase() === itemName.toLowerCase());
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

