const actionHandlers = require("./actions");
const checkRequires = require("./requirementsEngine");

async function runItem(item, ctx) {
  if (!item?.actions || !Array.isArray(item.actions)) return;

  for (const action of item.actions) {
    try {
      let type = action.type;
      let raw = action.raw;

      // 🔧 NORMALIZAR ALIAS HUMANOS
      if (type === "addrol") {
        const roleId = raw.replace(/[<@&>]/g, "").split(":").pop();
        type = "role";
        raw = `role:add:${roleId}`;
      }

      if (type === "removerol") {
        const roleId = raw.replace(/[<@&>]/g, "").split(":").pop();
        type = "role";
        raw = `role:remove:${roleId}`;
      }

      const handler = actionHandlers[type];
      if (!handler) continue;

      await handler({ ...action, type, raw }, ctx);

    } catch (err) {
      console.error("❌ Error ejecutando action:", err);
    }
  }
}

module.exports = {
  runItem,
  checkRequires, // ✅ AHORA EXISTE
};
