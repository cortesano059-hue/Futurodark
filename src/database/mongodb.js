const mongoose = require("mongoose");

if (process.env.RUNNING_BOT === "true") {
    mongoose
        .connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        })
        .then(() => console.log("✅ MongoDB conectado"))
        .catch((err) => console.error("❌ Error MongoDB:", err));
}

function getModel(name, schema) {
    return mongoose.models[name] || mongoose.model(name, schema);
}

/* ============================== USERS ============================== */
const userSchema = new mongoose.Schema({
    userId: String,
    guildId: String,

    money: { type: Number, default: 0 },
    bank: { type: Number, default: 5000 },

    daily_claim_at: { type: Number, default: 0 },
    work_cooldown: { type: Number, default: 0 },
    trash_cooldown: { type: Number, default: 0 },
});
userSchema.index({ userId: 1, guildId: 1 }, { unique: true });
const User = getModel("User", userSchema);

/* ============================== ITEMS ============================== */
const itemSchema = new mongoose.Schema({
    guildId: String,
    itemName: String,
    description: String,
    emoji: String,
    price: Number,
    type: String,
    inventory: Boolean,
    usable: Boolean,
    sellable: Boolean,
    stock: Number,
    timeLimit: Number,
    requirements: [String],
    actions: [String],
    data: Object,
});
itemSchema.index({ guildId: 1, itemName: 1 }, { unique: true });
const Item = getModel("Item", itemSchema);

/* ============================== INVENTORY ============================== */
const inventorySchema = new mongoose.Schema({
    userId: String,
    guildId: String,
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
    amount: Number,
});
inventorySchema.index({ userId: 1, guildId: 1, itemId: 1 }, { unique: true });
const Inventory = getModel("Inventory", inventorySchema);

/* ============================== BACKPACK ============================== */
const backpackSchema = new mongoose.Schema({
    guildId: String,
    ownerId: String,
    name: String,
    emoji: String,
    description: String,
    capacity: Number,
    accessType: String,
    allowedUsers: [String],
    allowedRoles: [String],
    items: [{
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
        amount: Number
    }]
});
backpackSchema.index({ guildId: 1, ownerId: 1, name: 1 }, { unique: true });
const Backpack = getModel("Backpack", backpackSchema);

/* ============================== DUTY STATUS ============================== */
const dutyStatusSchema = new mongoose.Schema({
    userId: String,
    guildId: String,
    roleId: String,
    startTime: Date,
    lastPayment: Date,
    channelId: String,
});
dutyStatusSchema.index({ guildId: 1, userId: 1 }, { unique: true });
const DutyStatus = getModel("DutyStatus", dutyStatusSchema);

/* ============================== INCOME ROLE ============================== */
const incomeRoleSchema = new mongoose.Schema({
    guildId: String,
    roleId: String,
    incomePerHour: Number,
});
incomeRoleSchema.index({ guildId: 1, roleId: 1 }, { unique: true });
const IncomeRole = getModel("IncomeRole", incomeRoleSchema);

/* ============================== DNI ============================== */
const dniSchema = new mongoose.Schema({
    userId: String,
    dni: String,
    nombre: String,
    apellido: String,
    edad: Number,
    nacionalidad: String,
    psid: String,
    guildId: String,
});
dniSchema.index({ userId: 1 }, { unique: true });
const Dni = getModel("Dni", dniSchema);

/* ============================== POLICE CONFIG ============================== */
const policeConfigSchema = new mongoose.Schema({
    guildId: { type: String, unique: true },
    roleId: String,
});
const PoliceConfig = getModel("PoliceConfig", policeConfigSchema);

/* ============================== MARI CONFIG ============================== */
const mariConfigSchema = new mongoose.Schema({
    guildId: { type: String, unique: true },
    itemName: String,
    roleId: String,

    minConsume: { type: Number, default: 1 },
    maxConsume: { type: Number, default: 5 },

    minPrice: { type: Number, default: 20 },
    maxPrice: { type: Number, default: 50 },
});
const MariConfig = getModel("MariConfig", mariConfigSchema);

/* ============================== EXPORT ============================== */
module.exports = {
    mongoose,
    User,
    Item,
    Inventory,
    Backpack,
    DutyStatus,
    IncomeRole,
    Dni,
    PoliceConfig,
    MariConfig,
};
