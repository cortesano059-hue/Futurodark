const Inventory = require("@database/mongodb").Inventory;

module.exports = async (req, ctx) => {
  const { user, guild } = ctx;

  const inv = await Inventory.findOne({
    userId: user.id,
    guildId: guild.id
  });

  const amount = inv?.items?.[req.item] ?? 0;

  if (req.mode === "not_have")
    return amount < (req.amount ?? 1);

  return amount >= (req.amount ?? 1);
};
