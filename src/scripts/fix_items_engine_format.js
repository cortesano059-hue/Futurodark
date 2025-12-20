require("dotenv").config();
const mongoose = require("mongoose");

async function connectMongo() {
  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  });

  console.log("✅ MongoDB conectado (script)");
}

const { Item } = require("../database/mongodb");

const VALID_TYPES = ["normal", "container"];

/* ===============================
 * NORMALIZADORES
 * =============================== */

function normalizeToStrings(value) {
  if (!value) return [];

  // ya es array de strings
  if (Array.isArray(value) && value.every(v => typeof v === "string")) {
    return value;
  }

  // array mixto / corrupto
  if (Array.isArray(value)) {
    return value.flatMap(v => normalizeToStrings(v));
  }

  // objeto → string
  if (typeof value === "object") {
    if (value.type === "role" && value.roleId) {
      return [`role:${value.roleId}`];
    }

    if (value.type === "balance" && value.amount !== undefined) {
      return [`balance:wallet:${value.amount}`];
    }

    if (value.type === "item" && value.item) {
      return [`item:${value.item}:${value.amount ?? 1}`];
    }

    return [];
  }

  // string suelta
  if (typeof value === "string") {
    return [value];
  }

  return [];
}

async function run() {
  console.log("🔧 Reparando items para el engine nuevo...");
  await connectMongo();

  const items = await Item.find({});
  let fixed = 0;

  for (const item of items) {
    let changed = false;

    // =============================
    // NORMALIZAR TYPE
    // =============================
    if (!VALID_TYPES.includes(item.type)) {
      console.log(
        `⚠️ Item ${item.itemName} tiene type inválido (${item.type}) → normal`
      );
      item.type = "normal";
      changed = true;
    }

    // =============================
    // NORMALIZAR REQUIREMENTS
    // =============================
    const normReq = normalizeToStrings(item.requirements);
    if (JSON.stringify(normReq) !== JSON.stringify(item.requirements)) {
      item.requirements = normReq;
      changed = true;
    }

    // =============================
    // NORMALIZAR ACTIONS
    // =============================
    const normAct = normalizeToStrings(item.actions);
    if (JSON.stringify(normAct) !== JSON.stringify(item.actions)) {
      item.actions = normAct;
      changed = true;
    }

    // =============================
    // ENGINE FIELDS
    // =============================
    if (!item.requires) {
      item.requires = { buy: normReq, use: normReq };
      changed = true;
    }

    if (!item.actionsV2) {
      item.actionsV2 = { buy: normAct, use: normAct };
      changed = true;
    }

    if (changed) {
      await item.save();
      fixed++;
      console.log(`✔️ Reparado: ${item.itemName}`);
    }
  }

  console.log(`✅ Reparación completada. Items reparados: ${fixed}`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error("❌ Error en script:", err);
  process.exit(1);
});
