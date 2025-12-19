const eco = require("@economy");

module.exports = async (req, ctx) => {
  const { user, guild } = ctx;

  const balance = req.source === "bank"
    ? await eco.getBank(user.id, guild.id)
    : await eco.getBalance(user.id, guild.id);

  return balance >= req.amount;
};
