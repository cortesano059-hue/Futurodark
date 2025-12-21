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
                    
                    // 🆕 NUEVO: Detectamos el nombre de la carpeta actual
                    // Si el archivo está en 'commands/Economia', esto devuelve 'Economia'
                    const folderName = path.basename(dir);
                    
                    // Guardamos la carpeta dentro del comando para que la web la lea
                    cmd.folder = folderName; 

                    client.commands.set(cmd.data.name, cmd);
                    client.commandArray.push(cmd.data.toJSON());
                    console.log(`✔ Comando cargado: ${cmd.data.name} (Carpeta: ${folderName})`);
                } else {
                    console.warn(`⚠ Comando inválido: ${full}`);
                }

            } catch (err) {
                console.error(`🔴 Error cargando comando ${full}:`, err);
            }
        }
    };

    traverse(commandsDir);

    console.log("📌 Comandos cargados y clasificados por carpetas.");
};