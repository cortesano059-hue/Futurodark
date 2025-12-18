require("dotenv").config();
const mongoose = require("mongoose");
const { Backpack } = require("../database/mongodb");

(async () => {
  console.log("🧹 Reparando índices de mochilas…");

  await mongoose.connect(process.env.MONGO_URI);

  const collection = Backpack.collection;
  const indexes = await collection.indexes();

  console.log("📌 Índices actuales:", indexes.map(i => i.name));

  const OLD_INDEX = "ownerId_1_guildId_1_name_1";

  if (indexes.some(i => i.name === OLD_INDEX)) {
    await collection.dropIndex(OLD_INDEX);
    console.log(`✅ Índice eliminado: ${OLD_INDEX}`);
  }

  await collection.createIndex(
    { guildId: 1, name: 1 },
    { unique: true }
  );

  console.log("✅ Índice correcto creado: { guildId, name }");
  console.log("======================================");
  console.log("✅ Índices arreglados");
  console.log("======================================");

  process.exit(0);
})().catch(err => {
  console.error("❌ Error en índices:", err);
  process.exit(1);
});
