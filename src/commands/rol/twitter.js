const { SlashCommandBuilder } = require('discord.js');
const safeReply = require("@src/utils/safeReply.js");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('twitter')
        .setDescription('Publicar un tweet.')
        .addStringOption(o => o.setName('mensaje').setDescription('Texto').setRequired(true))
        .addAttachmentOption(o => o.setName('imagen').setDescription('Imagen opcional')),

    async execute(interaction) {
        await interaction.deferReply({ });

        try {
            const text = interaction.options.getString('mensaje');
            const img = interaction.options.getAttachment('imagen');

            const embed = new ThemedEmbed(interaction)
                .setAuthor({ name: `@${interaction.user.username}`, iconURL: 'https://cdn-icons-png.flaticon.com/512/733/733579.png' })
                .setTitle('🐦 Nuevo Tweet')
                .setDescription(text)
                .setColor('#1DA1F2')
                .setFooter({ text: 'Twitter for Discord', iconURL: interaction.user.displayAvatarURL() });

            if (img) embed.setImage(img.url);

            await safeReply(interaction, { embeds: [embed] });
        } catch (err) {
            console.error('❌ ERROR en twitter.js:', err);
            await safeReply(interaction, { content: '❌ Ocurrió un error al publicar el tweet.' });
        }
    }
};
