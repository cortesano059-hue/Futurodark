const safeReply = require("@utils/safeReply");

module.exports = {
  customId: "shop_select",

  async execute(interaction) {
    try {
      const selected = interaction.values?.[0];
      if (!selected) {
        return safeReply(interaction, {
          content: "❌ No se ha seleccionado ningún item.",
          ephemeral: true
        });
      }

      // Marcar opción seleccionada como default
      const components = interaction.message.components.map(row => {
        row.components.forEach(comp => {
          if (comp.data?.options) {
            comp.data.options.forEach(opt => {
              opt.default = opt.value === selected;
            });
          }
        });
        return row;
      });

      await interaction.update({
        components
      });
    } catch (err) {
      console.error("Error en shopMenu:", err);
      return safeReply(interaction, {
        content: "❌ Error al seleccionar el item.",
        ephemeral: true
      });
    }
  }
};
