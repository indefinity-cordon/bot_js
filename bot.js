const { Client, GatewayIntentBits, Collection, WebhookClient, ShardEvents } = require('discord.js');
const fs = require('fs');
require('dotenv').config('.env');

const client = new Client({
    autoReconnect: true,
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ],
    restTimeOffset: 0
});

client.commands = new Collection();
global.discord_client = client

//LOGS
const LogsHandlerClass = require('./~LogsHandler.js');
global._LogsHandler = new LogsHandlerClass();

if (process.env.WEBHOOK_ID && process.env.WEBHOOK_TOKEN) {
    global._LogsHandler.botLogs = new WebhookClient({
        id: process.env.WEBHOOK_ID,
        token: process.env.WEBHOOK_TOKEN,
    });
}

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
    global._LogsHandler.error(error, 'Unhandled promise rejection', 'error');
});

process.on('uncaughtException', error => {
    console.error('uncaughtException:', error);
    global._LogsHandler.error(error, 'New critical error found', 'critical error');
});

process.on('warning', error => {
    console.warn('Warning:', error);
    global._LogsHandler.error(error, 'New warning found', 'warning');
});

client.on(ShardEvents.Error, error => {
    console.log(error);
    global._LogsHandler.error(error, 'A websocket connection encountered an error', 'error');
});
//LOGS END


if (process.env.GITHUB_PAT) {
    require('./~GitHub.js')();
}


/*
 * >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> SAFE BOT PART <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
*/


global.restartApp = async function (reason) {
    console.log('System >> App ... Restarting process ...');
    await global._LogsHandler.sendSimplyLog('System', null, [{ name: 'Restart', value: reason ? `Reason: ${reason}` : 'Unspecified' }]);
    process.exit(1);
};

async function initializeBot() {
    require('./database/MySQL')(true);
    if (process.env.REDIS_STRING) require('./database/Redis')();

    await global.database;

    global.handling_commands_actions = {};
    global.handling_commands = [];

    fs.readdirSync('./handlers').forEach((dir) => {
        fs.readdirSync(`./handlers/${dir}`).forEach((handler) => {
            require(`./handlers/${dir}/${handler}`)(client);
        });
    });

    await client.login(process.env.DISCORD_TOKEN);

    global.guilds_link = {};
    global.servers_link = {};
    require('./server_modules/servers_actions.js')(client);
    //setInterval(async () => require('./server_modules/servers_actions.js')(client), 120 * 60000);
}

initializeBot();


//For sedalya puka
const links = [
    'https://tenor.com/view/blocked-message-gif-24291794',
    'https://tenor.com/view/blocked-message-gif-24291794',
    'https://tenor.com/view/blocked-message-gif-24291794',
    'https://tenor.com/view/blocked-message-gif-24291794',
    'https://tenor.com/view/blocked-message-gif-24291794',
    'https://tenor.com/view/talk-lizard-ironic-gif-25847938',
    'https://tenor.com/view/talk-lizard-ironic-gif-25847938',
    'https://tenor.com/view/stupidity-look-serius-gif-26117549',
    'https://tenor.com/view/sus-scout-lachen-tf2-gif-17981608274864336621',
    'https://tenor.com/view/mortal-kombat-skull-emoji-gif-25107751',
    'https://tenor.com/view/rat-rodent-vermintide-vermintide2-skaven-gif-20147931',
    'https://tenor.com/view/talk-lizard-ironic-gif-25847938',
    'https://tenor.com/view/talk-lizard-ironic-gif-25847938',
    'https://tenor.com/view/blocked-message-gif-24291794',
    'https://tenor.com/view/blocked-message-gif-24291794',
    'https://tenor.com/view/blocked-message-gif-24291794',
    'https://tenor.com/view/blocked-message-gif-24291794',
    'https://tenor.com/view/blocked-message-gif-24291794'
];

function getRandomLink() {
    const index = Math.floor(Math.random() * links.length);
    return links[index];
}

client.on('messageCreate', async (message) => {
    if (message.author.bot || message.channel.guild.id !== '614611020039585792') return;

    if (message.author.id == '155734640705929216') {
        message.channel.send(getRandomLink());
    }
});

async function sendGhostSlap(channel) {
    const message = await channel.send('<@155734640705929216>');
    setTimeout(() => message.delete(), 30 * 60000);
}

function getRandomTextChannel(guild) {
    const text_channels = guild.channels.cache.filter(channel => channel.isTextBased());
    if (!text_channels.size) return null;
    const index = Math.floor(Math.random() * text_channels.size);
    return [...text_channels.values()][index];
}

async function checkAndSendSlap() {
    const guild = client.guilds.cache.get('614611020039585792');
    if (!guild) return;

    const channel = getRandomTextChannel(guild);
    if (!channel) return;

    const member = await guild.members.fetch('155734640705929216');
    if (member.presence && member.presence.status !== 'offline') return;

    const randomTime = Math.floor(Math.random() * (10 * 600000 - 10 * 60000)) + 10 * 60000;
    setTimeout(() => {
        sendGhostSlap(channel);
    }, randomTime);
}

setInterval(checkAndSendSlap, 6000);//60 * 60000);
//End of funny
