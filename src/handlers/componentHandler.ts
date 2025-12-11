import fs from 'fs';
import path from 'path';
import { Collection } from 'discord.js';
import MyClient from '../structures/MyClient.js';

export default async function componentHandler(client: MyClient): Promise<void> {
    client.buttons = client.buttons || new Collection();
    client.selectMenus = client.selectMenus || new Collection();
    client.modals = client.modals || new Collection();

    const componentsPath = path.join(__dirname, '..', 'components');

    const loadFiles = (dir: string, collection: Collection<string, any>): void => {
        if (!fs.existsSync(dir)) return;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                loadFiles(full, collection);
            } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
                try {
                    delete require.cache[require.resolve(full)];
                    const component = require(full);

                    const key = component.data?.name || component.customId;
                    if (!key) {
                        console.warn(`⚠ Componente sin key (data.name o customId): ${full}`);
                        continue;
                    }

                    if (component.check && typeof component.handlePagination === 'function') {
                        collection.set(key, component);
                        continue;
                    }

                    collection.set(key, component);
                    console.log(`🟢 Componente cargado: ${key}`);
                } catch (err) {
                    console.error(`🔴 Error cargando componente: ${full}`, err);
                }
            }
        }
    };

    loadFiles(path.join(componentsPath, 'buttons'), client.buttons);
    loadFiles(path.join(componentsPath, 'selectMenus'), client.selectMenus);
    loadFiles(path.join(componentsPath, 'modals'), client.modals);

    console.log('✅ Todos los componentes cargados correctamente.');
}

