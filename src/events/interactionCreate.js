// src/events/interactionCreate.js
const { Events } = require("discord.js");
const safeReply = require("@src/utils/safeReply.js");
const logger = require("@src/utils/logger.js");
const handleHelpMenu = require("@src/handlers/helpMenuHandler.js");
const backpackAutocomplete = require("@src/handlers/backpackAutocomplete.js");

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction, client) {
        try {

            /* -------------------------------------------------------------------------- */
            /*                               AUTOCOMPLETE                                */
            /* -------------------------------------------------------------------------- */
            if (interaction.isAutocomplete()) {
                try {
                    return backpackAutocomplete.execute(interaction, client);
                } catch (err) {
                    logger.error(`🔴 Error en autocomplete:`, err);
                    return interaction.respond([]);
                }
            }


            /* -------------------------------------------------------------------------- */
            /*                             SLASH COMMANDS                                 */
            /* -------------------------------------------------------------------------- */
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


            /* -------------------------------------------------------------------------- */
            /*                                   BOTONES                                  */
            /* -------------------------------------------------------------------------- */
            if (interaction.isButton()) {

                // --- Botones del menú de comandos v3 (paginación) ---
                if (interaction.customId.startsWith("help-page-")) {
                    return handleHelpMenu(interaction, client); // ORDEN CORRECTO
                }

                let button = client.buttons.get(interaction.customId);

                if (!button) {
                    button = client.buttons.find(btn => btn.check && btn.check(interaction.customId));
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


            /* -------------------------------------------------------------------------- */
            /*                               SELECT MENUS                                 */
            /* -------------------------------------------------------------------------- */
            if (interaction.isStringSelectMenu()) {

                // --- Menú principal del comando /comandos V3 ---
                if (interaction.customId.startsWith("help-category-")) {
                    return handleHelpMenu(interaction, client); // ORDEN CORRECTO
                }

                let menu = client.selectMenus.get(interaction.customId);

                if (!menu) {
                    menu = client.selectMenus.find(m => m.check && m.check(interaction.customId));
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


            /* -------------------------------------------------------------------------- */
            /*                                   MODALS                                   */
            /* -------------------------------------------------------------------------- */
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
