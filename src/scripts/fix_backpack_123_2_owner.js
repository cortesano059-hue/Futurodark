require("dotenv").config();
const mongoose = require("mongoose");
const { Backpack } = require("../database/mongodb");

const OWNER_ID = "1190705096963657858";

(async () => {
  console.log("🔧 Arreglando dueño de mochila 123-2…");

  await mongoose.connect(process.env.MONGO_URI);

  const bp = await Backpack.findOne({ name: "123-2" });

  if (!bp) {
    console.log("ℹ️ Mochila 123-2 no encontrada (nada que hacer)");
    process.exit(0);
  }

  bp.ownerType = "user";
  bp.ownerId = OWNER_ID;

  await bp.save();

  console.log(
    `✅ Mochila ${bp.name} corregida → ownerType=user, ownerId=${OWNER_ID}`
  );

  process.exit(0);
})().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
