// src/utils/escapeRegex.js
module.exports = function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};