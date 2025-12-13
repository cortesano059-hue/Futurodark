process.env.RUNNING_BOT = "true"; // ← habilita la conexión a Mongo solo al iniciar el bot REAL

require('module-alias/register');
require('dotenv').config();

const MyClient = require('./src/structures/MyClient.js');
const client = new MyClient();

client.start();
