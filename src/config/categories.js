// src/config/categories.js
// Configuración REAL de categorías según tu estructura y EmojiList

const { PermissionFlagsBits } = require("discord.js");
const EmojiList = require("@src/config/EmojiList.js");

module.exports = {
    // 📘 Información / Utilidad general
    info: {
        EMOJI: EmojiList.infoCategory || "📘",
        ALIASES: ["information", "ayuda"],
        GUILD_ONLY: false,
        PERMISSIONS: []
    },

    // 💰 Economía
    economy: {
        EMOJI: EmojiList.economy || "💰",
        ALIASES: ["eco"],
        GUILD_ONLY: true,
        PERMISSIONS: []
    },

    // 🧳 Inventario / Items
    inventory: {
        EMOJI: EmojiList.inventory || "📦",
        GUILD_ONLY: true,
        PERMISSIONS: []
    },

    // 🪪 Sistema DNI
    dni: {
        EMOJI: EmojiList.dni || "🪪",
        GUILD_ONLY: true,
        PERMISSIONS: []
    },

    // 🚨 Policía
    policia: {
        EMOJI: EmojiList.policia || "🚓",
        GUILD_ONLY: true,
        PERMISSIONS: []
    },

    // 🎭 Roleplay / Interacciones
    rol: {
        EMOJI: EmojiList.rol || "🎭",
        GUILD_ONLY: true,
        PERMISSIONS: []
    },

    // 🛡 Moderación (solo admins)
    moderacion: {
        EMOJI: EmojiList.moderacion || "🛡️",
        GUILD_ONLY: true,
        PERMISSIONS: [PermissionFlagsBits.ManageGuild]
    },

    // 🛠️ Developer (solo dueño del bot)
    developer: {
        EMOJI: EmojiList.developer || "🛠️",
        GUILD_ONLY: false,
        PERMISSIONS: []
    },

    // ⚠️ Si algo no coincide con carpeta, va aquí
    "Sin categoría": {
        EMOJI: EmojiList.warn || "⚠️"
    }
};
