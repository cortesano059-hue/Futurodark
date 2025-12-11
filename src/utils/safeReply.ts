import { Interaction, MessagePayload, InteractionReplyOptions } from 'discord.js';

type SafeReplyPayload = string | MessagePayload | InteractionReplyOptions;

export default async function safeReply(interaction: Interaction, payload: SafeReplyPayload): Promise<void> {
    if (!payload) return;

    let data: InteractionReplyOptions;
    if (typeof payload === 'string') {
        data = { content: payload, ephemeral: true };
    } else {
        data = { ...payload };
        if (data.ephemeral === undefined) data.ephemeral = true;
    }

    if (data.ephemeral && !data.flags) {
        data.flags = 64;
    }

    try {
        if (!interaction) return console.error('❌ safeReply: Interacción nula');

        if (interaction.replied) {
            return await interaction.followUp(data as any);
        }

        if (interaction.deferred) {
            return await interaction.editReply(data as any);
        }

        return await interaction.reply(data as any);

    } catch (err: any) {
        if (err.code !== 10062 && err.code !== 40060) {
            console.error('⚠️ Error en safeReply:', err.message);
        }
    }
}

