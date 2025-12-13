// src/events/ready.js
const { Events, Routes, REST } = require("discord.js");
const logger = require("@src/utils/logger.js");
const { DutyStatus, IncomeRole, User } = require("@src/database/mongodb.js");
require("dotenv").config();

module.exports = {
    name: Events.ClientReady,
    once: true,

    async execute(client) {
        logger.info(`🤖 Bot conectado como ${client.user.tag}`);

        /* ======================================================
           REGISTRO AUTOMÁTICO DE COMANDOS
        ====================================================== */

        // Soportamos commandArray y commandsArray (por si el handler usa ambos)
        const commands = client.commandArray || client.commandsArray;

        if (!commands || commands.length === 0) {
            logger.error("❌ No hay comandos cargados para registrar.");
        } else {
            logger.info("📝 Registrando comandos GLOBAL y GUILD...");

            const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

            /* --- REGISTRO GLOBAL --- */
            try {
                await rest.put(
                    Routes.applicationCommands(client.user.id),
                    { body: commands }
                );
                logger.info(`🌍 Registrados ${commands.length} comandos GLOBAL.`);
            } catch (err) {
                logger.error("❌ Error registrando comandos GLOBAL:", err);
            }

            /* --- REGISTRO GUILD --- */
            try {
                await rest.put(
                    Routes.applicationGuildCommands(
                        client.user.id,
                        process.env.GUILD_ID
                    ),
                    { body: commands }
                );
                logger.info(`🏠 Registrados ${commands.length} comandos en la GUILD.`);
            } catch (err) {
                logger.error("❌ Error registrando comandos GUILD:", err);
            }

            logger.info("📌 Registro automático completado.");
        }

        /* ======================================================
           SISTEMA DE PAGOS AUTOMÁTICOS CADA 1 MINUTO
        ====================================================== */

        setInterval(async () => {
            try {
                const now = Date.now();
                const allDutyUsers = await DutyStatus.find({});

                for (const duty of allDutyUsers) {
                    const diffMs = now - duty.lastPayment.getTime();
                    const diffHours = diffMs / (1000 * 60 * 60);

                    // ¿Ya pasó 1h desde el último pago?
                    if (diffHours < 1) continue;

                    // Obtener sueldo configurado del rol
                    const incomeRole = await IncomeRole.findOne({
                        guildId: duty.guildId,
                        roleId: duty.roleId,
                    });

                    if (!incomeRole || !incomeRole.incomePerHour) {
                        logger.warn(
                            `⚠ Usuario ${duty.userId} tenía duty pero NO tiene income configurado. Eliminando duty.`
                        );

                        await DutyStatus.deleteOne({
                            userId: duty.userId,
                            guildId: duty.guildId,
                        });

                        continue;
                    }

                    const salary = incomeRole.incomePerHour;

                    // Sumar al banco del usuario
                    await User.findOneAndUpdate(
                        { userId: duty.userId, guildId: duty.guildId },
                        { $inc: { bank: salary } },
                        { upsert: true }
                    );

                    // Actualizar fecha del último pago
                    duty.lastPayment = new Date();
                    await duty.save();

                    // Enviar mensaje al canal si existe
                    const guild = client.guilds.cache.get(duty.guildId);
                    const channel = guild?.channels?.cache.get(duty.channelId);

                    if (channel) {
                        channel.send({
                            content: `<@${duty.userId}>`,
                            embeds: [
                                {
                                    title: "💵 Pago por servicio (1h)",
                                    description: `Has recibido **$${salary}** por tu última hora de servicio.`,
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
                logger.error("❌ Error en el sistema de pagos automáticos:", err);
            }
        }, 60 * 1000); // cada minuto

        logger.info("⏱ Sistema automático de salarios iniciado.");
    },
};
