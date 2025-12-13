const fs = require('fs');
const path = require('path');
const { WebhookClient, EmbedBuilder } = require('discord.js');
const Transaction = require('@transactionModel'); // Importar el nuevo modelo

// Archivos de log locales
const LOG_FILE = path.join(__dirname, 'bot.log');
const ERROR_FILE = path.join(__dirname, 'error.log');

// Webhook ID y Token en .env
const WEBHOOK_ID = process.env.DISCORD_LOG_WEBHOOK_ID;
const WEBHOOK_TOKEN = process.env.DISCORD_LOG_WEBHOOK_TOKEN;

// Imagen común para todos los logs
const LOG_IMAGE = 'https://cdn.discordapp.com/attachments/1438575452288581632/1445213520194179163/Help__Comandos.png?ex=69303039&is=692edeb9&hm=c3449699c25fcab6a696f691bb6bca7b75ffe357395b493a26e4a913cb01226d&';

// Inicializar Webhook Client solo si hay credenciales
let webhook = null;
if (WEBHOOK_ID && WEBHOOK_TOKEN) {
    try {
        webhook = new WebhookClient({ id: WEBHOOK_ID, token: WEBHOOK_TOKEN });
    } catch(e) {
        console.error("❌ ERROR: WebhookClient no pudo inicializarse con las credenciales.");
    }
} else {
    console.warn("⚠️ Webhook de LOG no configurado (falta DISCORD_LOG_WEBHOOK_ID/TOKEN).");
}

// Cola para evitar spam al webhook
const queue = [];
let processingQueue = false;

async function processQueue() {
    if (processingQueue || !webhook) return;
    processingQueue = true;

    while (queue.length > 0) {
        const { type, content, source } = queue.shift();

        let title = 'Información';
        let color = '#3498db';

        if (type === 'warn') {
            title = 'Advertencia';
            color = '#f1c40f';
        } else if (type === 'error') {
            title = 'Error';
            color = '#e74c3c';
        }

        if (source) title += ` | ${source}`;

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription('```' + content + '```')
            .setColor(color)
            .setImage(LOG_IMAGE)
            .setTimestamp();

        try {
            await webhook.send({ embeds: [embed] });
        } catch (err) {
            // Error al enviar al webhook
        }

        await new Promise(r => setTimeout(r, 1000));
    }

    processingQueue = false;
}

// Función NUEVA: Loggear a la base de datos (Transacciones)
async function logTransaction({
    userId,
    targetId = null,
    guildId,
    type,
    amount,
    from = null,
    to = null,
    extra = {}
}) {
    if (!Transaction) return console.error("❌ Modelo Transaction no cargado.");
    try {
        await Transaction.create({
            userId,
            targetId,
            guildId,
            type,
            amount,
            from,
            to,
            extra
        });
    } catch (err) {
        console.error("❌ Error guardando transacción DB:", err);
    }
}

// Logger principal
const logger = {
    info: (msg, source) => {
        const message = `[INFO] ${msg}`;
        console.log(message);
        writeLog(LOG_FILE, message);
        queue.push({ type: 'info', content: msg, source });
        processQueue();
    },
    warn: (msg, source) => {
        const message = `[WARN] ${msg}`;
        console.warn(message);
        writeLog(LOG_FILE, message);
        queue.push({ type: 'warn', content: msg, source });
        processQueue();
    },
    error: (msg, source) => {
        const message = `[ERROR] ${msg}`;
        console.error(message);
        writeLog(ERROR_FILE, message);
        queue.push({ type: 'error', content: msg, source });
        processQueue();
    },
    logTransaction // Exportamos la nueva función logTransaction
};

function writeLog(file, message) {
    try {
        fs.appendFileSync(file, message + '\n', 'utf8');
    } catch (err) {
        console.error('❌ Error escribiendo en log local:', err);
    }
}

module.exports = logger;
