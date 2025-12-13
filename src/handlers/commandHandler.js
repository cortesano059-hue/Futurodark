// src/handlers/commandHandler.js
const fs = require('fs');
const path = require('path');

// Función para resolver el alias @commands
const resolveAliasPath = () => {
    try {
        const alias = require('module-alias')._aliases['@commands'];
        if (alias) return path.join(process.cwd(), alias);
    } catch (e) {}

    return path.join(__dirname, '..', 'commands');
};

module.exports = async function commandHandler(client) {
    client.commandArray = [];

    const commandsDir = resolveAliasPath();

    const traverse = (dir) => {
        if (!fs.existsSync(dir)) {
            console.error(`❌ Directorio de comandos no encontrado: ${dir}`);
            return;
        }

        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                traverse(full);
                continue;
            }

            if (!entry.name.endsWith(".js")) continue;

            try {
                delete require.cache[require.resolve(full)];
                const cmd = require(full);

                if (cmd?.data && cmd?.execute) {
                    client.commands.set(cmd.data.name, cmd);
                    client.commandArray.push(cmd.data.toJSON());
                    console.log(`✔ Comando cargado: ${cmd.data.name}`);
                } else {
                    console.warn(`⚠ Comando inválido: ${full}`);
                }

            } catch (err) {
                console.error(`🔴 Error cargando comando ${full}:`, err);
            }
        }
    };

    traverse(commandsDir);

    console.log("📌 Comandos cargados. (Listos para registrarse en ready.js)");
};
