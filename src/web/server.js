const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const { User, Item, Inventory } = require('../database/mongodb');
const logger = require('../utils/logger');

module.exports = (client) => {
    const puerto = process.env.PORT || 3000;

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, 'public')));

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done) => done(null, obj));

    passport.use(new Strategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL,
        scope: ['identify', 'guilds']
    }, (accessToken, refreshToken, profile, done) => done(null, profile)));

    app.use(session({
        secret: process.env.SESSION_SECRET || 'FuturoDark-Secret',
        resave: false,
        saveUninitialized: false
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');

    const checkAuth = (req, res, next) => req.isAuthenticated() ? next() : res.redirect('/login');

    // DASHBOARD DEL SERVIDOR (Vista unificada)
    app.get('/dashboard/:guildId', checkAuth, async (req, res) => {
        const guild = client.guilds.cache.get(req.params.guildId);
        if (!guild) return res.redirect('/dashboard');

        try {
            // Cargar ítems de la tienda del servidor
            const items = await Item.find({ guildId: guild.id }).sort({ price: 1 });
            
            // Cargar datos económicos del usuario
            const dbUser = await User.findOne({ userId: req.user.id, guildId: guild.id }) || { money: 0, bank: 5000 };
            
            // Cargar inventario real con población de datos del ítem
            const invData = await Inventory.find({ userId: req.user.id, guildId: guild.id }).populate('itemId');
            const inventory = invData.map(i => ({ 
                name: i.itemId?.itemName || "Objeto Desconocido", 
                amount: i.amount, 
                emoji: i.itemId?.emoji || "📦" 
            }));

            // Sidebar de servidores mutuos
            const mutualGuilds = req.user.guilds.filter(g => client.guilds.cache.has(g.id)).map(g => ({
                id: g.id, 
                acronym: g.name.replace(/\w+/g, n => n[0]).substring(0, 2), 
                icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null
            }));

            // Verificar si es Administrador (Permission bit 0x8)
            const userInGuild = req.user.guilds.find(g => g.id === guild.id);
            const isAdmin = userInGuild && (userInGuild.permissions & 0x8) === 0x8;

            res.render('server_dashboard', {
                bot: client.user, 
                user: req.user, 
                guild, 
                mutualGuilds,
                economy: { money: dbUser.money, bank: dbUser.bank },
                inventory, 
                items, 
                isAdmin,
                currentPath: req.path,
                channels: guild.channels.cache.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name })),
                roles: guild.roles.cache.filter(r => r.id !== guild.id).map(r => ({ id: r.id, name: r.name }))
            });
        } catch (err) {
            console.error("Error cargando dashboard:", err);
            res.redirect('/dashboard');
        }
    });

    // API: Gestión de ítems (Solo Admins)
    app.post('/api/guilds/:guildId/items/manage', checkAuth, async (req, res) => {
        const { action, id, itemName, price, description, emoji, usable, sellable, type } = req.body;
        const userInGuild = req.user.guilds.find(g => g.id === req.params.guildId);
        if (!(userInGuild.permissions & 0x8)) return res.status(403).json({ ok: false, error: 'No autorizado' });

        try {
            if (action === 'delete') {
                await Item.findByIdAndDelete(id);
            } else if (action === 'edit') {
                await Item.findByIdAndUpdate(id, { 
                    itemName, price, description, emoji, 
                    usable: usable === 'true' || usable === true, 
                    sellable: sellable === 'true' || sellable === true, 
                    type 
                });
            } else {
                await Item.create({ 
                    guildId: req.params.guildId, 
                    itemName, price, description, emoji, 
                    usable: usable === 'true' || usable === true, 
                    sellable: sellable === 'true' || sellable === true, 
                    type,
                    inventory: true 
                });
            }
            res.json({ ok: true });
        } catch (err) { 
            console.error(err);
            res.status(500).json({ ok: false, error: 'Error en la base de datos' }); 
        }
    });

    // API: Compra de ítems
    app.post('/api/guilds/:guildId/tienda/buy', checkAuth, async (req, res) => {
        const { itemId } = req.body;
        try {
            const item = await Item.findById(itemId);
            const user = await User.findOne({ userId: req.user.id, guildId: req.params.guildId });

            if (!item || user.money < item.price) {
                return res.status(400).json({ ok: false, error: 'Fondos insuficientes' });
            }

            // Descontar dinero
            user.money -= item.price;
            await user.save();

            // Añadir al inventario (Usa tu modelo Inventory)
            let slot = await Inventory.findOne({ userId: req.user.id, guildId: req.params.guildId, itemId: item._id });
            if (!slot) {
                await Inventory.create({ userId: req.user.id, guildId: req.params.guildId, itemId: item._id, amount: 1 });
            } else {
                slot.amount += 1;
                await slot.save();
            }

            res.json({ ok: true, newBalance: user.money });
        } catch (err) { res.status(500).json({ ok: false }); }
    });

    app.get('/login', passport.authenticate('discord'));
    app.get('/auth/discord/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => res.redirect('/dashboard'));
    app.get('/logout', (req, res) => { req.logout(() => res.redirect('/')); });

    app.listen(puerto, () => console.log(`🌐 Dashboard: http://localhost:${puerto}`));
};