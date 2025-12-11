import { Events } from "discord.js";
import safeReply from "@src/utils/safeReply";
import logger from "@src/utils/logger";
import handleHelpMenu from "@src/handlers/helpMenuHandler";
import backpackAutocomplete from "@src/handlers/backpackAutocomplete";
import MyClient from "../structures/MyClient.js";

export default {
    name: Events.InteractionCreate,

    async execute(interaction: any, client: MyClient): Promise<void> {
        try {

            if (interaction.isAutocomplete()) {
                try {
                    return backpackAutocomplete.execute(interaction, client);
                } catch (err) {
                    logger.error(`🔴 Error en autocomplete:`, err);
                    return interaction.respond([]);
                }
            }

            if (interaction.isChatInputCommand()) {
                const command = client.commands.get(interaction.commandName);

                if (!command) {
                    logger.warn(`⚠️ Comando no encontrado: ${interaction.commandName}`);
                    return;
                }

                try {
                    await command.execute(interaction, client);
                } catch (err) {
                    logger.error(`🔴 Error ejecutando /${interaction.commandName}:`, err);

                    await safeReply(interaction, "❌ Error ejecutando este comando.");
                }
                return;
            }

            if (interaction.isButton()) {

                if (interaction.customId.startsWith("help-page-")) {
                    return handleHelpMenu(interaction, client);
                }

                let button = client.buttons.get(interaction.customId);

                if (!button) {
                    button = client.buttons.find((btn: any) => btn.check && btn.check(interaction.customId));
                }

                if (!button) return;

                try {
                    await button.execute(interaction, client);
                } catch (err) {
                    logger.error(`🔴 Error en botón ${interaction.customId}:`, err);
                    await safeReply(interaction, "❌ Error al procesar el botón.");
                }

                return;
            }

            if (interaction.isStringSelectMenu()) {

                if (interaction.customId.startsWith("help-category-")) {
                    return handleHelpMenu(interaction, client);
                }

                let menu = client.selectMenus.get(interaction.customId);

                if (!menu) {
                    menu = client.selectMenus.find((m: any) => m.check && m.check(interaction.customId));
                }

                if (!menu) return;

                try {
                    await menu.execute(interaction, client);
                } catch (err) {
                    logger.error(`🔴 Error en select menu ${interaction.customId}:`, err);
                    await safeReply(interaction, "❌ Error al procesar el menú.");
                }

                return;
            }

            if (interaction.isModalSubmit()) {
                const modal = client.modals.get(interaction.customId);
                if (!modal) return;

                try {
                    await modal.execute(interaction, client);
                } catch (err) {
                    logger.error(`🔴 Error en modal ${interaction.customId}:`, err);
                    await safeReply(interaction, "❌ Error al procesar el modal.");
                }
            }

        } catch (err) {
            logger.error("🔴 Error crítico en InteractionCreate:", err);

            try {
                if (!interaction.replied && !interaction.deferred) {
                    await safeReply(interaction, "❌ Error crítico en la interacción.");
                }
            } catch {
                /* Ignorar */
            }
        }
    }
};

