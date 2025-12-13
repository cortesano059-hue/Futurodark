require("dotenv").config();
require("module-alias/register");

const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = "1445264740153692293";

if (!TOKEN || !CLIENT_ID) {
  console.error("❌ Falta DISCORD_TOKEN o CLIENT_ID en el .env");
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, "src", "commands");

function loadCommands(dir) {
  for (const file of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, file.name);

    if (file.isDirectory()) {
      loadCommands(full);
      continue;
    }

    if (!file.name.endsWith(".js")) continue;

    try {
      delete require.cache[require.resolve(full)];
      const command = require(full);

      if (!command.data || !command.execute) {
        console.warn(`⚠ Comando inválido: ${full}`);
        continue;
      }

      commands.push(command.data.toJSON());
      console.log(`🟢 Comando cargado: /${command.data.name}`);
    } catch (err) {
      console.error(`🔴 Error cargando comando: ${full}`, err);
    }
  }
}

console.log("📦 Cargando comandos...");
loadCommands(commandsPath);

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("📤 Registrando comandos en el servidor...");
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("✅ Comandos registrados correctamente.");
  } catch (error) {
    console.error("❌ Error registrando comandos:", error);
  }
})();
