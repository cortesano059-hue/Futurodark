// src/utils/safeReply.js
const { EmbedBuilder } = require('discord.js');

/**
 * safeReply: Envía respuestas de forma inteligente (reply, editReply o followUp).
 * Corrige el problema del "Bot está pensando".
 */
module.exports = async function safeReply(interaction, payload) {
    if (!payload) return;

    // 1. Normalizar la entrada (permite pasar solo un string)
    let data;
    if (typeof payload === 'string') {
        data = { content: payload, ephemeral: true };
    } else {
        // Copiamos para no mutar el original
        data = { ...payload };
        // Si no se especifica ephemeral, por defecto true (seguridad), 
        // pero si ya se hizo deferReply, esto se ignorará en favor de lo que se puso en el defer.
        if (data.ephemeral === undefined) data.ephemeral = true;
    }

    // Aseguramos flags correctos si es efímero
    if (data.ephemeral && !data.flags) {
        data.flags = 64; // MessageFlags.Ephemeral
    }

    try {
        // 2. Lógica de Respuesta Correcta
        if (!interaction) return console.error('❌ safeReply: Interacción nula');

        // CASO A: Ya se respondió completamente (reply o editReply exitoso) -> Usamos followUp para un mensaje NUEVO
        if (interaction.replied) {
            return await interaction.followUp(data);
        }

        // CASO B: Se pausó (deferReply) pero no se ha editado aún -> Usamos editReply para QUITAR el "Pensando..."
        if (interaction.deferred) {
            return await interaction.editReply(data);
        }

        // CASO C: Interacción virgen -> Usamos reply normal
        return await interaction.reply(data);

    } catch (err) {
        // Ignoramos error "Unknown interaction" (pasa si tardas más de 15 min o si el usuario borró el mensaje)
        if (err.code !== 10062 && err.code !== 40060) {
            console.error('⚠️ Error en safeReply:', err.message);
        }
    }
};