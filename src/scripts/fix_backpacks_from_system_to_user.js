require("dotenv").config();
const mongoose = require("mongoose");
const { Backpack } = require("../database/mongodb");

const USER_ID = "1190705096963657858"; // TU ID

(async () => {
  console.log("🔧 Reparando mochilas marcadas como sistema…");

  await mongoose.connect(process.env.MONGO_URI);

  const backpacks = await Backpack.find({});
  let fixed = 0;

  for (const bp of backpacks) {
    // Si está como sistema pero debería ser personal
    if (
      bp.ownerType === "system" &&
      (!bp.ownerId || bp.ownerId === null)
    ) {
      bp.ownerType = "user";
      bp.ownerId = USER_ID;

      await bp.save();
      fixed++;

      console.log(
        `✅ Mochila ${bp.name} → ownerType=user, ownerId=${USER_ID}`
      );
    }
  }

  console.log("======================================");
  console.log(`🛠️ Mochilas reparadas: ${fixed}`);
  console.log("✅ Reparación completada");
  console.log("======================================");

  process.exit(0);
})().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
