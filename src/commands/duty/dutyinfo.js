// src/commands/duty/dutyinfo.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { DutyStatus } = require("@src/database/mongodb.js");
const safeReply = require("@src/utils/safeReply.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dutyinfo")
    .setDescription("Muestra qué usuarios están actualmente en servicio."),

  async execute(interaction) {
    const guildId = interaction.guild.id;

    const active = await DutyStatus.find({ guildId });

    if (active.length === 0) {
      return safeReply(interaction, "🟡 No hay nadie en servicio.");
    }

    const embed = new EmbedBuilder()
      .setTitle("👮 Usuarios en servicio")
      .setColor("#3498db")
      .setDescription(
        active
          .map(duty => {
            const role = interaction.guild.roles.cache.get(duty.roleId);
            const start = new Date(duty.startTime).getTime();
            const mins = Math.floor((Date.now() - start) / 60000);

            return `• <@${duty.userId}> — ${role ?? "Rol eliminado"} — **${mins} min**`;
          })
          .join("\n")
      );

    return safeReply(interaction, { embeds: [embed] });
  },
};
