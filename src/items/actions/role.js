// src/items/actions/role.js

module.exports = async (action, ctx) => {
  try {
    const { guild, member } = ctx;
    if (!guild || !member) return;

    const { roleId, mode } = action;
    if (!roleId || !["add", "remove"].includes(mode)) return;

    const role = guild.roles.cache.get(roleId);
    if (!role) return;

    if (mode === "add") {
      await member.roles.add(role);
    }

    if (mode === "remove") {
      await member.roles.remove(role);
    }

  } catch (err) {
    console.error("❌ Error en action role:", err);
  }
};
