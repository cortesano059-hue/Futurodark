const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const safeReply = require("@safeReply");
const eco = require("@economy");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setrolepoli")
        .setDescription("Establece el rol requerido para los comandos policiales.")
        .addRoleOption(o =>
            o.setName("rol")
             .setDescription("Rol de policía")
             .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const role = interaction.options.getRole("rol");

        await eco.setPoliceRole(guildId, role.id);

        return safeReply(interaction, {
            content: `✅ El rol de policía se ha establecido como <@&${role.id}>`
        });
    }
};
