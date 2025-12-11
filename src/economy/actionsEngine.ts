import { ChatInputCommandInteraction } from "discord.js";
import eco from "@economy";

export default {
    async executeActions(interaction: ChatInputCommandInteraction, item: any, userId: string, guildId: string): Promise<string[]> {
        const actions = item.actions || [];
        const member = interaction.member as any;
        const guild = interaction.guild!;

        let messages: string[] = [];

        for (const act of actions) {
            const [type, a, b] = act.split(":");

            if (type === "msg") {
                messages.push(a);
            }

            if (type === "role_add") {
                await member.roles.add(a).catch(() => {});
                messages.push(`+ Se te añadió el rol <@&${a}>`);
            }

            if (type === "role_remove") {
                await member.roles.remove(a).catch(() => {});
                messages.push(`- Se te quitó el rol <@&${a}>`);
            }

            if (type === "money_add") {
                await eco.addMoney(userId, guildId, Number(a));
                messages.push(`💰 Ganaste **$${a}**`);
            }

            if (type === "money_remove") {
                await eco.removeMoney(userId, guildId, Number(a));
                messages.push(`💸 Perdiste **$${a}**`);
            }

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

