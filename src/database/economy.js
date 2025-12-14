// src/database/economy.js
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
        },
      },
      { new: true, upsert: true }
    );

    return user;
  },

  async getBalance(userId, guildId) {
    const u = await this.getUser(userId, guildId);
    if (!u) return { money: 0, bank: 0, dailyClaim: 0, workCooldown: 0, trashCooldown: 0 };

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

  async removeMoney(userId, guildId, amount, type = "system") {
    const u = await this.getUser(userId, guildId);
    const n = Number(amount);
    if (!u) return { success: false, message: "Usuario no encontrado." };

    if ((u.money || 0) < n) return { success: false, message: "No tienes suficiente dinero." };

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

    if ((u.money || 0) < n) return { success: false, message: "No tienes suficiente dinero." };

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

    if ((u.bank || 0) < n) return { success: false, message: "No tienes suficiente banco." };

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
     COOLDOWNS
  =========================== */
  async setWorkCooldown(userId, guildId, ts) {
    const u = await this.getUser(userId, guildId);
    u.work_cooldown = Number(ts);
    await u.save();
    return u.work_cooldown;
  },

  async getWorkCooldown(userId, guildId) {
    const u = await this.getUser(userId, guildId);
    return u ? Number(u.work_cooldown || 0) : 0;
  },

  async setTrashCooldown(userId, guildId, ts) {
    const u = await this.getUser(userId, guildId);
    u.trash_cooldown = Number(ts);
    await u.save();
    return u.trash_cooldown;
  },

  async getTrashCooldown(userId, guildId) {
    const u = await this.getUser(userId, guildId);
    return u ? Number(u.trash_cooldown || 0) : 0;
  },

  async claimDaily(userId, guildId) {
    const u = await this.getUser(userId, guildId);
    u.daily_claim_at = Date.now();
    await u.save();
    return u.daily_claim_at;
  },

  /* ===========================
     ITEMS / SHOP
  =========================== */
  async getItemByName(guildId, name) {
    if (!name) return null;
    return Item.findOne({ guildId, itemName: { $regex: `^${name}$`, $options: "i" } });
  },

  async createItem(guildId, name, price = 0, desc = "", emoji = "📦", extra = {}) {
    const exists = await this.getItemByName(guildId, name);
    if (exists) return null;

    const item = new Item({
      guildId,
      itemName: name,
      price: Number(price || 0),
      description: desc || "",
      emoji: emoji || "📦",
      ...extra,
    });

    await item.save();
    return item;
  },

  async deleteItem(guildId, name) {
    const item = await this.getItemByName(guildId, name);
    if (!item) return false;

    await Inventory.deleteMany({ itemId: item._id });
    await item.deleteOne();
    return true;
  },

  /* Inventory functions using itemName (string) */
  async getUserInventory(userId, guildId) {
    const data = await Inventory.find({ userId, guildId }).populate("itemId");
    return data.map((entry) => ({
      itemName: entry.itemId?.itemName || "???",
      description: entry.itemId?.description || "",
      emoji: entry.itemId?.emoji || "📦",
      amount: entry.amount || 0,
      price: entry.itemId?.price || 0,
      type: entry.itemId?.type || "misc",
      usable: entry.itemId?.usable || false,
      sellable: entry.itemId?.sellable || false,
      inventory: entry.itemId?.inventory || true,
    }));
  },

  async addToInventory(userId, guildId, itemName, amount = 1) {
    const item = await this.getItemByName(guildId, itemName);
    if (!item) return false;

    let slot = await Inventory.findOne({ userId, guildId, itemId: item._id });
    if (!slot) {
      slot = await Inventory.create({ userId, guildId, itemId: item._id, amount });
    } else {
      slot.amount += amount;
      await slot.save();
    }
    return true;
  },

  async removeItem(userId, guildId, itemName, amount = 1) {
    const item = await this.getItemByName(guildId, itemName);
    if (!item) return { success: false };

    const slot = await Inventory.findOne({ userId, guildId, itemId: item._id });
    if (!slot || slot.amount < amount) return { success: false };

    slot.amount -= amount;
    if (slot.amount <= 0) await slot.deleteOne();
    else await slot.save();

    return { success: true };
  },

  async getShop(guildId) {
    return Item.find({ guildId }).sort({ price: 1 });
  },

  /* ===========================
     CONFIG: POLICÍA
  =========================== */
  async setPoliceRole(guildId, roleId) {
    return PoliceConfig.findOneAndUpdate({ guildId }, { roleId }, { upsert: true, new: true });
  },

  async getPoliceRole(guildId) {
    const cfg = await PoliceConfig.findOne({ guildId });
    return cfg ? cfg.roleId : null;
  },

  /* ===========================
     CONFIG: VENDER MARÍA
     - setMariConfig / getMariConfig
     - convenience setters setMariItem / setMariRole
     - sellMari (logic)
  =========================== */

  async setMariConfig(guildId, data = {}) {
    // data should be an object that can contain:
    // { itemName, minConsume, maxConsume, minPrice, maxPrice, roleId }
    return MariConfig.findOneAndUpdate({ guildId }, { $set: data }, { new: true, upsert: true });
  },

  async getMariConfig(guildId) {
    return MariConfig.findOne({ guildId });
  },

  async setMariItem(guildId, itemName) {
    const cfg = await this.getMariConfig(guildId);
    if (!cfg) {
      return this.setMariConfig(guildId, { itemName });
    }
    cfg.itemName = itemName;
    await cfg.save();
    return cfg;
  },

  async setMariRole(guildId, roleId) {
    const cfg = await this.getMariConfig(guildId);
    if (!cfg) {
      return this.setMariConfig(guildId, { roleId });
    }
    cfg.roleId = roleId;
    await cfg.save();
    return cfg;
  },

  async sellMari(userId, guildId) {
    const cfg = await this.getMariConfig(guildId);
    if (!cfg) return { success: false, message: "Config no establecida." };

    // Prepare safe numbers with defaults
    const itemName = cfg.itemName;
    const minConsume = Number(cfg.minConsume ?? 1);
    const maxConsume = Number(cfg.maxConsume ?? 1);
    const minPrice = Number(cfg.minPrice ?? 1);
    const maxPrice = Number(cfg.maxPrice ?? 1);

    if (!itemName) return { success: false, message: "Item no configurado." };
    if (minConsume > maxConsume || minPrice > maxPrice) return { success: false, message: "Configuración inválida." };

    const consumeQty = Math.floor(Math.random() * (maxConsume - minConsume + 1)) + minConsume;
    const unitPrice = Math.floor(Math.random() * (maxPrice - minPrice + 1)) + minPrice;
    const total = consumeQty * unitPrice;

    // consume
    const removed = await this.removeItem(userId, guildId, itemName, consumeQty);
    if (!removed.success) return { success: false, message: "No tienes suficiente mercancía." };

    // give money
    await this.addMoney(userId, guildId, total, "mari_sell");

    return {
      success: true,
      consume: consumeQty,
      earn: total,
      priceUnit: unitPrice,
    };
  },
};