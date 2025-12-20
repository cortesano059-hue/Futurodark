const { EmbedBuilder } = require("discord.js");

module.exports = async (action, ctx) => {
  try {
    if (!ctx?.interaction) return;

    const interaction = ctx.interaction;
    const itemName = ctx.item?.itemName ?? "el item";

    let text = action.text || "";
    text = text.replace(/{item}/gi, itemName);

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setDescription(text)
      .setTimestamp();

    await interaction.followUp({
      embeds: [embed],
      ephemeral: true,
    });

  } catch (err) {
    console.error("❌ Error en action message:", err);
  }
};
