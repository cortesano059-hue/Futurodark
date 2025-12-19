const eco = require("@economy");

module.exports = async (action, ctx) => {
  const { user, guild } = ctx;

  if (action.source === "bank") {
    await eco.addBank(user.id, guild.id, action.amount);
  } else {
    await eco.addMoney(user.id, guild.id, action.amount);
  }
};
