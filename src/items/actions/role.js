module.exports = async (action, ctx) => {
  const member = await ctx.guild.members.fetch(ctx.user.id);

  if (action.action === "add") {
    await member.roles.add(action.roleId);
  } else if (action.action === "remove") {
    await member.roles.remove(action.roleId);
  }
};
