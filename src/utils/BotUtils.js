const { glob } = require('glob');

module.exports = class BotUtils {
    constructor(client) {
        this.client = client;
    }

    async loadFiles(dirName) {
        const files = await glob(`${process.cwd().replace(/\\/g, "/")}/${dirName}/**/*.js`);
        files.forEach(file => delete require.cache[require.resolve(file)]);
        return files;
    }

    // Método opcional para cargar comandos directamente
    async loadCommands(dirName) {
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
};
