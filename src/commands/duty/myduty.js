// src/commands/duty/myduty.js
const { SlashCommandBuilder } = require("discord.js");
const { DutyStatus, IncomeRole } = require("@src/database/mongodb.js");
const safeReply = require("@src/utils/safeReply.js");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");

function formatHM(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("myduty")
    .setDescription("Muestra tu estado de servicio y salario."),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    const duty = await DutyStatus.findOne({ userId, guildId });

    /* ===============================
       CASO: FUERA DE SERVICIO
    =============================== */
    if (!duty) {
      const embed = new ThemedEmbed(interaction)
        .setTitle("🚫 Fuera de servicio")
        .setDescription("Actualmente **no estás en servicio**.")
        .addFields({
          name: "ℹ️ Información",
          value: "Usa `/onduty` para comenzar tu turno.",
        })
        .setColor("#e74c3c");

      return safeReply(interaction, { embeds: [embed] });
    }

    /* ===============================
       CASO: EN SERVICIO
    =============================== */

    const now = Date.now();

    // Tiempo total en servicio
    const start = new Date(duty.startTime).getTime();
    const totalServiceMin = Math.floor((now - start) / 60000);

    // Último / próximo pago
    const lastPaymentAt = new Date(duty.lastPayment).getTime();
    const sinceLastPayMin = Math.floor((now - lastPaymentAt) / 60000);
    const nextPayInMin = Math.max(0, 60 - sinceLastPayMin);

    // Sueldo por hora
    let salaryText = "No configurado";
    if (duty.roleId) {
      const income = await IncomeRole.findOne({
        guildId,
        roleId: duty.roleId,
      });

      if (income?.incomePerHour) {
        salaryText = `$${income.incomePerHour.toLocaleString()} / h`;
      }
    }

    const embed = new ThemedEmbed(interaction)
      .setTitle("🧑 Tu estado de servicio")
      .addFields(
        {
          name: "🧾 Tiempo total en servicio",
          value: formatHM(totalServiceMin),
          inline: false,
        },
        {
          name: "💵 Sueldo",
          value: salaryText,
          inline: false,
        },
        {
          name: "💰 Último pago",
          value:
            sinceLastPayMin <= 0
              ? "Hace menos de 1 min"
              : `Hace ${sinceLastPayMin} min`,
          inline: true,
        },
        {
          name: "⌛ Próximo pago",
          value:
            nextPayInMin <= 0 ? "Ahora" : `En ${nextPayInMin} min`,
          inline: true,
        }
      )
      .setColor("#2ecc71");

    return safeReply(interaction, { embeds: [embed] });
  },
};
