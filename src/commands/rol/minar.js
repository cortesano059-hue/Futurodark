const { SlashCommandBuilder } = require("discord.js");
const safeReply = require("@src/utils/safeReply.js");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");
const eco = require("@economy");

// ============================
// CONFIGURACIÓN SIMPLE
// ============================
const MINING_CONFIG = {
  cooldown: 10 * 1000, // ⏱️ 10 segundos

  minerals: {
    cuarzo: { price: 40, chance: 0.6, quantity: [1, 5] },
    mercurio: { price: 125, chance: 0.4, quantity: [1, 4] },
    apatito: { price: 500, chance: 0.25, quantity: [1, 3] },
    malaquita: { price: 1000, chance: 0.15, quantity: [1, 2] },
    oro: { price: 1250, chance: 0.12, quantity: [1, 2] },
    rubi: { price: 5000, chance: 0.05, quantity: [1, 1] },
    esmeralda: { price: 10000, chance: 0.025, quantity: [1, 1] },
    obsidiana: { price: 15000, chance: 0.015, quantity: [1, 1] },
    diamante: { price: 20000, chance: 0.01, quantity: [1, 1] },
  },

  rarities: {
    roto: { chance: 0.45, multiplier: 0.5 },
    bruto: { chance: 0.4, multiplier: 1 },
    puro: { chance: 0.15, multiplier: 2 },
  },
};

// ============================
// UTILIDADES
// ============================
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chance(p) {
  return Math.random() < p;
}

function pickRarity(rarities) {
  let roll = Math.random();
  let acc = 0;

  for (const [key, data] of Object.entries(rarities)) {
    acc += data.chance;
    if (roll <= acc) return key;
  }

  return "bruto";
}

function formatTime(ms) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;

  if (m > 0) return `${m}m ${r}s`;
  return `${r}s`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("minar")
    .setDescription("Minar minerales y obtener dinero"),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const member = interaction.member;

    await interaction.deferReply({ ephemeral: true });

    // ============================
    // COOLDOWN
    // ============================
    const cd = await eco.getMiningCooldown(userId, guildId);
    if (cd > Date.now()) {
      const wait = cd - Date.now();

      const cdEmbed = new ThemedEmbed(interaction)
        .setTitle("⏳ Minería en cooldown")
        .setColor("Orange")
        .setDescription(
          `Debes esperar **${formatTime(wait)}** para volver a minar.`
        );

      return interaction.editReply({ embeds: [cdEmbed] });
    }

    // ============================
    // CONFIG DE MINERÍA
    // ============================
    const config = await eco.getMiningConfig(guildId);

    if (config?.requireType === "role") {
      if (!member.roles.cache.has(config.requireId)) {
        return interaction.editReply({
          content: "❌ No tienes el rol necesario para minar.",
        });
      }
    }

    if (config?.requireType === "item") {
      const hasItem = await eco.hasItem(userId, guildId, config.requireId);
      if (!hasItem) {
        return interaction.editReply({
          content: "❌ Necesitas un item para minar.",
        });
      }
    }

    // ============================
    // MINADO
    // ============================
    let totalMoney = 0;
    let lines = [];

    for (const [name, data] of Object.entries(MINING_CONFIG.minerals)) {
      if (!chance(data.chance)) continue;

      const rarity = pickRarity(MINING_CONFIG.rarities);
      const qtyBase = random(data.quantity[0], data.quantity[1]);
      const qtyFinal = Math.max(
        1,
        Math.floor(qtyBase * MINING_CONFIG.rarities[rarity].multiplier)
      );

      const earned = qtyFinal * data.price;
      totalMoney += earned;

      lines.push(
        `⛏️ **${name}** (${rarity}) × ${qtyFinal} → **${earned}$**`
      );
    }

    // ============================
    // SET COOLDOWN
    // ============================
    await eco.setMiningCooldown(
      userId,
      guildId,
      Date.now() + MINING_CONFIG.cooldown
    );

    // ============================
    // RESPUESTA
    // ============================
    if (!totalMoney) {
      const emptyEmbed = new ThemedEmbed(interaction)
        .setTitle("⛏️ Minería")
        .setColor("Grey")
        .setDescription("No has encontrado nada esta vez.");

      return interaction.editReply({ embeds: [emptyEmbed] });
    }

    await eco.addMoney(userId, guildId, totalMoney, "mining");

    const resultEmbed = new ThemedEmbed(interaction)
      .setTitle("⛏️ Resultado de la minería")
      .setColor("Gold")
      .setDescription(lines.join("\n"))
      .addFields({
        name: "💰 Total ganado",
        value: `**${totalMoney}$**`,
        inline: false,
      })
      .setFooter({
        text: `Cooldown: ${formatTime(MINING_CONFIG.cooldown)}`,
      });

    return interaction.editReply({ embeds: [resultEmbed] });
  },
};
