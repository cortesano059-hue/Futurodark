const requireHandlers = require("./requires");
const actionHandlers = require("./actions");

async function runItem(item, ctx) {
  const trigger = ctx.trigger; // "buy" | "use"

  // =============================
  // VALIDAR REQUIRES
  // =============================
  for (const req of item.requires?.[trigger] ?? []) {
    const handler = requireHandlers[req.type];
    if (!handler)
      throw new Error(`Require no soportado: ${req.type}`);

    const ok = await handler(req, ctx);
    if (!ok)
      throw new Error("REQUIRE_NOT_MET");
  }

  // =============================
  // EJECUTAR ACTIONS
  // =============================
  for (const action of item.actions?.[trigger] ?? []) {
    const handler = actionHandlers[action.type];
    if (!handler)
      throw new Error(`Action no soportada: ${action.type}`);

    await handler(action, ctx);
  }
}

module.exports = {
  runItem
};
