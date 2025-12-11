import { Client, ClientOptions, Collection } from 'discord.js';

/**
 * Extended Discord.js Client with custom properties and methods
 */
export default class MyClient extends Client {
    public commands: Collection<string, any>;
    public components: Collection<string, any>;
    public events: Collection<string, any>;

    constructor(options: ClientOptions) {
        super(options);
        this.commands = new Collection();
        this.components = new Collection();
        this.events = new Collection();
    }
}
