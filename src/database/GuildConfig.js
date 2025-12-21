const mongoose = require('mongoose');

const GuildConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  prefix: { type: String, default: '.' },
  welcomeChannel: { type: String, default: null },
  leaveChannel: { type: String, default: null },
  modsRole: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

GuildConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.GuildConfig || mongoose.model('GuildConfig', GuildConfigSchema);
