// src/events/ready.js
const { Events, Routes, REST } = require("discord.js");
const logger = require("@src/utils/logger.js");
require("dotenv").config();

const { startSalaryScheduler } = require("@src/schedulers/salaryScheduler");

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    console.log("🔥 READY EXECUTE INICIADO");

    logger.info(`🤖 Bot conectado como ${client.user.tag}`);

    /* ===============================
       REGISTRO DE COMANDOS
    =============================== */

    const commands = client.commandArray || client.commandsArray;

    if (commands && commands.length > 0) {
      const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commands }
      );

      logger.info(`🌍 Registrados ${commands.length} comandos GLOBAL.`);
    }

    /* ===============================
       INICIO DEL SCHEDULER
    =============================== */

    console.log("🔥 ANTES de startSalaryScheduler(client)");
    startSalaryScheduler(client);
    console.log("🔥 DESPUÉS de startSalaryScheduler(client)");
  },
};
