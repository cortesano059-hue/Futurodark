import mongoose from "mongoose";
import { IncomeRole } from "../discord/base/database/mongodb.js";
import { env } from "#env";

(async () => {
  console.log("🔧 Conectando a Mongo...");
  await mongoose.connect(env.MONGO_URI, {
    dbName: env.DATABASE_NAME
  });
  console.log("✅ Conectado.");

  const incomes = await IncomeRole.find({});
  let fixed = 0;

  for (const inc of incomes) {
    let update: any = {};

    // Si tenía income viejo → migrar
    if ((inc as any).income !== undefined) {
      update.incomePerHour = (inc as any).income;
      update.$unset = { income: "" };
    }

    // Si incomePerHour está mal (NaN o undefined)
    if (
      (inc as any).incomePerHour === undefined ||
      (inc as any).incomePerHour === null ||
      isNaN((inc as any).incomePerHour)
    ) {
      update.incomePerHour = 0;
      console.log(`⚠️ Arreglando rol ${(inc as any).roleId}: valor corrupto.`);
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
