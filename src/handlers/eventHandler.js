// src/handlers/eventHandler.js
const fs = require('fs');
const path = require('path');

module.exports = async function eventHandler(client) {
    const eventsPath = path.join(__dirname, '..', 'events');

    const traverse = (dir) => {
        if (!fs.existsSync(dir)) return;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) traverse(full);
            else if (entry.name.endsWith('.js')) {
                try {
                    delete require.cache[require.resolve(full)];
                    const event = require(full);
                    if (!event || !event.name || !event.execute) {
                        console.warn(`⚠ Evento inválido o incompleto: ${full}`);
                        continue;
                    }
                    if (event.once) {
                        client.once(event.name, (...args) => event.execute(...args, client));
                    } else {
                        client.on(event.name, (...args) => event.execute(...args, client));
                    }
                    console.log(`✔ Evento cargado: ${event.name}`);
                } catch (err) {
                    console.error(`🔴 Error cargando evento ${full}:`, err);
                }
            }
        }
    };

    traverse(eventsPath);
};