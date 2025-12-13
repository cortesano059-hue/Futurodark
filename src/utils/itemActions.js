/**
 * src/utils/itemActions.js
 *
 * Motor de acciones estilo UnbelievaBoat:
 * - message: messageText, embed (boolean)
 * - roles: addRoles[], removeRoles[]
 * - balance: money (number +/-), bank (number +/-)
 * - items: giveItem, giveAmount, removeItem, removeAmount
 *
 * Uso:
 *   const itemActions = require("@src/utils/itemActions");
 *   const res = await itemActions.executeActions(item, interaction, { qty: 1 });
 *
 * Devuelve:
 *   { success: true, messages: [ ... ], details: { ... } }
 */

const safeReply = require("@src/utils/safeReply.js");
const eco = require("@economy");

module.exports = {
  /**
   * Ejecuta todas las actions de un item.
   *
   * @param {Object} item - Documento Item de Mongo
   * @param {CommandInteraction} interaction - interacción original
   * @param {Object} opts - { qty: Number, targetUserId?: String, context?: any }
   */
  async executeActions(item, interaction, opts = {}) {
    const guildId = interaction.guild.id;
    const userId = opts.targetUserId || interaction.user.id;
    const member = interaction.guild.members.cache.get(userId) || interaction.member;
    const qty = Number(opts.qty || 1);

    const results = {
      success: true,
      messages: [], // mensajes listos para mostrar
      details: {
        moneyAdded: 0,
        moneyRemoved: 0,
        bankAdded: 0,
        bankRemoved: 0,
        rolesAdded: [],
        rolesRemoved: [],
        itemsGiven: [],
        itemsRemoved: [],
      },
      errors: [],
    };

    // Recorremos actions en orden
    for (const a of item.actions || []) {
      try {
        switch (a.type) {
          /* ========================= MESSAGE ========================= */
          case "message": {
            const text = (a.messageText || "").replace(/\{user\}/g, `<@${userId}>`)
                                               .replace(/\{item\}/g, item.itemName || item.itemName)
                                               .replace(/\{amount\}/g, `${qty}`);
            // Guardamos para mostrar luego (no enviamos automáticamente)
            results.messages.push(text);
            break;
          }

          /* ========================= ROLES ========================= */
          case "roles": {
            // addRoles
            if (Array.isArray(a.addRoles) && a.addRoles.length > 0) {
              for (const r of a.addRoles) {
                try {
                  // intentar resolver rol en el guild
                  const role = interaction.guild.roles.cache.get(r);
                  if (role) {
                    await member.roles.add(role).catch(() => {});
                    results.details.rolesAdded.push(role.id);
                  }
                } catch (err) {
                  // continuar con demás roles
                  results.errors.push(`Error añadiendo rol ${r}: ${err.message || err}`);
                }
              }
            }

            // removeRoles
            if (Array.isArray(a.removeRoles) && a.removeRoles.length > 0) {
              for (const r of a.removeRoles) {
                try {
                  const role = interaction.guild.roles.cache.get(r);
                  if (role) {
                    await member.roles.remove(role).catch(() => {});
                    results.details.rolesRemoved.push(role.id);
                  }
                } catch (err) {
                  results.errors.push(`Error quitando rol ${r}: ${err.message || err}`);
                }
              }
            }
            break;
          }

          /* ========================= BALANCE ========================= */
          case "balance": {
            // money (en mano)
            if (typeof a.money === "number" && a.money !== 0) {
              if (a.money > 0) {
                await eco.addMoney(userId, guildId, a.money, `item:${item.itemName}`);
                results.details.moneyAdded += a.money;
              } else {
                // a.money < 0 -> quitar dinero
                const removeRes = await eco.removeMoney(userId, guildId, Math.abs(a.money), `item:${item.itemName}`);
                if (!removeRes.success) {
                  results.errors.push(removeRes.message || `No se pudo quitar ${Math.abs(a.money)}$`);
                } else {
                  results.details.moneyRemoved += Math.abs(a.money);
                }
              }
            }

            // bank
            if (typeof a.bank === "number" && a.bank !== 0) {
              if (a.bank > 0) {
                // Para banco usamos funciones directas sobre usuario
                // eco.addMoney no afecta banco; usamos withdraw/deposit? Mejor: manipular User - pero aquí usamos eco.addMoney/add to bank via addMoney + deposit pattern
                // Si tu eco tiene addToBank, cámbialo; por defecto hacemos: add to bank via direct DB through econ API if exists.
                if (typeof eco.addToBank === "function") {
                  await eco.addToBank(userId, guildId, a.bank, `item:${item.itemName}`);
                } else {
                  // fallback: deposit from system
                  // no queremos quitar dinero de mano, así que actualizamos banco con setWorkaround
                  await eco.getUser(userId, guildId).then(u => {
                    if (u) {
                      u.bank = (u.bank || 0) + a.bank;
                      return u.save();
                    }
                  }).catch(()=>{});
                }
                results.details.bankAdded += a.bank;
              } else {
                // quitar de bank
                const amt = Math.abs(a.bank);
                if (typeof eco.removeFromBank === "function") {
                  const rr = await eco.removeFromBank(userId, guildId, amt, `item:${item.itemName}`);
                  if (!rr.success) results.errors.push(rr.message || `No se pudo quitar ${amt} banco`);
                } else {
                  // fallback: reduce bank field directly
                  await eco.getUser(userId, guildId).then(u => {
                    if (u) {
                      u.bank = Math.max(0, (u.bank || 0) - amt);
                      return u.save();
                    }
                  }).catch(()=>{});
                }
                results.details.bankRemoved += amt;
              }
            }
            break;
          }

          /* ========================= ITEMS ========================= */
          case "items": {
            // dar item
            if (a.giveItem && a.giveAmount && a.giveAmount > 0) {
              // eco.addToInventory espera (userId, guildId, itemName, amount)
              const added = await eco.addToInventory(userId, guildId, a.giveItem, a.giveAmount);
              if (added) results.details.itemsGiven.push({ item: a.giveItem, amount: a.giveAmount });
              else results.errors.push(`No se pudo dar item ${a.giveItem}`);
            }

            // quitar item
            if (a.removeItem && a.removeAmount && a.removeAmount > 0) {
              const removed = await eco.removeItem(userId, guildId, a.removeItem, a.removeAmount);
              if (removed && removed.success !== false) {
                results.details.itemsRemoved.push({ item: a.removeItem, amount: a.removeAmount });
              } else {
                results.errors.push(`No se pudo quitar item ${a.removeItem}`);
              }
            }

            break;
          }

          /* ========================= DEFAULT ========================= */
          default: {
            results.errors.push(`Tipo de acción desconocido: ${a.type}`);
          }
        }
      } catch (err) {
        results.errors.push(`Error ejecutando action ${a.type}: ${err.message || err}`);
      }
    } // for actions

    // Si hay mensajes acumulados los concatenamos al final
    // También mostramos un resumen sencillo de resultados (opcional)
    if (results.messages.length === 0 && results.errors.length === 0) {
      // si no hay mensajes pero hay cambios, añadimos resumen
      const summary = [];
      if (results.details.moneyAdded) summary.push(`💵 +${results.details.moneyAdded}`);
      if (results.details.moneyRemoved) summary.push(`💸 -${results.details.moneyRemoved}`);
      if (results.details.bankAdded) summary.push(`🏦 +${results.details.bankAdded}`);
      if (results.details.bankRemoved) summary.push(`🏦 -${results.details.bankRemoved}`);
      if (results.details.rolesAdded.length) summary.push(`➕ Roles añadidos: ${results.details.rolesAdded.map(r=>`<@&${r}>`).join(", ")}`);
      if (results.details.rolesRemoved.length) summary.push(`➖ Roles quitados: ${results.details.rolesRemoved.map(r=>`<@&${r}>`).join(", ")}`);
      if (results.details.itemsGiven.length) summary.push(`📦 Items dados: ${results.details.itemsGiven.map(i=>`${i.amount}x ${i.item}`).join(", ")}`);
      if (results.details.itemsRemoved.length) summary.push(`🗑️ Items quitados: ${results.details.itemsRemoved.map(i=>`${i.amount}x ${i.item}`).join(", ")}`);

      if (summary.length) results.messages.push(summary.join(" • "));
    }

    return results;
  }
};
