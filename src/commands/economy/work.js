const { SlashCommandBuilder } = require("discord.js");
const safeReply = require("@src/utils/safeReply.js");
const ThemedEmbed = require("@src/utils/ThemedEmbed.js");
const eco = require("@economy");
const ms = require("ms");
const { getEconomyConfig } = require("@economyConfig");

const { work: workConfig } = getEconomyConfig();
const COOLDOWN = workConfig.cooldown;
const jobs = workConfig.jobs;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("work")
        .setDescription("Trabaja y gana dinero."),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        const balance = await eco.getBalance(userId, guildId);
        const now = Date.now();
        const cooldownEnd = Number(balance.workCooldown) || 0;

        if (cooldownEnd > now) {
            const remaining = Math.max(cooldownEnd - now, 1);
            const formatted = ms(remaining, { long: true });

            const embed = new ThemedEmbed(interaction)
                .setTitle("❌ ⏳ Estás cansado")
                .setColor("Red")
                .setDescription(`Podrás volver a trabajar **en ${formatted}**.`);

            return interaction.editReply({ embeds: [embed] });
        }

        const job = jobs[Math.floor(Math.random() * jobs.length)];
        const reward = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;

        await eco.addMoney(userId, guildId, reward, 'work');
        await eco.setWorkCooldown(userId, guildId, now + COOLDOWN);

        const embed = new ThemedEmbed(interaction)
            .setTitle("💼 ¡Has trabajado!")
            .setColor("Green")
            .setDescription(`${job.message} **${reward}$** 💰`);

        return interaction.editReply({ embeds: [embed] });
    },
};
