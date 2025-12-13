// src/structures/MyClient.js
const { Client, GatewayIntentBits, Collection } = require("discord.js");
require('module-alias/register'); 
const commandHandler = require("@handlers/commandHandler");
const eventHandler = require("@handlers/eventHandler");
const componentHandler = require("@handlers/componentHandler");

class MyClient extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers
            ],
            partials: ['MESSAGE', 'CHANNEL', 'REACTION']
        });

        // Colecciones internas
        this.commands = new Collection();
        this.buttons = new Collection();
        this.selectMenus = new Collection();
        this.modals = new Collection();
        this.commandArray = [];

        // Manejo de errores globales
        process.on("unhandledRejection", console.error);
        process.on("uncaughtException", console.error);
    }

    async loadHandlers() {
        console.log("🔄 Cargando comandos...");
        await commandHandler(this);

        console.log("🔄 Cargando eventos...");
        await eventHandler(this);

        console.log("🔄 Cargando componentes...");
        await componentHandler(this);
    }

    async start() {
        try {
            // Activar handlers
            await this.loadHandlers();

            // Login real del bot
            console.log("🔐 Iniciando sesión...");
            await this.login(process.env.DISCORD_TOKEN);

            // ❌ Esta línea era la que causaba el registro doble
            // await registerCommands(this);

            console.log("✅ Bot iniciado correctamente");
        } catch (error) {
            console.error("❌ Error al iniciar MyClient:", error);
        }
    }
}

module.exports = MyClient;
