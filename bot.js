const Discord = require('discord.js');
const fs = require('fs');
require('dotenv').config('.env');

const client = new Discord.Client({
    autoReconnect: true,
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMembers
    ],
    restTimeOffset: 0
});


//LOGS
const LogsHandlerClass = require('./~LogsHandler.js');
global._LogsHandler = new LogsHandlerClass();

if (process.env.WEBHOOK_ID && process.env.WEBHOOK_TOKEN) {
    global._LogsHandler.botLogs = new Discord.WebhookClient({
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

client.on(Discord.ShardEvents.Error, error => {
    console.log(error);
    global._LogsHandler.error(error, 'A websocket connection encountered an error', 'error');
});
//LOGS END


async function initializeBot() {
    require('./database/MySQL')(true);
    if (process.env.REDIS_STRING) require('./database/Redis')();

    await client.login(process.env.DISCORD_TOKEN);
    await global.database;

    await client.guilds.fetch();
    const guild = client.guilds.cache.first()
    if (!guild) return;
    const discord_guild = await global.gather_data(global.database, 'Guild', "SELECT * FROM ##TABLE## WHERE guild_id = ?", [guild.id]);
    if (!discord_guild[0]) return;

    client.handling_commands_actions = {};
    client.handling_commands = [];

    global.discord_server = discord_guild[0]
    fs.readdirSync('./handlers').forEach((dir) => {
        fs.readdirSync(`./handlers/${dir}`).forEach((handler) => {
            require(`./handlers/${dir}/${handler}`)(client);
        });
    });

    const handling_game_servers = await global.mysqlRequest(global.database, "SELECT server_name, db_name FROM servers");
    client.servers_options = handling_game_servers.map(server => ({
        label: server.server_name,
        value: server.server_name
    }));

    global.servers_link = {};
    require('./server_modules/servers_actions.js')(client);
    setInterval(async () => require('./server_modules/servers_actions.js')(client), 120 * 60000);
}

initializeBot();
