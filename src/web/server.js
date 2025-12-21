const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const { User } = require('../database/mongodb'); 

module.exports = (client) => {
    const puerto = process.env.PORT || 3000;
    const OWNER_ID = process.env.OWNER_ID;

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

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
        secret: 'DarkRP-Super-Secret-Key',
        resave: false,
        saveUninitialized: false
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');

    const checkAuth = (req, res, next) => {
        if (req.isAuthenticated()) return next();
        res.redirect('/login');
    };

    // --- RUTAS DE SESIÓN ---
    app.get('/login', passport.authenticate('discord'));
    app.get('/auth/discord/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => res.redirect('/dashboard'));
    app.get('/logout', (req, res, next) => { req.logout(err => { if (err) return next(err); res.redirect('/'); })});

    // --- PÁGINA DE INICIO ---
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

    // --- COMANDOS DINÁMICOS (Sincronizado con tus carpetas) ---
    app.get('/comandos', (req, res) => {
        const grupos = {};
        // Extraemos los comandos reales cargados en el bot
        client.commands.forEach(cmd => {
            const categoria = cmd.category || 'Otros'; 
            if (!grupos[categoria]) grupos[categoria] = [];
            grupos[categoria].push({
                name: cmd.data.name,
                description: cmd.data.description
            });
        });
        res.render('commands', { bot: client.user, user: req.user || null, grupos });
    });

    // --- SELECTOR DE LEADERBOARD ---
    app.get('/leaderboard', checkAuth, (req, res) => {
        const guilds = [];
        req.user.guilds.forEach(g => {
            if (client.guilds.cache.has(g.id)) {
                const guild = client.guilds.cache.get(g.id);
                guilds.push({
                    id: g.id,
                    name: g.name,
                    icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
                    acronym: g.name.replace(/\w+/g, n => n[0]).substring(0, 2)
                });
            }
        });
        res.render('leaderboard', { bot: client.user, user: req.user, guilds });
    });

    // --- RANKING ESPECÍFICO DEL SERVIDOR ---
    app.get('/leaderboard/:guildId', checkAuth, async (req, res) => {
        const guildId = req.params.guildId;
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return res.redirect('/leaderboard');

        try {
            // Buscamos los top 10 usuarios de este servidor en MongoDB
            const dbUsers = await User.find({ guildId }).sort({ money: -1, bank: -1 }).limit(10);
            
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

    // --- SELECTOR DE DASHBOARD (Mutual & Invite) ---
    app.get('/dashboard', checkAuth, (req, res) => {
        const mutualGuilds = [], inviteGuilds = [];
        req.user.guilds.forEach(guild => {
            const botIn = client.guilds.cache.get(guild.id);
            const isAdmin = (guild.permissions & 0x8) === 0x8;
            const isOwner = OWNER_ID && String(req.user.id) === String(OWNER_ID);
            
            const data = { 
                id: guild.id, 
                name: guild.name, 
                icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null, 
                acronym: guild.name.replace(/\w+/g, n => n[0]).substring(0, 2) 
            };

            if (botIn) mutualGuilds.push(data); 
            else if (isAdmin || isOwner) inviteGuilds.push(data);
        });
        res.render('dashboard', { bot: client.user, user: req.user, mutualGuilds, inviteGuilds });
    });

    // --- DASHBOARD INTERNO DEL SERVIDOR (Buscador) ---
    app.get('/dashboard/:guildId', checkAuth, async (req, res) => {
        const guild = client.guilds.cache.get(req.params.guildId);
        if (!guild) return res.redirect('/dashboard');

        // Para la barra lateral de servidores
        const mutualGuilds = [];
        req.user.guilds.forEach(g => { 
            if (client.guilds.cache.has(g.