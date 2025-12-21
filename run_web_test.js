// Tiny runner to start the web server with a minimal stub client for debugging static files
const keepAlive = require('./src/web/server');

const fakeClient = {
  user: {
    username: 'LocalDebug',
    displayAvatarURL: ({ format, size } = {}) => 'https://cdn.discordapp.com/embed/avatars/0.png'
  },
  commands: new Map(),
  guilds: {
    cache: []
  }
};

// adapt cache methods for compatibility
const cache = fakeClient.guilds.cache;
cache.get = function() { return null; };
cache.has = function() { return false; };
cache.forEach = Array.prototype.forEach.bind(cache);
cache.reduce = Array.prototype.reduce ? Array.prototype.reduce.bind(cache) : function(cb, init) { return init; };
cache.size = 0;

keepAlive(fakeClient);
