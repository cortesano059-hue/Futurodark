require("dotenv").config();

const {
  User,
  Item,
  Inventory,
  DutyStatus,
  IncomeRole,
  Dni,
  PoliceConfig,
  MariConfig,
  MiningConfig,
} = require("./mongodb.js");

const logger = require("@logger");

/**
 * Sistema de economía / items / configs
 */

module.exports = {
  DAILY_COOLDOWN: 86400000, // 24h

  /* ===========================
     USUARIOS
  =========================== */
  async getUser(userId, guildId) {
    if (!userId || !guildId) return null;

    const user = await User.findOneAndUpdate(
      { userId, guildId },
      {
        $setOnInsert: {
          userId,
          guildId,
          money: 0,
          bank: 5000,
          daily_claim_at: 0,
          work_cooldown: 0,
          trash_cooldown: 0,
          mining_cooldown: 0,
        },
      },
      { new: true, upsert: true }
    );

    return user;
  },

  async getBalance(userId, guildId) {
    const u = await this.getUser(userId, guildId);
    if (!u)
      return {
        money: 0,
        bank: 0,
        dailyClaim: 0,
        workCooldown: 0,
        trashCooldown: 0,
      };

    return {
      money: Number(u.money || 0),
      bank: Number(u.bank || 0),
      dailyClaim: u.daily_claim_at || 0,
      workCooldown: u.work_cooldown || 0,
      trashCooldown: u.trash_cooldown || 0,
    };
  },

  /* ===========================
     DINERO
  =========================== */
  async addMoney(userId, guildId, amount, type = "system") {
    const u = await this.getUser(userId, guildId);
    const n = Number(amount);
    if (!u || n <= 0) return false;

    u.money = (u.money || 0) + n;
    await u.save();

    logger.logTransaction?.({
      userId,
      guildId,
      type,
      amount: n,
      to: "money",
    });

    return true;
  },

  async addBank(userId, guildId, amount, type = "system") {
    const u = await this.getUser(userId, guildId);
    const n = Number(amount);
    if (!u || n <= 0) return false;

    u.bank = (u.bank || 0) + n;
    await u.save();

    logger.logTransaction?.({
      userId,
      guildId,
      type,
      amount: n,
      to: "bank",
    });

    return true;
  },

  async removeMoney(userId, guildId, amount, type = "system") {
    const u = await this.getUser(userId, guildId);
    const n = Number(amount);
    if (!u)
      return { success: false, message: "Usuario no encontrado." };

    if ((u.money || 0) < n)
      return { success: false, message: "No tienes suficiente dinero." };

    u.money = (u.money || 0) - n;
    await u.save();

    logger.logTransaction?.({
      userId,
      guildId,
      type,
      amount: -n,
      from: "money",
    });

    return { success: true };
  },

  async deposit(userId, guildId, amount) {
    const u = await this.getUser(userId, guildId);
    const n = Number(amount);
    if (!u || n <= 0) return { success: false };

    if ((u.money || 0) < n)
      return { success: false, message: "No tienes suficiente dinero." };

    u.money -= n;
    u.bank = (u.bank || 0) + n;
    await u.save();

    logger.logTransaction?.({
      userId,
      guildId,
      type: "deposit",
      amount: n,
      from: "money",
      to: "bank",
    });

    return { success: true };
  },

  async withdraw(userId, guildId, amount) {
    const u = await this.getUser(userId, guildId);
    const n = Number(amount);
    if (!u || n <= 0) return { success: false };

    if ((u.bank || 0) < n)
      return { success: false, message: "No tienes suficiente banco." };

    u.bank -= n;
    u.money = (u.money || 0) + n;
    await u.save();

    logger.logTransaction?.({
      userId,
      guildId,
      type: "withdraw",
      amount: n,
      from: "bank",
      to: "money",
    });

    return { success: true };
  },

  /* ===========================
     ITEMS
  =========================== */

  async getItemByName(guildId, name) {
    if (!guildId || !name) return null;
    return Item.findOne({
      guildId,
      itemName: { $regex: `^${name}$`, $options: "i" },
    });
  },

  async getAllItems(guildId) {
    if (!guildId) return [];
    return Item.find({ guildId }).sort({ itemName: 1 });
  },

  /**
   * ✅ IMPLEMENTACIÓN REAL DE createItem
   * Usada por /item crear
   */
  async createItem(guildId, data = {}) {
    if (!guildId || !data?.itemName) {
      throw new Error("INVALID_ITEM_DATA");
    }

    const exists = await Item.findOne({
      guildId,
      itemName: { $regex: `^${data.itemName}$`, $options: "i" },
    });

    if (exists) {
      throw new Error("ITEM_ALREADY_EXISTS");
    }

    const item = await Item.create({
      guildId,
      itemName: data.itemName,
      description: data.description || "",
      emoji: data.emoji || "📦",
      price: Number(data.price || 0),
      type: data.type || "misc",
      usable: Boolean(data.usable),
      sellable: Boolean(data.sellable),
      inventory: data.inventory !== false,

      // 🔥 CLAVE PARA TU ENGINE
      actions: Array.isArray(data.actions) ? data.actions : [],
      requires: Array.isArray(data.requires) ? data.requires : [],
    });

    return item;
  },

  /* ===========================
     INVENTARIO
  =========================== */

  async getUserInventory(userId, guildId) {
    const data = await Inventory.find({ userId, guildId }).populate("itemId");
    return data.map(entry => ({
      itemName: entry.itemId?.itemName || "???",
      description: entry.itemId?.description || "",
      emoji: entry.itemId?.emoji || "📦",
      amount: entry.amount || 0,
      price: entry.itemId?.price || 0,
      type: entry.itemId?.type || "misc",
      usable: entry.itemId?.usable || false,
      sellable: entry.itemId?.sellable || false,
      inventory: entry.itemId?.inventory ?? true,
    }));
  },

  async hasItem(userId, guildId, itemName) {
    const item = await this.getItemByName(guildId, itemName);
    if (!item) return false;

    const inv = await Inventory.findOne({
      userId,
      guildId,
      itemId: item._id,
    });

    return !!inv && inv.amount > 0;
  },

  async addToInventory(userId, guildId, itemName, amount = 1) {
    const item = await this.getItemByName(guildId, itemName);
    if (!item) return false;

    let slot = await Inventory.findOne({
      userId,
      guildId,
      itemId: item._id,
    });

    if (!slot) {
      await Inventory.create({
        userId,
        guildId,
        itemId: item._id,
        amount,
      });
    } else {
      slot.amount += amount;
      await slot.save();
    }
    return true;
  },

  async removeItem(userId, guildId, itemName, amount = 1) {
    const item = await this.getItemByName(guildId, itemName);
    if (!item) return { success: false, reason: "ITEM_NOT_FOUND" };

    const slot = await Inventory.findOne({
      userId,
      guildId,
      itemId: item._id,
    });

    if (!slot || slot.amount < amount)
      return { success: false, reason: "NOT_ENOUGH_ITEMS" };

    slot.amount -= amount;
    if (slot.amount <= 0) await slot.deleteOne();
    else await slot.save();

    return { success: true };
  },

  /* ===========================
     MINERÍA
  =========================== */

  async getMiningCooldown(userId, guildId) {
    const u = await this.getUser(userId, guildId);
    return u ? Number(u.mining_cooldown || 0) : 0;
  },

  async setMiningCooldown(userId, guildId, ts) {
    const u = await this.getUser(userId, guildId);
    u.mining_cooldown = Number(ts);
    await u.save();
    return u.mining_cooldown;
  },

  async getMiningConfig(guildId) {
    return MiningConfig.findOne({ guildId });
  },

  async setMiningConfig(guildId, data = {}) {
    return MiningConfig.findOneAndUpdate(
      { guildId },
      data,
      { upsert: true, new: true }
    );
  },
};
