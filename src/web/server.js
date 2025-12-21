const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const { User } = require('../database/mongodb');
const GuildConfig = require('../database/GuildConfig');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

module.exports = (client) => {
    const puerto = process.env.PORT || 3000;
    const OWNER_ID = process.env.OWNER_ID;

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Seguridad, compresión y límites
    if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
    // Allow loading images/resources from external CDNs (Discord CDN, etc.)
    app.use(helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' }
    }));
    app.use(compression());

    // Content Security Policy: sólo en producción (en desarrollo puede bloquear recursos externos)
    if (process.env.NODE_ENV === 'production') {
        app.use((req, res, next) => {
            const csp = [
                "default-src 'self' https:",
                "img-src 'self' data: https://cdn.discordapp.com https://media.discordapp.net",
                "script-src 'self' https://cdnjs.cloudflare.com 'unsafe-inline'",
                "style-src 'self' https://cdnjs.cloudflare.com 'unsafe-inline'",
                "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com data:",
                "connect-src 'self' https://discord.com wss:"
            ].join('; ');
            res.setHeader('Content-Security-Policy', csp);
            next();
        });
    }

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 100 // 100 requests por ventana por IP
    });
    app.use(limiter);

    // Servir archivos estáticos (css, images, js)
    app.use(express.static(path.join(__dirname, 'public')));

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done) => done(null, obj));

    passport.use(new Strategy({
        clientID: process.env.CLIENT_ID || client.user.id,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL,
        scope: ['identify', 'guilds']
    }, (accessToken, refreshToken, profile, done) => {
        process.nextTick(() => done(null, profile));
    }));

    app.use(session({
        secret: process.env.SESSION_SECRET || 'DarkRP-Super-Secret-Key',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'lax'
        }
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');

    const checkAuth = (req, res, next) => {
        if (req.isAuthenticated()) return next();
        res.redirect('/login');
    };

    // --- RUTA: LOGIN / LOGOUT ---
    app.get('/login', passport.authenticate('discord'));
    app.get('/auth/discord/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => res.redirect('/dashboard'));
    app.get('/logout', (req, res, next) => { req.logout(err => { if (err) return next(err); res.redirect('/'); })});

    // --- RUTA: INICIO ---
    app.get('/', async (req, res) => {
        let economia = { money: 0, bank: 0 };
        if (req.user && process.env.GUILD_ID) {
            try {
                const data = await User.findOne({ userId: req.user.id, guildId: process.env.GUILD_ID });
                if (data) { economia.money = data.money; economia.bank = data.bank; }
            } catch(e) {}
        }
        res.render('index', { 
            bot: client.user, 
            stats: { 
                servers: client.guilds.cache.size, 
                users: client.guilds.cache.reduce((a, g) => a + g.memberCount, 0) 
            },
            user: req.user || null, 
            economy: economia
        });
    });

    // --- RUTA: COMANDOS (DINÁMICA POR CARPETAS) ---
    app.get('/comandos', (req, res) => {
        const grupos = {};

        // client.commands contiene los comandos cargados en el arranque del bot
        client.commands.forEach(cmd => {
            // Usamos la carpeta (category) definida en la carga de comandos
            const categoria = cmd.category || 'Otros'; 
            
            if (!grupos[categoria]) {
                grupos[categoria] = [];
            }

            grupos[categoria].push({
                name: cmd.data.name,
                description: cmd.data.description
            });
        });

        res.render('commands', { 
            bot: client.user, 
            user: req.user || null, 
            grupos 
        });
    });

    // --- RUTA: SELECCIÓN LEADERBOARD ---
    app.get('/leaderboard', checkAuth, (req, res) => {
        const guilds = [];
        req.user.guilds.forEach(g => {
            const botIn = client.guilds.cache.get(g.id);
            if (botIn) {
                guilds.push({
                    id: g.id,
                    name: g.name,
                    icon: botIn.iconURL ? botIn.iconURL({ format: 'png', size: 128 }) : (g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null),
                    acronym: g.name.replace(/\w+/g, n => n[0]).substring(0, 2)
                });
            }
        });
        res.render('leaderboard', { bot: client.user, user: req.user, guilds });
    });

    // --- RUTA: LEADERBOARD ESPECÍFICO DE SERVIDOR ---
    app.get('/leaderboard/:guildId', checkAuth, async (req, res) => {
        const guild = client.guilds.cache.get(req.params.guildId);
        if (!guild) return res.redirect('/leaderboard');

        try {
            // Obtenemos el top 10 de usuarios más ricos
            const dbUsers = await User.find({ guildId: guild.id }).sort({ money: -1, bank: -1 }).limit(10);
            
            const topUsers = dbUsers.map(u => {
                const member = guild.members.cache.get(u.userId);
                return {
                    displayName: member ? member.displayName : "Usuario Desconocido",
                    avatarUrl: member ? member.user.displayAvatarURL({ format: 'png' }) : "https://cdn.discordapp.com/embed/avatars/0.png",
                    money: u.money,
                    bank: u.bank,
                    totalMoney: u.money + u.bank
                };
            });

            res.render('server_leaderboard', { bot: client.user, user: req.user, guild, topUsers });
        } catch (err) {
            res.redirect('/leaderboard');
        }
    });

    // --- RUTA: DASHBOARD GENERAL (ICONOS GRANDES) ---
    app.get('/dashboard', checkAuth, (req, res) => {
        const mutualGuilds = [], inviteGuilds = [];
        req.user.guilds.forEach(guild => {
            const botIn = client.guilds.cache.get(guild.id);
            const isAdmin = (guild.permissions & 0x8) === 0x8;
            const isOwner = OWNER_ID && String(req.user.id) === String(OWNER_ID);
            
            const data = { 
                id: guild.id, 
                name: guild.name, 
                icon: botIn && botIn.iconURL ? botIn.iconURL({ format: 'png', size: 128 }) : (guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null), 
                acronym: guild.name.replace(/\w+/g, n => n[0]).substring(0, 2) 
            };

            if (botIn) mutualGuilds.push(data); 
            else if (isAdmin || isOwner) inviteGuilds.push(data);
        });
        res.render('dashboard', { bot: client.user, user: req.user, mutualGuilds, inviteGuilds });
    });

    // --- RUTA: PANEL INTERNO DE SERVIDOR ---
    app.get('/dashboard/:guildId', checkAuth, async (req, res) => {
        const guild = client.guilds.cache.get(req.params.guildId);
        if (!guild) return res.redirect('/dashboard');

        const mutualGuilds = [];
        req.user.guilds.forEach(g => { 
            if (client.guilds.cache.has(g.id)) {
                mutualGuilds.push({ 
                    id: g.id, 
                    icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null, 
                    acronym: g.name.replace(/\w+/g, n => n[0]).substring(0, 2) 
                });
            }
        });

        try {
            // Aseguramos tener los miembros en caché para el buscador
            if (guild.members.cache.size < (guild.memberCount * 0.5)) await guild.members.fetch().catch(() => {});
            
            const dbUsers = await User.find({ guildId: guild.id });
            const allUsers = guild.members.cache.filter(m => !m.user.bot).map(m => {
                const dbData = dbUsers.find(u => u.userId === m.id);
                return { 
                    userId: m.id, 
                    displayName: m.displayName, 
                    avatarUrl: m.user.displayAvatarURL({ format: 'png' }),
                    money: dbData ? dbData.money : 0, 
                    bank: dbData ? dbData.bank : 0 
                };
            });

            let economia = { money: 0, bank: 0 };
            const myData = dbUsers.find(u => u.userId === req.user.id);
            if (myData) { economia.money = myData.money; economia.bank = myData.bank; }

            res.render('server_dashboard', { 
                bot: client.user, 
                user: req.user, 
                guild, 
                mutualGuilds, 
                allUsers, 
                economy: economia 
            });
        } catch (err) {
            res.redirect('/dashboard');
        }
    });

    // API: obtener configuración del servidor
    app.get('/api/guilds/:guildId/config', checkAuth, async (req, res) => {
        const guildId = req.params.guildId;
        // comprobar que el usuario pertenece al servidor
        const isMember = req.user.guilds.some(g => g.id === guildId);
        if (!isMember) return res.status(403).json({ error: 'not_member' });

        try {
            const cfg = await GuildConfig.findOne({ guildId }) || {};
            res.json({ ok: true, config: cfg });
        } catch (err) {
            res.status(500).json({ ok: false, error: 'db_error' });
        }
    });

    // API: actualizar configuración del servidor (sólo admins/owner)
    app.post('/api/guilds/:guildId/config', checkAuth, async (req, res) => {
        const guildId = req.params.guildId;
        if (!req.user) return res.status(401).json({ error: 'not_auth' });

        const targetGuild = req.user.guilds.find(g => g.id === guildId);
        if (!targetGuild) return res.status(403).json({ error: 'not_member' });

        const isOwner = String(req.user.id) === String(OWNER_ID);
        const isAdmin = (targetGuild.permissions & 0x8) === 0x8;
        if (!isAdmin && !isOwner) return res.status(403).json({ error: 'not_allowed' });

        const payload = {
            prefix: req.body.prefix || '.',
            welcomeChannel: req.body.welcomeChannel || null,
            leaveChannel: req.body.leaveChannel || null,
            modsRole: req.body.modsRole || null
        };

        try {
            const updated = await GuildConfig.findOneAndUpdate(
                { guildId },
                { $set: payload },
                { upsert: true, new: true }
            );
            res.json({ ok: true, config: updated });
        } catch (err) {
            res.status(500).json({ ok: false, error: 'db_error' });
        }
    });
    // Manejador 404 simple que renderiza la vista 404.ejs
    app.use((req, res) => res.status(404).render('404', { bot: client.user, user: req.user || null }));

    app.get('/health', (req, res) => {
        const info = {
            status: 'ok',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            bot: client && client.user ? { username: client.user.username, id: client.user.id } : null,
            ts: Date.now()
        };
        try { logger.info('Health check OK'); } catch(e) { console.log('Health check'); }
        res.json(info);
    });

    app.listen(puerto, () => {
        try { logger.info(`🌐 Dashboard listo: http://localhost:${puerto}`); } catch(e) { console.log(`🌐 Dashboard listo: http://localhost:${puerto}`); }
    });
};