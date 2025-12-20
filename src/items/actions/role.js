module.exports = async (action, ctx) => {
  try {
    if (!ctx?.interaction || !ctx.guild || !ctx.user) return;

    const interaction = ctx.interaction;
    const guild = ctx.guild;
    const user = ctx.user;

    // raw: role:add:ROLE_ID  o  role:remove:ROLE_ID
    const parts = action.raw.split(":");
    if (parts.length < 3) return;

    const mode = parts[1]; // add | remove
    let roleId = parts[2];

    // Limpiar mención <@&ID>
    roleId = roleId.replace(/[<@&>]/g, "");

    const role = guild.roles.cache.get(roleId);
    if (!role) return;

    // ⚠️ SIEMPRE FETCH DEL MIEMBRO
    const member = await guild.members.fetch(user.id);
    if (!member) return;

    if (mode === "add") {
      if (!member.roles.cache.has(roleId)) {
        await member.roles.add(role);
      }
    }

    if (mode === "remove") {
      if (member.roles.cache.has(roleId)) {
        await member.roles.remove(role);
      }
    }

  } catch (err) {
    console.error("❌ Error en action role:", err);
  }
};
