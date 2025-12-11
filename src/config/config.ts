import categories from '@src/config/categories';
import commandIds from '@src/config/commandIds';
import emojiList from '@src/config/EmojiList';

export default {
    token: process.env.DISCORD_TOKEN || '',
    categories,
    commandIds,
    emojiList
};

