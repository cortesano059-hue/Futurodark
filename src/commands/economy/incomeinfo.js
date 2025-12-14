// src/commands/economy/incomeinfo.js
const { SlashCommandBuilder } = require("discord.js");
const { IncomeRole } = require("@src/database/mongodb.js");
const safeReply = require("@src/utils/safeReply.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("incomeinfo")
    .setDescription("Muestra el salario configurado de un rol.")
    .addRoleOption(o =>
      o.setName("rol")
        .setDescription("Rol a consultar")
        .setRequired(true)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const role = interaction.options.getRole("rol");

    const info = await IncomeRole.findOne({ guildId, roleId: role.id });

    if (!info)
      return safeReply(interaction, `❌ El rol **${role.name}** no tiene salario configurado.`);

    return safeReply(interaction, {
      embeds: [
        {
          title: "📄 Información salarial",
          // FIX: Aplicamos toLocaleString() al monto.
          description:
            `El rol **${role.name}** cobra **$${info.incomePerHour.toLocaleString()}/hora**.`,
          color: 0xf1c40f,
        }
      ]
    });
  },
};