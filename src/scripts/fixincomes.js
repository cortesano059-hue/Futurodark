require("dotenv").config();
const mongoose = require("mongoose");
const { IncomeRole } = require("../database/mongodb.js");

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI no está definido.");
  process.exit(1);
}

(async () => {
  console.log("🔧 Conectando a Mongo...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Conectado.");

  const incomes = await IncomeRole.find({});
  let fixed = 0;

  for (const inc of incomes) {
    let update = {};

    // Si tenía income viejo → migrar
    if (inc.income !== undefined) {
      update.incomePerHour = inc.income;
      update.$unset = { income: "" };
    }

    // Si incomePerHour está mal (NaN o undefined)
    if (
      inc.incomePerHour === undefined ||
      inc.incomePerHour === null ||
      isNaN(inc.incomePerHour)
    ) {
      update.incomePerHour = 0;
      console.log(`⚠️ Arreglando rol ${inc.roleId}: valor corrupto.`);
    }

    if (Object.keys(update).length > 0) {
      await IncomeRole.updateOne({ _id: inc._id }, update);
      fixed++;
    }
  }

  console.log(`🛠 Registros corregidos: ${fixed}`);
  await mongoose.connection.close();
  console.log("🏁 Finalizado.");
})();
