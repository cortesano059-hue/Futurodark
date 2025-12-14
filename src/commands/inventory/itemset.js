// src/commands/inventory/itemset.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

const safeReply = require("@safeReply");
const eco = require("@economy");

const REQ_TYPE_MAP = {
    role: "Rol Requerido", money: "Dinero (Cartera)", bank: "Dinero (Banco)", item: "Item Requerido",
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("itemset")
        .setDescription("Configura un ítem usando subcomandos directos.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        
        // ----------------------------------------------------
        // 1. BASE DE PROPIEDADES (Texto, Toggles)
        // ----------------------------------------------------
        .addSubcommand(subcommand =>
            subcommand
                .setName('prop')
                .setDescription('Establece el precio, emoji, o descripción.')
                .addStringOption(option => option.setName('item').setDescription('Nombre del ítem.').setRequired(true))
                .addStringOption(option => option.setName('propiedad').setDescription('Propiedad a establecer.').setRequired(true).setChoices(
                    { name: 'precio', value: 'price' },
                    { name: 'emoji', value: 'emoji' },
                    { name: 'descripcion', value: 'description' },
                    { name: 'inventariable', value: 'inventory' },
                    { name: 'usable', value: 'usable' },
                    { name: 'vendible', value: 'sellable' }
                ))
                .addStringOption(option => option.setName('valor').setDescription('Nuevo valor para la propiedad. (Sí/No, número, texto)').setRequired(true))
        )

        // ----------------------------------------------------
        // 2. REQUISITOS (Añadir/Eliminar)
        // ----------------------------------------------------
        .addSubcommandGroup(group =>
            group.setName('req').setDescription('Gestiona los requisitos de uso o compra.')
                // 2.1 ADD ROL
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('add_rol')
                        .setDescription('Añade un requisito de rol. Acepta mención o nombre.')
                        .addStringOption(option => option.setName('item').setDescription('Nombre del ítem.').setRequired(true))
                        .addStringOption(option => option.setName('rol').setDescription('Mención (@rol) o nombre del rol.').setRequired(true))
                )
                // 2.2 ADD DINERO (Cartera)
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('add_money')
                        .setDescription('Añade requisito de dinero en cartera.')
                        .addStringOption(option => option.setName('item').setDescription('Nombre del ítem.').setRequired(true))
                        .addIntegerOption(option => option.setName('cantidad').setDescription('Cantidad mínima de dinero.').setRequired(true))
                )
                // 2.3 ELIMINAR
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('remove')
                        .setDescription('Elimina un requisito por tipo (Rol, Dinero, Item).')
                        .addStringOption(option => option.setName('item').setDescription('Nombre del ítem.').setRequired(true))
                        .addStringOption(option => option.setName('tipo').setDescription('Tipo de requisito a eliminar (Rol, Dinero, Item...).').setRequired(true).setChoices(
                            { name: 'Rol', value: 'role' },
                            { name: 'Dinero (Cartera/Banco)', value: 'money_bank' },
                            { name: 'Item', value: 'item' }
                        ))
                        .addStringOption(option => option.setName('valor').setDescription('Valor específico a eliminar (ej: @Rol o 1000$).').setRequired(true))
                )
        )
        
        // ----------------------------------------------------
        // 3. VISTA GENERAL (FIXED: Integrado a la cadena de comandos)
        // ----------------------------------------------------
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('Muestra el estado actual y configuraciones del ítem.')
                .addStringOption(option => option.setName('item').setDescription('Nombre del ítem.').setRequired(true))
        ),


    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const subCommand = interaction.options.getSubcommand();
        const subCommandGroup = interaction.options.getSubcommandGroup();
        const guildId = interaction.guild.id;
        const itemName = interaction.options.getString('item').trim();

        let existing = await eco.getItemByName(guildId, itemName);

        // Si no existe, lo creamos para configurarlo
        if (!existing) {
            existing = await eco.createItem(guildId, itemName, 0, "Item creado por itemset.", "📦", {});
            if (!existing) return safeReply(interaction, `❌ Error al crear el ítem ${itemName}.`, true);
        }

        // ==================================================
        // LÓGICA DE SUBCOMANDOS
        // ==================================================

        // --------------------------------------------------
        // A) /itemset view
        // --------------------------------------------------
        if (subCommand === 'view') {
            const embed = new EmbedBuilder()
                .setTitle(`📦 Ítem: ${existing.itemName}`)
                .setColor("#48bb78")
                .addFields(
                    { name: "💰 Precio", value: `${existing.price.toLocaleString()}`, inline: true }, 
                    { name: `📋 Requisitos (${existing.requirements.length})`, value: existing.requirements.length ? "```json\n" + JSON.stringify(existing.requirements, null, 2).slice(0, 1000) + "\n```" : "Ninguno", inline: false }
                );
            return safeReply(interaction, { embeds: [embed] }, true);
        }

        // --------------------------------------------------
        // B) /itemset prop
        // --------------------------------------------------
        if (subCommand === 'prop') {
            const prop = interaction.options.getString('propiedad');
            let value = interaction.options.getString('valor');

            // Manejar booleanos
            if (['inventory', 'usable', 'sellable'].includes(prop)) {
                value = value.toLowerCase();
                if (value === 'sí' || value === 'si' || value === 'true') existing[prop] = true;
                else if (value === 'no' || value === 'false') existing[prop] = false;
                else return safeReply(interaction, `❌ Valor inválido para ${prop}. Usa 'sí' o 'no'.`, true);
            } 
            // Manejar numéricos/texto
            else if (prop === 'price') {
                const price = parseInt(value);
                if (isNaN(price) || price < 0) return safeReply(interaction, '❌ El precio debe ser un número entero no negativo.', true);
                existing.price = price;
            } else {
                existing[prop] = value;
            }

            await existing.save();
            return safeReply(interaction, `✅ Propiedad **${prop}** actualizada para ${itemName}.`, true);
        }

        // --------------------------------------------------
        // C) /itemset req add_rol
        // --------------------------------------------------
        if (subCommandGroup === 'req' && subCommand === 'add_rol') {
            const roleNameOrMention = interaction.options.getString('rol').trim();
            
            let role = interaction.guild.roles.cache.find(r => 
                r.name.toLowerCase() === roleNameOrMention.toLowerCase() || 
                roleNameOrMention.includes(r.id)
            );
            
            if (!role) {
                return safeReply(interaction, `❌ Rol no encontrado: "${roleNameOrMention}".`, true);
            }

            // Añadir el requisito
            existing.requirements.push({ type: 'role', roleId: role.id });
            await existing.save();
            return safeReply(interaction, `✅ Requisito: **${role.name}** añadido a ${itemName}.`, true);
        }
        
        // --------------------------------------------------
        // D) /itemset req add_money
        // --------------------------------------------------
        if (subCommandGroup === 'req' && subCommand === 'add_money') {
            const amount = interaction.options.getInteger('cantidad');
            
            if (amount <= 0) return safeReply(interaction, '❌ La cantidad debe ser positiva.', true);
            
            // Añadir el requisito
            existing.requirements.push({ type: 'money', amount: amount });
            await existing.save();
            return safeReply(interaction, `✅ Requisito: **$${amount.toLocaleString()}** (cartera) añadido a ${itemName}.`, true);
        }
        
        // --------------------------------------------------
        // E) /itemset req remove
        // --------------------------------------------------
        if (subCommandGroup === 'req' && subCommand === 'remove') {
            const typeToRemove = interaction.options.getString('tipo');
            const valueToRemove = interaction.options.getString('valor');
            
            let filterFunc;
            let successMessage;

            if (typeToRemove === 'role') {
                let roleId;
                // Intentamos resolver el rol
                let role = interaction.guild.roles.cache.find(r => 
                    r.name.toLowerCase() === valueToRemove.toLowerCase() || 
                    valueToRemove.includes(r.id)
                );
                
                if (role) roleId = role.id;
                else roleId = valueToRemove; // Si no es mención, asumimos que el usuario puso el ID

                filterFunc = (req) => req.type === 'role' && req.roleId === roleId;
                successMessage = `Rol/ID: **${valueToRemove}**`;

            } else if (typeToRemove === 'money_bank') {
                const amount = parseInt(valueToRemove.replace(/\D/g, '')); // Limpiamos $ y ,
                if (isNaN(amount)) return safeReply(interaction, '❌ El valor de dinero debe ser un número.', true);
                
                // Filtra ambas, cartera y banco
                filterFunc = (req) => (req.type === 'money' || req.type === 'bank') && req.amount === amount;
                successMessage = `Cantidad: **$${amount.toLocaleString()}**`;

            } else if (typeToRemove === 'item') {
                filterFunc = (req) => req.type === 'item' && req.item.toLowerCase() === valueToRemove.toLowerCase();
                successMessage = `Ítem: **${valueToRemove}**`;
            }
            
            // Filtramos los requisitos que NO cumplen la función (los que quedan)
            const initialCount = existing.requirements.length;
            existing.requirements = existing.requirements.filter(req => !filterFunc(req));
            
            const removedCount = initialCount - existing.requirements.length;

            if (removedCount > 0) {
                await existing.save();
                return safeReply(interaction, `✅ Eliminado ${removedCount} requisito(s) de ${typeToRemove} (${successMessage}) para ${itemName}.`, true);
            } else {
                return safeReply(interaction, `❌ No se encontraron requisitos coincidentes para eliminar.`, true);
            }
        }

        return safeReply(interaction, 'Comando no reconocido.', true);
    }
};