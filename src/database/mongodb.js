// 1. ESTO OBLIGATORIAMENTE ARRIBA DEL TODO
require("dotenv").config(); 

const mongoose = require("mongoose");
const { Schema } = mongoose;

/* ========================================================================== */
/* MONGODB CONNECTION                                                         */
/* ========================================================================== */

if (process.env.RUNNING_BOT === "true") {
  // Ahora sí funcionará porque ya hemos leído el .env arriba
  mongoose
    .connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    })
    .then(() => console.log("✅ MongoDB conectado"))
    .catch(err => console.error("❌ Error MongoDB:", err));
}

function getModel(name, schema) {
  return mongoose.models[name] || mongoose.model(name, schema);
}

/* ========================================================================== */
/* USERS                                                                      */
/* ========================================================================== */

const userSchema = new Schema({
  userId: String,
  guildId: String,

  money: { type: Number, default: 0 },
  bank: { type: Number, default: 5000 },

  daily_claim_at: { type: Number, default: 0 },
  work_cooldown: { type: Number, default: 0 },
  trash_cooldown: { type: Number, default: 0 },

  // 🔹 NUEVO: cooldown global robobadu (15 min)
  robobadu_cooldown: { type: Number, default: 0 },

  // ⛏️ NUEVO: cooldown minería
  mining_cooldown: { type: Number, default: 0 },

  // 🔹 NUEVO: Cache de inventario para el dashboard (Carga rápida)
  inventory_cache: [
    {
      id: String,
      name: String,
      count: { type: Number, default: 1 },
      emoji: String
    }
  ]
});
userSchema.index({ userId: 1, guildId: 1 }, { unique: true });
const User = getModel("User", userSchema);

/* ========================================================================== */
/* ITEMS                                                                      */
/* ========================================================================== */

const itemSchema = new Schema({
  guildId: String,
  itemName: String,
  description: String,
  emoji: String,
  price: Number,

  inventory: Boolean,
  usable: Boolean,
  sellable: Boolean,

  stock: Number,
  timeLimit: Number,

  requirements: { type: [String], default: [] },
  actions: { type: [String], default: [] },

  type: {
    type: String,
    enum: ["normal", "container"],
    default: "normal",
  },

  capacity: {
    type: Number,
    default: 0,
  },

  contents: [
    {
      itemId: {
        type: Schema.Types.ObjectId,
        ref: "Item",
        required: true,
      },
      amount: {
        type: Number,
        default: 1,
        min: 1,
      },
    },
  ],

  authorizedUsers: {
    type: [String],
    default: [],
  },

  data: { type: Object, default: {} },
});
itemSchema.index({ guildId: 1, itemName: 1 }, { unique: true });
const Item = getModel("Item", itemSchema);

/* ========================================================================== */
/* INVENTORY                                                                  */
/* ========================================================================== */

const inventorySchema = new Schema({
  userId: String,
  guildId: String,
  itemId: { type: Schema.Types.ObjectId, ref: "Item" },
  amount: Number,
});
inventorySchema.index(
  { userId: 1, guildId: 1, itemId: 1 },
  { unique: true }
);
const Inventory = getModel("Inventory", inventorySchema);

/* ========================================================================== */
/* BACKPACK (LEGACY EXTENDIDO – NIVEL 2)                                      */
/* ========================================================================== */

const backpackSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },

    ownerType: {
      type: String,
      enum: ["user", "role", "system"],
      default: "user",
      index: true,
    },

    ownerId: {
      type: String,
      default: null,
      index: true,
    },

    name: {
      type: String,
      required: true,
      index: true,
    },

    emoji: { type: String, default: null },
    description: { type: String, default: null },

    capacity: {
      type: Number,
      required: true,
      min: 1,
      default: 10,
    },

    accessType: {
      type: String,
      enum: ["owner_only", "custom"],
      default: "owner_only",
    },

    allowedUsers: { type: [String], default: [] },
    allowedRoles: { type: [String], default: [] },

    items: [
      {
        itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
        amount: { type: Number, required: true, min: 1 },
      },
    ],
  },
  { timestamps: true }
);

backpackSchema.pre("save", function () {
  if (!this.ownerType) {
    this.ownerType = this.ownerId ? "user" : "system";
  }
});

backpackSchema.index({ guildId: 1, name: 1 }, { unique: true });
const Backpack = getModel("Backpack", backpackSchema);

/* ========================================================================== */
/* DUTY STATUS                                                                */
/* ========================================================================== */

const dutyStatusSchema = new Schema({
  userId: String,
  guildId: String,
  roleId: String,
  startTime: Date,
  lastPayment: Date,
  channelId: String,
});
dutyStatusSchema.index({ guildId: 1, userId: 1 }, { unique: true });
const DutyStatus = getModel("DutyStatus", dutyStatusSchema);

/* ========================================================================== */
/* INCOME ROLE                                                                */
/* ========================================================================== */

const incomeRoleSchema = new Schema({
  guildId: String,
  roleId: String,
  incomePerHour: Number,
});
incomeRoleSchema.index({ guildId: 1, roleId: 1 }, { unique: true });
const IncomeRole = getModel("IncomeRole", incomeRoleSchema);

/* ========================================================================== */
/* DNI                                                                        */
/* ========================================================================== */

const dniSchema = new Schema({
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

/* ========================================================================== */
/* POLICE CONFIG                                                              */
/* ========================================================================== */

const policeConfigSchema = new Schema({
  guildId: { type: String, unique: true },
  roleId: String,
});
const PoliceConfig = getModel("PoliceConfig", policeConfigSchema);

/* ========================================================================== */
/* MARI CONFIG                                                                */
/* ========================================================================== */

const mariConfigSchema = new Schema({
  guildId: { type: String, unique: true },
  itemName: String,
  roleId: String,

  minConsume: { type: Number, default: 1 },
  maxConsume: { type: Number, default: 5 },

  minPrice: { type: Number, default: 20 },
  maxPrice: { type: Number, default: 50 },
});
const MariConfig = getModel("MariConfig", mariConfigSchema);

/* ========================================================================== */
/* BADULAQUE CONFIG                                                           */
/* ========================================================================== */

const badulaqueSchema = new Schema({
  guildId: { type: String, required: true },
  key: { type: String, required: true },

  reward: {
    itemName: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
  },

  image: { type: String, default: null },
});
badulaqueSchema.index({ guildId: 1, key: 1 }, { unique: true });
const Badulaque = getModel("Badulaque", badulaqueSchema);

/* ========================================================================== */
/* BADULAQUE LOCAL COOLDOWN (30 MIN)                                           */
/* ========================================================================== */

const badulaqueLocalCooldownSchema = new Schema({
  guildId: { type: String, required: true },
  key: { type: String, required: true },

  cooldownUntil: { type: Number, default: 0 },
});

badulaqueLocalCooldownSchema.index(
  { guildId: 1, key: 1 },
  { unique: true }
);

const BadulaqueLocalCooldown = getModel(
  "BadulaqueLocalCooldown",
  badulaqueLocalCooldownSchema
);

/* ========================================================================== */
/* MINING CONFIG                                                              */
/* ========================================================================== */

const miningConfigSchema = new Schema({
  guildId: { type: String, unique: true },

  requireType: {
    type: String,
    enum: ["role", "item", null],
    default: null,
  },

  requireId: {
    type: String,
    default: null,
  },
});

const MiningConfig = getModel("MiningConfig", miningConfigSchema);

/* ========================================================================== */
/* EXPORTS                                                                    */
/* ========================================================================== */

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
  Badulaque,
  BadulaqueLocalCooldown,
  MiningConfig,
};