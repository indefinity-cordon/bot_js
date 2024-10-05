const Discord = require('discord.js');

module.exports = async (client) => {
    console.log('\u001b[0m');

    const assigned_guildId = process.env.GUILD_ID;
    if (assigned_guildId) {
        const guild = await client.guilds.fetch(assigned_guildId).catch(err => {
            console.error(`Shard #${client.shard.ids[0] + 1} >> Failed to fetch Guild ID: ${assigned_guildId}`, err);
        });
        if (!guild) {
            console.error(`Shard #${client.shard.ids[0] + 1} >> Guild ID: ${assigned_guildId} not found.`);
        }
        console.log(`Shard #${client.shard.ids[0] + 1} >> Ready!`);
        console.log(`Shard #${client.shard.ids[0] + 1} >> Connected to Guild: ${guild.name}!`);
    } else {
        console.warn(`Shard #${client.shard.ids[0] + 1} >> No GUILD_ID assigned.`);
    }

    updateStatus(client)
    setInterval(() => { updateStatus(client) }, 3600000); 
}

async function updateStatus(client) {
    const current_date = new Date();
    client.user.setPresence({
        activities: [{
            name: 'Simulator of Life',
            type: Discord.ActivityType.Playing,
            state: `Building Better Worlds for ${Math.round(current_date.getTime() / 1000 / 60 / 60)} hour(s)`,
//            url: 'https://colonialmarines.ru/wiki/Заглавная_страница'
        }],
        status: 'online'
    });
}
