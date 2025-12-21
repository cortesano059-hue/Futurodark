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

    if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
    app.use(helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: false
    }));
    app.use(compression());

    app.use((req, res, next) => {
        const csp = [
            "default-src 'self' https:",
            "img-src 'self' data: blob: https://cdn.discordapp.com https://media.discordapp.net https://images.unsplash.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https:",
            "script-src 'self' https://cdnjs.cloudflare.com 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' https://cdnjs.cloudflare.com 'unsafe-inline'",
            "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com data:",
            "connect-src 'self' https://discord.com https://api.github.com wss:"
        ].join('; ');
        res.setHeader('Content-Security-Policy', csp);
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        next();
    });

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100
    });
    app.use(limiter);

    app.use(express.static(path.join(__dirname, 'public'), {
        setHeaders: (res, p) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
        }
    }));

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done) => done(null, obj));

    passport.use(new Strategy({
        clientID: process.env.CLIENT_ID,
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

    app.use((req, res, next) => {
        res.locals.currentPath = req.path || '/';
        next();
    });

    const checkAuth = (req, res, next) => {
        if (req.isAuthenticated()) return next();
        res.redirect('/login');
    };

    app.get('/login', passport.authenticate('discord'));
    app.get('/auth/discord/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => res.redirect('/dashboard'));
    app.get('/logout', (req, res, next) => { req.logout(err => { if (err) return next(err); res.redirect('/'); })});

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

    app.get('/comandos', (req, res) => {
        const grupos = {};
        client.commands.forEach(cmd => {
            const categoria = cmd.category || 'Otros'; 
            if (!grupos[categoria]) grupos[categoria] = [];
            grupos[categoria].push({ name: cmd.data.name, description: cmd.data.description });
        });
        res.render('commands', { bot: client.user, user: req.user || null, grupos });
    });

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

            const myData = dbUsers.find(u => u.userId === req.user.id) || { money: 0, bank: 0, inventory: [] };
            const economia = { money: myData.money, bank: myData.bank };
            const inventory = myData.inventory || []; // IMPORTANTE: Pasamos el inventario a la vista

            const channels = guild.channels.cache
                .filter(c => c.type === 'GUILD_TEXT' || c.type === 0)
                .map(c => ({ id: c.id, name: c.name }));

            const roles = guild.roles.cache
                .filter(r => r.id !== guild.id && !r.managed && r.name !== '@everyone')
                .map(r => ({ id: r.id, name: r.name }));

            res.render('server_dashboard', { 
                bot: client.user, 
                user: req.user, 
                guild, 
                mutualGuilds, 
                allUsers, 
                economy: economia,
                inventory: inventory, // Pasamos la variable definida
                channels,
                roles,
                items: [
                    { id: 'guild_potion', name: 'Poción del servidor', description: 'Poción útil en este servidor.', price: 75, icon: '/images/potion.png' },
                    { id: 'guild_banner', name: 'Estandarte', description: 'Decoración de perfil.', price: 250, icon: '/images/banner.png' }
                ]
            });
        } catch (err) {
            res.redirect('/dashboard');
        }
    });

    app.post('/api/guilds/:guildId/tienda/buy', checkAuth, async (req, res) => {
        const { guildId } = req.params;
        const { itemId } = req.body;
        const shopItems = {
            'guild_potion': { id: 'guild_potion', name: 'Poción del servidor', price: 75 },
            'guild_banner': { id: 'guild_banner', name: 'Estandarte', price: 250 }
        };
        const item = shopItems[itemId];
        if (!item) return res.status(404).json({ ok: false, error: 'not_found' });

        try {
            const dbUser = await User.findOne({ userId: req.user.id, guildId });
            if (!dbUser || dbUser.money < item.price) return res.status(400).json({ ok: false, error: 'insufficient_funds' });

            dbUser.money -= item.price;
            dbUser.inventory = dbUser.inventory || [];
            const existing = dbUser.inventory.find(i => i.id === item.id);
            if (existing) existing.count += 1;
            else dbUser.inventory.push({ id: item.id, name: item.name, count: 1, icon: null });

            await dbUser.save();
            res.json({ ok: true, newBalance: dbUser.money });
        } catch (err) {
            res.status(500).json({ ok: false, error: 'db_error' });
        }
    });

    app.get('/api/guilds/:guildId/config', checkAuth, async (req, res) => {
        try {
            const cfg = await GuildConfig.findOne({ guildId: req.params.guildId }) || {};
            res.json({ ok: true, config: cfg });
        } catch (err) { res.status(500).json({ ok: false }); }
    });

    app.post('/api/guilds/:guildId/config', checkAuth, async (req, res) => {
        try {
            const updated = await GuildConfig.findOneAndUpdate(
                { guildId: req.params.guildId },
                { $set: req.body },
                { upsert: true, new: true }
            );
            res.json({ ok: true, config: updated });
        } catch (err) { res.status(500).json({ ok: false }); }
    });

    app.use((req, res) => res.status(404).render('404', { bot: client.user, user: req.user || null }));

    app.listen(puerto, () => logger.info(`🌐 Dashboard listo: http://localhost:${puerto}`));
};