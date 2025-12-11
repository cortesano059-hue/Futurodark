import { glob } from 'glob';
import MyClient from '../structures/MyClient.js';

export default class BotUtils {
    private client: MyClient;

    constructor(client: MyClient) {
        this.client = client;
    }

    async loadFiles(dirName: string): Promise<string[]> {
        const files = await glob(`${process.cwd().replace(/\\/g, "/")}/${dirName}/**/*.{js,ts}`);
        files.forEach(file => delete require.cache[require.resolve(file)]);
        return files;
    }

    async loadCommands(dirName: string): Promise<void> {
        const commandFiles = await this.loadFiles(dirName);
        this.client.commands.clear();
        this.client.commandArray = [];

        for (const file of commandFiles) {
            const command = require(file);
            if (command.data && command.execute) {
                this.client.commands.set(command.data.name, command);
                this.client.commandArray.push(command.data.toJSON());
            }
        }
    }
}

