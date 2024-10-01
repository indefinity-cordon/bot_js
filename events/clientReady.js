const Discord = require('discord.js');

module.exports = async (client) => {
    console.log('\u001b[0m');
    console.log(`System >> Shard #${client.shard.ids[0] + 1} is ready!`);
    console.log(`Bot >> Started on ${client.guilds.cache.size} servers!`);
    updateStatus(client)
    client.INT_modules += setInterval(() => { updateStatus(client) }, 3600000); 
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
