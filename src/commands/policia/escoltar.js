const { SlashCommandBuilder } = require('discord.js');
const eco = require("@economy");
const safeReply = require("@safeReply");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('escoltar')
        .setDescription('Escolta a un usuario.')
        .addUserOption(option =>
            option.setName('usuario')
            .setDescription('Usuario a escoltar')
            .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const policeRole = await eco.getPoliceRole(interaction.guild.id);
        const user = interaction.options.getMember("usuario"); // Obtenemos el GuildMember

        if (!policeRole)
            return safeReply(interaction, "⚠️ No se ha configurado el rol de policía.");

        if (!interaction.member.roles.cache.has(policeRole))
            return safeReply(interaction, `❌ Necesitas el rol <@&${policeRole}>.`);

        if (!user)
            return safeReply(interaction, "❌ Usuario no encontrado.");

        const embed = ThemedEmbed.success(
            "🚓 Escolta iniciada",
            // FIX: Usar las menciones de los objetos
            `${interaction.member} ha comenzado a escoltar a ${user}.`
        );

        return safeReply(interaction, { embeds: [embed] });
    }
};