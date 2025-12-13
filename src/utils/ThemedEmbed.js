const { EmbedBuilder } = require('discord.js');
const Emojis = require("@config/EmojiList.js"); // Asegúrate de tener EmojiList.js

const NIBY_ACCENT_COLOR = '#00AACC'; 
const NIBY_ERROR_COLOR = '#FF5500';

class ThemedEmbed extends EmbedBuilder {
    constructor(interaction = null) {
        super();
        this.setColor(NIBY_ACCENT_COLOR);
        this.setTimestamp();
    }

    // Método para obtener un embed base que se puede editar
    static base(interaction = null) {
        return new ThemedEmbed(interaction);
    }

    static success(title, description) {
        const embed = new ThemedEmbed();
        // Usamos emojis si existen, si no, fallback
        const emoji = (Emojis && Emojis.yes) ? Emojis.yes : '✅';
        embed.setTitle(`${emoji} ${title}`);
        if (description) embed.setDescription(description);
        return embed;
    }

    static error(title, description) {
        const embed = new ThemedEmbed();
        const emoji = (Emojis && Emojis.no) ? Emojis.no : '❌';
        embed.setTitle(`${emoji} ${title}`).setColor(NIBY_ERROR_COLOR);
        if (description) embed.setDescription(description);
        return embed;
    }
}
module.exports = ThemedEmbed;