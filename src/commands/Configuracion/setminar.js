const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");

const safeReply = require("@src/utils/safeReply.js");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");
const eco = require("@economy");

/**
 * /setminar
 * Configura el requisito para usar /minar
 * - rol
 * - item
 * - ninguno
 */

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setminar")
    .setDescription("Configura el requisito necesario para minar")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    .addStringOption(o =>
      o
        .setName("tipo")
        .setDescription("Tipo de requisito")
        .setRequired(true)
        .addChoices(
          { name: "Rol", value: "role" },
          { name: "Item", value: "item" },
          { name: "Ninguno", value: "none" }
        )
    )

    .addStringOption(o =>
      o
        .setName("valor")
        .setDescription("ID del rol o nombre del item (no necesario si es ninguno)")
        .setRequired(false)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const tipo = interaction.options.getString("tipo");
    const valor = interaction.options.getString("valor");

    await interaction.deferReply({ ephemeral: true });

    // ============================
    // VALIDACIONES
    // ============================
    if (tipo === "role") {
      if (!valor)
        return interaction.editReply({
          content: "❌ Debes indicar el ID del rol.",
        });

      const roleExists = interaction.guild.roles.cache.has(valor);
      if (!roleExists)
        return interaction.editReply({
          content: "❌ El rol indicado no existe en este servidor.",
        });
    }

    if (tipo === "item") {
      if (!valor)
        return interaction.editReply({
          content: "❌ Debes indicar el nombre del item.",
        });

      const item = await eco.getItemByName(guildId, valor);
      if (!item)
        return interaction.editReply({
          content: "❌ El item indicado no existe.",
        });
    }

    // ============================
    // GUARDAR CONFIG
    // ============================
    if (tipo === "none") {
      await eco.setMiningConfig(guildId, {
        requireType: null,
        requireId: null,
      });
    } else {
      await eco.setMiningConfig(guildId, {
        requireType: tipo,
        requireId: valor,
      });
    }

    // ============================
    // EMBED RESPUESTA
    // ============================
    const embed = new ThemedEmbed(interaction)
      .setTitle("⛏️ Configuración de minería")
      .setColor("Green");

    if (tipo === "none") {
      embed.setDescription("Ahora **cualquiera puede usar `/minar`**.");
    }

    if (tipo === "role") {
      embed.setDescription(
        `Para minar será necesario tener el rol:\n<@&${valor}>`
      );
    }

    if (tipo === "item") {
      embed.setDescription(
        `Para minar será necesario tener el item:\n**${valor}**`
      );
    }

    return interaction.editReply({ embeds: [embed] });
  },
};
