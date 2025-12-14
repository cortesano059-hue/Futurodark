const { SlashCommandBuilder } = require('discord.js');
const safeReply = require("@src/utils/safeReply.js");
const eco = require("@economy");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('esposar')
        .setDescription('Esposa a un usuario.')
        .addUserOption(option =>
            option.setName('usuario')
            .setDescription('Usuario a esposar')
            .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const guildId = interaction.guild.id;
        const policeRole = await eco.getPoliceRole(guildId);
        const user = interaction.options.getMember('usuario'); // Obtenemos el GuildMember

        if (!policeRole)
            return safeReply(interaction, "⚠️ No se ha configurado el rol de policía.");

        if (!interaction.member.roles.cache.has(policeRole))
            return safeReply(interaction, `❌ Necesitas el rol <@&${policeRole}>.`);

        if (!user)
            return safeReply(interaction, "❌ Usuario no encontrado.");

        if (user.id === interaction.user.id)
            return safeReply(interaction, "❌ No puedes esposarte a ti mismo.");

        const embed = ThemedEmbed.success(
            "🔒 Usuario esposado",
            // FIX: Mención explícita y displayName para el ejecutor
            `<@${user.id}> ha sido esposado por ${interaction.member}.`
        );

        return safeReply(interaction, { embeds: [embed] });
    }
};