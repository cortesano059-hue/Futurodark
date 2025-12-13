module.exports = {
    token: process.env.DISCORD_TOKEN || '', // se puede definir en variable de entorno
    categories: require('@src/config/categories.js'),
    commandIds: require('@src/config/commandIds.js'),
    emojiList: require('@src/config/emojiList.js')
};
