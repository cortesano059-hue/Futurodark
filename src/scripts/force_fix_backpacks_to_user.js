require("dotenv").config();
const mongoose = require("mongoose");
const { Backpack } = require("../database/mongodb");

const DEFAULT_USER_ID = "1190705096963657858";

(async () => {
  console.log("🔧 Forzando mochilas a usuario…");

  await mongoose.connect(process.env.MONGO_URI);

  const backpacks = await Backpack.find({});
  let fixed = 0;

  for (const bp of backpacks) {
    let changed = false;

    if (bp.name === "123") {
      bp.ownerType = "user";
      bp.ownerId = DEFAULT_USER_ID;
      changed = true;
    }

    if (
      bp.ownerId &&
      /^[0-9]{17,20}$/.test(bp.ownerId) &&
      bp.ownerType !== "user"
    ) {
      bp.ownerType = "user";
      changed = true;
    }

    if (bp.ownerType === "user" && !bp.ownerId) {
      bp.ownerId = DEFAULT_USER_ID;
      changed = true;
    }

    if (changed) {
      await bp.save();
      fixed++;
      console.log(
        `✅ Corregida: ${bp.name} → ownerType=user, ownerId=${bp.ownerId}`
      );
    }
  }

  console.log("======================================");
  console.log(`🛠️ Mochilas corregidas: ${fixed}`);
  console.log("✅ Forzado completado");
  console.log("======================================");

  process.exit(0);
})().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
