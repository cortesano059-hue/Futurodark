import { env } from "#env";
import { CustomItents, CustomPartials } from "@magicyan/discord";
import ck from "chalk";
import { Client, ClientOptions, version as djsVersion } from "discord.js";
import { Constatic } from "./app.js";
import { baseErrorHandler } from "./base.error.js";
import { runtimeDisplay } from "./base.version.js";
import { BaseCommandHandlers } from "./commands/handlers.js";
import "./constants.js";
import { BaseEventHandlers } from "./events/handlers.js";
import { BaseResponderHandlers } from "./responders/handlers.js";
import { glob } from "node:fs/promises";
import { join } from "node:path";

interface BootstrapOptions extends Partial<ClientOptions> {
    meta: ImportMeta;
    modules?: string[];
    loadLogs?: boolean;
    beforeLoad?(client: Client): Promise<void>;
}
export async function bootstrap(options: BootstrapOptions){
    const { meta, modules, beforeLoad, loadLogs=true, ...clientOptions } = options;

    const client = new Client({ ...clientOptions,
        intents: options.intents ?? CustomItents.All,
        partials: options.partials ?? CustomPartials.All,
        failIfNotExists: options.failIfNotExists ?? false,
    });

    const app = Constatic.getInstance();

    client.once("clientReady", async (client) => {
        registerErrorHandlers(client);
        await client.guilds
            .fetch()
            .catch(() => null);
            
        console.log(ck.green(`● ${ck.greenBright.underline(client.user.username)} online ✓`))
        
        await BaseCommandHandlers.register(client);

        await Promise.all(Array.from(app.events.getEvents("clientReady").values())
            .map(data => BaseEventHandlers.handler(data, [client]))
        );
    });

    client.on("interactionCreate", async (interaction) => {
        if (interaction.isAutocomplete()){
            await BaseCommandHandlers.autocomplete(interaction);
            return;
        }
        if (interaction.isCommand()){
            await BaseCommandHandlers.command(interaction);
            return;
        }
        await BaseResponderHandlers.handler(interaction);
    });
    
    if (beforeLoad){
        await beforeLoad(client);
    }
    
    // Cargar src/discord/index.ts primero para inicializar createCommand
    try {
        await import(`file://${join(meta.dirname, "./discord/index.js")}`);
    } catch {
        // Si falla, no es crítico
    }
    
    await loadModules(meta.dirname, modules);
    
    if (loadLogs) app.printLoadLogs();
    
    console.log();
    console.log(ck.blue(`★ Constatic Base ${ck.reset.dim(env.BASE_VERSION)}`));
    console.log(
        `${ck.hex("#5865F2")("◌ discord.js")} ${ck.dim(djsVersion)}`,
        "|",
        runtimeDisplay
    );
    
    BaseEventHandlers.register(client);

    client.login(env.BOT_TOKEN);

    return { client };
}

async function loadModules(workdir: string, modules: string[] = []) {
    const files = await Array.fromAsync(glob([
        "./discord/**/*.{js,ts,jsx,tsx}",
        ...modules,
    ], {
        cwd: workdir,
        exclude: [
            "./discord/index.*",
            "./discord/base/**/*"
        ]
    }));
    
    // Obtener createCommand desde el módulo discord/index.ts que ya lo exporta
    let createCommand: any;
    try {
        const discordIndex = await import(`file://${join(workdir, "./discord/index.js")}`);
        if (discordIndex.createCommand) {
            createCommand = discordIndex.createCommand;
        } else {
            // Fallback: crear uno nuevo
            const { setupCreators } = await import("./creators.js");
            createCommand = setupCreators().createCommand;
        }
    } catch {
        // Si falla, crear uno nuevo
        const { setupCreators } = await import("./creators.js");
        createCommand = setupCreators().createCommand;
    }
    
    await Promise.all(files.map(async (filePath) => {
        try {
            const module = await import(`file://${join(workdir, filePath)}`);
            
            let cmd: any = null;
            
            // Formato 1: export default { data, execute }
            if (module.default && typeof module.default === 'object') {
                const defaultExport = module.default;
                if (defaultExport.data && defaultExport.execute && defaultExport.data.toJSON) {
                    cmd = defaultExport;
                }
            }
            
            // Formato 2: const command = { data, execute } (sin export default)
            if (!cmd && module.command && typeof module.command === 'object') {
                if (module.command.data && module.command.execute && module.command.data.toJSON) {
                    cmd = module.command;
                }
            }
            
            // Formato 3: export const data + export async function execute
            if (!cmd && module.data && module.execute) {
                if (module.data.toJSON && typeof module.execute === 'function') {
                    cmd = { data: module.data, execute: module.execute };
                }
            }
            
            // Registrar el comando si se detectó
            if (cmd && cmd.data && cmd.execute) {
                try {
                    const commandData = cmd.data.toJSON();
                    if (!createCommand) {
                        console.error(`❌ createCommand no disponible al cargar ${filePath}`);
                        return;
                    }
                    createCommand({
                        name: commandData.name,
                        description: commandData.description || "",
                        options: commandData.options || [],
                        run: cmd.execute
                    });
                } catch (err) {
                    console.error(`❌ Error registrando comando desde ${filePath}:`, err);
                }
            }
        } catch (err) {
            // Ignorar errores de importación silenciosamente
        }
    }));
}

function registerErrorHandlers(client?: Client<true>): void {
    const errorHandler = client 
        ? (err: unknown) => baseErrorHandler(err, client)
        : baseErrorHandler;
    if (client) {
        process.removeListener("uncaughtException", baseErrorHandler);
        process.removeListener("unhandledRejection", baseErrorHandler);
    }
    process.on("uncaughtException", errorHandler);
    process.on("unhandledRejection", errorHandler);
}

registerErrorHandlers();