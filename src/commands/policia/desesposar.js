const { SlashCommandBuilder } = require('discord.js');
const safeReply = require("@src/utils/safeReply.js");
const eco = require("@economy");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('desesposar')
        .setDescription('Quita las esposas a un usuario.')
        .addUserOption(option =>
            option.setName('usuario')
            .setDescription('Usuario a desesposar')
            .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const guildId = interaction.guild.id;
        const policeRole = await eco.getPoliceRole(guildId);

        if (!policeRole)
            return safeReply(interaction, "⚠️ No se ha configurado el rol de policía.");

        if (!interaction.member.roles.cache.has(policeRole))
            return safeReply(interaction, `❌ Necesitas el rol <@&${policeRole}>.`);

        const user = interaction.options.getMember('usuario');

        if (!user)
            return safeReply(interaction, "❌ Usuario no encontrado.");

        const embed = ThemedEmbed.success(
            "🔓 Usuario liberado",
            `${user.user.tag} ya no está esposado.`
        );

        return safeReply(interaction, { embeds: [embed] });
    }
};
