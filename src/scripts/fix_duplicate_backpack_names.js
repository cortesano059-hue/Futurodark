require("dotenv").config();
const mongoose = require("mongoose");
const { Backpack } = require("../database/mongodb");

(async () => {
  console.log("🧹 Buscando mochilas con nombres duplicados…");

  await mongoose.connect(process.env.MONGO_URI);

  const backpacks = await Backpack.find({}).lean();

  const map = new Map();

  for (const bp of backpacks) {
    const key = `${bp.guildId}::${bp.name}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(bp);
  }

  let renamed = 0;

  for (const group of map.values()) {
    if (group.length <= 1) continue;

    group.sort((a, b) => String(a._id).localeCompare(String(b._id)));

    for (let i = 1; i < group.length; i++) {
      const oldName = group[i].name;
      const newName = `${oldName}-${i + 1}`;

      await Backpack.updateOne(
        { _id: group[i]._id },
        { $set: { name: newName } }
      );

      renamed++;
      console.log(`✏️ Renombrada: ${oldName} → ${newName}`);
    }
  }

  console.log("======================================");
  console.log(`🛠️ Mochilas renombradas: ${renamed}`);
  console.log("✅ Duplicados resueltos");
  console.log("======================================");

  process.exit(0);
})().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
