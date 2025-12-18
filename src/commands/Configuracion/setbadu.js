const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");

const safeReply = require("@src/utils/safeReply");
const { Badulaque } = require("@database/mongodb");
const eco = require("@economy");

/* ========================================================================== */
/* BADULAQUES DISPONIBLES                                                      */
/* ========================================================================== */

const BADUS = [
  { name: "Badulaque Central", value: "central" },
  { name: "Badulaque Casino", value: "casino" },
  { name: "Badulaque Rojo", value: "rojo" },
  { name: "Badulaque Verde", value: "verde" },
  { name: "Badulaque Licorería", value: "licoreria" },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setbadu")
    .setDescription("Configura recompensas e imagen de un badulaque")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    .addStringOption(o =>
      o.setName("badulaque")
        .setDescription("Badulaque a configurar")
        .setRequired(true)
        .addChoices(...BADUS)
    )

    .addStringOption(o =>
      o.setName("item")
        .setDescription("Item que se entregará al robar")
        .setRequired(true)
    )

    .addIntegerOption(o =>
      o.setName("cantidad")
        .setDescription("Cantidad del item")
        .setRequired(true)
        .setMinValue(1)
    )

    .addStringOption(o =>
      o.setName("imagen")
        .setDescription("URL de la imagen del local")
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const key = interaction.options.getString("badulaque");
      const itemName = interaction.options.getString("item");
      const amount = interaction.options.getInteger("cantidad");
      const image = interaction.options.getString("imagen");

      /* ===================== VALIDACIONES ===================== */

      const item = await eco.getItemByName(interaction.guild.id, itemName);
      if (!item) {
        return safeReply(interaction, {
          content: `❌ El item **${itemName}** no existe en este servidor.`,
        });
      }

      /* ===================== UPSERT CONFIG ===================== */

      await Badulaque.findOneAndUpdate(
        {
          guildId: interaction.guild.id,
          key,
        },
        {
          reward: {
            itemName,
            amount,
          },
          ...(image !== null ? { image } : {}),
        },
        {
          upsert: true,
          new: true,
        }
      );

      /* ===================== RESPUESTA ===================== */

      let msg = `✅ **Badulaque configurado correctamente**\n\n`;
      msg += `🏪 **Local:** ${key}\n`;
      msg += `🎁 **Recompensa:** ${amount}x ${itemName}`;

      if (image) msg += `\n🖼️ **Imagen establecida**`;

      return safeReply(interaction, { content: msg });

    } catch (err) {
      console.error("❌ Error en setbadu.js:", err);
      return safeReply(interaction, {
        content: "❌ Ocurrió un error al configurar el badulaque.",
      });
    }
  },
};
