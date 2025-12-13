// src/database/Transaction.js
// Modelo para guardar logs de transacciones de economía.

const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    targetId: { type: String },
    guildId: { type: String, required: true },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    from: { type: String },
    to: { type: String },
    extra: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
