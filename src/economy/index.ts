import path from "path";
import fs from "fs";

const configPath = path.join(__dirname, "economy.config.json");

export function getEconomyConfig(): any {
    if (!fs.existsSync(configPath)) {
        throw new Error("No se encontró economy.config.json en src/economy");
    }
    const raw = fs.readFileSync(configPath, "utf8");
    const cleaned = raw.split('\n').filter(line => !line.trim().startsWith('//')).join('\n');
    try {
        return JSON.parse(cleaned);
    } catch(e) {
        console.error("❌ Error al parsear economy.config.json:", e);
        return {};
    }
}

