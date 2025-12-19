const Inventory = require("@database/mongodb").Inventory;

module.exports = async (action, ctx) => {
  const { user, guild } = ctx;
  const amount = action.amount ?? 1;

  let inv = await Inventory.findOne({
    userId: user.id,
    guildId: guild.id
  });

  if (!inv) {
    inv = new Inventory({
      userId: user.id,
      guildId: guild.id,
      items: {}
    });
  }

  inv.items[action.item] = (inv.items[action.item] ?? 0) + amount;

  if (inv.items[action.item] <= 0)
    delete inv.items[action.item];

  await inv.save();
};
