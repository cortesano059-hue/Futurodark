module.exports = async (action, ctx) => {
  const content = action.content ?? "Acción ejecutada.";

  if (ctx.interaction.replied || ctx.interaction.deferred) {
    await ctx.interaction.followUp({ content, ephemeral: true });
  } else {
    await ctx.interaction.reply({ content, ephemeral: true });
  }
};
