// src/components/shop/shopPayload.js
const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const eco = require('@economy');
const safeReply = require('@src/utils/safeReply.js');

module.exports = async function shopPayload(interaction, shopItems, client) {
    try {
        if (!shopItems || shopItems.length === 0) return;

        // Construimos las opciones del select menu
        const options = shopItems.map(item => ({
            label: item.itemName,
            description: item.description || 'Sin descripción',
            value: item.itemName,
            emoji: item.type === 'food' ? '🍔' : '📦'
        }));

        const menu = new StringSelectMenuBuilder()
            .setCustomId('shop_select_item')
            .setPlaceholder('Selecciona un item para comprar')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(menu);

        await interaction.editReply({ // editReply en caso de que sea response de shopHandler
            content: '🛒 Selecciona un item para comprar:',
            components: [row]
        });

        // Guardamos un handler dinámico para este select menu
        client.selectMenus.set('shop_select_item', {
            customId: 'shop_select_item',
            async execute(selectInteraction) {
                const selectedName = selectInteraction.values[0];
                try {
                    const result = await eco.buyItemByName(selectInteraction.user.id, selectInteraction.guild.id, selectedName);

                    if (!result.success) {
                        return safeReply(selectInteraction, `❌ ${result.message}`);
                    }

                    await safeReply(selectInteraction, `✅ Compraste **${result.item.name}** por $${result.item.price}.`);
                } catch (err) {
                    console.error('🔴 Error comprando item:', err);
                    await safeReply(selectInteraction, '❌ Error al comprar el item.');
                }
            }
        });

    } catch (err) {
        console.error('🔴 Error en shopPayload:', err);
        await safeReply(interaction, '❌ Error al mostrar la tienda.');
    }
};
