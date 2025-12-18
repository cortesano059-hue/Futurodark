// src/schedulers/salaryScheduler.js

console.log("🔥 salaryScheduler FILE CARGADO");

const eco = require("@economy");
const { DutyStatus, IncomeRole } = require("@src/database/mongodb.js");
const logger = require("@logger");

module.exports.startSalaryScheduler = (client) => {
  console.log("💼 Salary scheduler ACTIVO");

  setInterval(async () => {
    try {
      const now = Date.now();
      const duties = await DutyStatus.find({});

      for (const duty of duties) {
        if (!duty.lastPayment) continue;

        const last = new Date(duty.lastPayment).getTime();
        const diffHours = (now - last) / (1000 * 60 * 60);

        if (diffHours < 1) continue;

        const role = await IncomeRole.findOne({
          guildId: duty.guildId,
          roleId: duty.roleId,
        });

        if (!role || !role.incomePerHour) {
          await DutyStatus.deleteOne({ _id: duty._id });
          continue;
        }

        // 💰 PAGO AL BANCO
        await eco.addBank(
          duty.userId,
          duty.guildId,
          role.incomePerHour,
          "salary_auto"
        );

        duty.lastPayment = new Date();
        await duty.save();

        // 📩 ENVÍO DEL EMBED
        const guild = client.guilds.cache.get(duty.guildId);
        const channel = guild?.channels?.cache.get(duty.channelId);

        if (channel) {
          channel.send({
            content: `<@${duty.userId}>`,
            embeds: [
              {
                title: "💵 Pago por servicio (1h)",
                description: `Has recibido **$${role.incomePerHour.toLocaleString()}** por tu última hora de servicio.`,
                color: 0x2ecc71,
                footer: {
                  text: "Sistema automático de salarios",
                },
              },
            ],
          }).catch(() => {});
        }
      }
    } catch (err) {
      logger.error("❌ Error en salaryScheduler:", err);
    }
  }, 60 * 1000);
};
