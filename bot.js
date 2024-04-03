const Discord = require('discord.js');
const fs = require('fs');

require("./database/MySQL")();
require("./socket/Redis")();

const client = new Discord.Client({
    autoReconnect: true,
    disabledEvents: [
        "TYPING_START"
    ],
    intents: [
        Discord.GatewayIntentBits.Guilds,
		Discord.GatewayIntentBits.GuildMessages,
		Discord.GatewayIntentBits.MessageContent,
		Discord.GatewayIntentBits.GuildMembers
    ],
    restTimeOffset: 0
});

global.bot_config = require('./config/bot');

client.commands = new Discord.Collection();

fs.readdirSync('./handlers').forEach((dir) => {
    fs.readdirSync(`./handlers/${dir}`).forEach((handler) => {
        require(`./handlers/${dir}/${handler}`)(client);
    });
});

client.login(process.env.DISCORD_TOKEN);

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('warning', warn => {
    console.warn("Warning:", warn);
});

client.on(Discord.ShardEvents.Error, error => {
    console.log(error);
});
