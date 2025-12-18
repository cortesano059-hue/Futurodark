const { SlashCommandBuilder } = require("discord.js");
const { IncomeRole } = require("@src/database/mongodb");
const safeReply = require("@src/utils/safeReply");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("incomeall")
    .setDescription("Muestra todos los roles con salarios configurados."),

  async execute(interaction) {
    try {
      const guild = interaction.guild;
      const guildId = guild.id;

      const incomes = await IncomeRole.find({ guildId });

      if (!incomes || incomes.length === 0) {
        return safeReply(interaction, {
          embeds: [
            {
              title: "📄 Lista de salarios",
              description: "No hay salarios configurados en este servidor.",
              color: 0xe74c3c,
            },
          ],
        });
      }

      // Ordenar por salario (desc)
      incomes.sort((a, b) => b.incomePerHour - a.incomePerHour);

      const lines = [];

      for (let i = 0; i < incomes.length; i++) {
        const r = incomes[i];

        // Cache → fetch fallback
        let role = guild.roles.cache.get(r.roleId);
        if (!role) {
          try {
            role = await guild.roles.fetch(r.roleId);
          } catch {
            role = null;
          }
        }

        const roleTag = role ? `<@&${r.roleId}>` : "❌ Rol eliminado";

        lines.push(
          `**${i + 1}.** ${roleTag} — 💵 **$${r.incomePerHour.toLocaleString()}/hora**`
        );
      }

      // Protección límite embed
      const description = lines.join("\n").slice(0, 4000);

      return safeReply(interaction, {
        embeds: [
          {
            title: "💼 Salarios configurados",
            description,
            color: 0x3498db,
            footer: {
              text: `Total de roles con salario: ${incomes.length}`,
            },
          },
        ],
      });
    } catch (err) {
      console.error("❌ Error en /incomeall:", err);
      return safeReply(interaction, {
        content: "❌ Ocurrió un error al obtener los salarios.",
        ephemeral: true,
      });
    }
  },
};
