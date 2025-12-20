const { Item } = require("@database/mongodb");

module.exports = async function shopPayload() {
  const items = await Item.find({
    price: { $gt: 0 }
  }).lean();

  return items.map(item => ({
    label: item.displayName ?? item.name,
    value: item.name,
    description: item.description?.slice(0, 100) ?? "Sin descripción"
  }));
};
