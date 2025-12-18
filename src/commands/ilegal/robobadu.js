const { SlashCommandBuilder } = require("discord.js");
const safeReply = require("@src/utils/safeReply");
const ThemedEmbed = require("@src/utils/ThemedEmbed");
const eco = require("@economy");
const {
  Badulaque,
  BadulaqueLocalCooldown,
} = require("@src/database/mongodb.js");

/* ========================================================================== */
/* CONSTANTES                                                                  */
/* ========================================================================== */

const USER_CD = 15 * 60 * 1000;
const BADU_CD = 30 * 60 * 1000;

const BADUS = ["central", "casino", "rojo", "verde", "licoreria"];

function formatTime(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("robobadu")
    .setDescription("Robo a un badulaque")
    .addSubcommand(s => s.setName("central").setDescription("Robo al Badulaque Central"))
    .addSubcommand(s => s.setName("casino").setDescription("Robo al Badulaque Casino"))
    .addSubcommand(s => s.setName("rojo").setDescription("Robo al Badulaque Rojo"))
    .addSubcommand(s => s.setName("verde").setDescription("Robo al Badulaque Verde"))
    .addSubcommand(s => s.setName("licoreria").setDescription("Robo al Badulaque Licorería")),

  async execute(interaction) {
    try {
      const sub = interaction.options.getSubcommand();
      const now = Date.now();

      if (!BADUS.includes(sub)) {
        return interaction.reply({
          content: "❌ Badulaque inválido.",
          ephemeral: true,
        });
      }

      /* ===================== USUARIO ===================== */

      const user = await eco.getUser(interaction.user.id, interaction.guild.id);

      if (user.robobadu_cooldown > now) {
        return interaction.reply({
          content: `⏳ Debes esperar **${formatTime(user.robobadu_cooldown - now)}** para volver a robar.`,
          ephemeral: true,
        });
      }

      /* ===================== CONFIG BADULAQUE ===================== */

      const cfg = await Badulaque.findOne({
        guildId: interaction.guild.id,
        key: sub,
      });

      if (!cfg) {
        return interaction.reply({
          content: "❌ Este badulaque no está configurado.",
          ephemeral: true,
        });
      }

      /* ===================== COOLDOWN LOCAL ===================== */

      let baduCd = await BadulaqueLocalCooldown.findOne({
        guildId: interaction.guild.id,
        key: sub,
      });

      if (!baduCd) {
        baduCd = await BadulaqueLocalCooldown.create({
          guildId: interaction.guild.id,
          key: sub,
          cooldownUntil: 0,
        });
      }

      if (baduCd.cooldownUntil > now) {
        return interaction.reply({
          content: `🏪 Este badulaque está en enfriamiento.\n⏳ Disponible en **${formatTime(baduCd.cooldownUntil - now)}**`,
          ephemeral: true,
        });
      }

      /* ===================== APLICAR COOLDOWNS ===================== */

      user.robobadu_cooldown = now + USER_CD;
      await user.save();

      baduCd.cooldownUntil = now + BADU_CD;
      await baduCd.save();

      /* ===================== RECOMPENSA ===================== */

      await eco.addToInventory(
        interaction.user.id,
        interaction.guild.id,
        cfg.reward.itemName,
        cfg.reward.amount
      );
 
      /* ===================== POLICÍA ===================== */

      const policeRoleId = await eco.getPoliceRole(interaction.guild.id);
      const policePing = policeRoleId ? `<@&${policeRoleId}>` : null;

      /* ===================== ENTORNO (PÚBLICO) ===================== */

      const embed = new ThemedEmbed(interaction)
        .setTitle("🚨 ROBO EN BADULAQUE")
        .setColor("#E74C3C")
        .setDescription(`🕵️ **Robo al Badulaque ${sub.toUpperCase()}**`)
        .addFields(
          { name: "📍 Ubicación", value: `Badulaque ${sub}`, inline: true },
          { name: "💰 Botín", value: `${cfg.reward.amount}x ${cfg.reward.itemName}`, inline: true }
        );

      if (cfg.image) embed.setImage(cfg.image);

      return interaction.reply({
        content: policePing
          ? `${policePing}\n🚓 **Robo en curso**`
          : `🚓 **Robo en curso**`,
        embeds: [embed],
        allowedMentions: policeRoleId ? { roles: [policeRoleId] } : {},
      });

    } catch (err) {
      console.error("❌ Error robobadu:", err);
      return interaction.reply({
        content: "❌ Ocurrió un error durante el robo.",
        ephemeral: true,
      });
    }
  },
};
