// Test runner para iniciar sólo el servidor web con un cliente simulado
const serverFactory = require('./src/web/server');

const fakeGuilds = new Map();
fakeGuilds.size = 0;
fakeGuilds.cache = fakeGuilds;
fakeGuilds.reduce = function(fn, init){ return init || 0; };

const client = {
    user: { username: 'TestBot', displayAvatarURL: (opts) => 'https://cdn.discordapp.com/embed/avatars/0.png' },
    commands: new Map([['ping', { category: 'Info', data: { name: 'ping', description: 'Responde pong' } }]]),
    guilds: fakeGuilds
};

serverFactory(client);
console.log('Test web server started');
