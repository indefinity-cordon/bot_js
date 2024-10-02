const Discord = require('discord.js');
const fs = require('fs');
const simpleGit = require('simple-git');
require('dotenv').config('.env');


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

async function initializeBot(reboot) {
    require('./database/MySQL')(true);
    if (process.env.REDIS_STRING) require('./database/Redis')();

    client.handling_commands_actions = [];
    client.handling_commands = [];

    await client.login(process.env.DISCORD_TOKEN);
    await global.database;

    fs.readdirSync('./handlers').forEach((dir) => {
        fs.readdirSync(`./handlers/${dir}`).forEach((handler) => {
            if (reboot) delete require.cache[require.resolve(`./handlers/${dir}/${handler}`)];
            require(`./handlers/${dir}/${handler}`)(client);
        });
    });

    const handling_game_servers = await global.mysqlRequest(global.database, "SELECT server_name, db_name FROM servers", []);
    client.servers_options = handling_game_servers.map(server => ({
        label: server.server_name,
        value: server.server_name
    }));

    if (!reboot) {
        global.servers_link = {};
        require('./server_modules/servers_actions.js')(client);
        setInterval(async () => require('./server_modules/servers_actions.js')(client), 120 * 60000);

        global._LogsHandler.sendSimplyLog('System', null, [{ name: 'Start', value: `Commit SHA: ${client.git_commit}` }]);
    }
}

initializeBot();
