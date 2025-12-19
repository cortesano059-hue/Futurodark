module.exports = async (req, ctx) => {
  const member = await ctx.guild.members.fetch(ctx.user.id);
  const hasRole = member.roles.cache.has(req.roleId);

  if (req.mode === "not_have")
    return !hasRole;

  return hasRole;
};
