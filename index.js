// Registrar aliases y configurar variables de entorno lo antes posible
require('module-alias/register'); // ← habilita el uso de los alias
require('dotenv').config(); // ← carga las variables de entorno

// Instrumentar process.exit para registrar la traza cuando se llame
{ const _exit = process.exit; process.exit = function(code){
	try { throw new Error('process.exit called: ' + code); } catch(e) { console.error(e.stack); }
	return _exit.call(process, code);
}; }

// Loguear errores no atrapados para depuración del servidor web
process.on('unhandledRejection', (reason, p) => {
	console.error('Unhandled Rejection at:', p, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
	console.error('Uncaught Exception:', err);
});
process.on('beforeExit', (code) => {
	console.log('Process beforeExit, code:', code);
});
process.on('exit', (code) => {
	console.log('Process exit event, code:', code);
});

process.env.RUNNING_BOT = "true"; // ← habilita la conexión a Mongo solo al iniciar el bot REAL
const keepAlive = require('./src/web/server'); // ← habilita el servidor web

const MyClient = require('./src/structures/MyClient.js'); // ← carga el cliente
const client = new MyClient(); // ← crea una instancia del cliente

keepAlive(client); // ← inicia el servidor web

client.start(); // ← inicia el bot
