// src/items/actions/message.js

module.exports = async (action, ctx) => {
  try {
    if (!action?.text) return;

    // Guardar el mensaje para que /item usar lo muestre
    ctx.customMessage = action.text.replace(
      /{item}/gi,
      ctx.item?.itemName ?? "el item"
    );

  } catch (err) {
    console.error("❌ Error en action message:", err);
  }
};
