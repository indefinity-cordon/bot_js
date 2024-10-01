const Discord = require('discord.js');
const fs = require('fs');
const simpleGit = require('simple-git');
require('dotenv').config('.env');

const LogsHandlerclass = require('./LogsHandler.js');
global.LogsHandler = new LogsHandlerclass();
if (process.env.WEBHOOK_ID && process.env.WEBHOOK_TOKEN) {
    global.LogsHandler.botLogs = new Discord.WebhookClient({
        id: process.env.WEBHOOK_ID,
        token: process.env.WEBHOOK_TOKEN,
    });
}

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


// INITIALIZE

initializeBot();

async function initializeBot(reboot) {
    if (process.env.GITHUB_PAT) {
        if (!client.git) client.git = simpleGit(process.cwd());
        require('./github/GitHub')(client);
        client.git_commit = await client.getLastLocalCommit(client);
        console.log('GitHub >> Current commit:', client.git_commit);
    }
    require('./database/MySQL')(client);
    if (process.env.REDIS_STRING) require('./database/Redis')(client);
    client.INT_modules = [];
    client.handling_commands_actions = [];
    client.handling_commands = [];
    await client.login(process.env.DISCORD_TOKEN);
    await client.database;
    fs.readdirSync('./handlers').forEach((dir) => {
        fs.readdirSync(`./handlers/${dir}`).forEach((handler) => {
            if (reboot) delete require.cache[require.resolve(`./handlers/${dir}/${handler}`)];
            require(`./handlers/${dir}/${handler}`)(client);
        });
    });
    const handling_game_servers = await client.mysqlRequest(client.database, "SELECT server_name, db_name FROM servers", []);
    client.servers_options = handling_game_servers.map(server => ({
        label: server.server_name,
        value: server.server_name
    }));
    if (!reboot) {
        client.servers_link = {};
        require('./server_modules/servers_actions.js')(client);
        client.INT_modules += setInterval(async () => {
            require('./server_modules/servers_actions.js')(client);
        }, 120 * 60000);
        global.LogsHandler.sendSimplyLog('System', null, [{ name: 'Start', value: `Commit SHA: ${client.git_commit}` }]);
    }
};

// HOTSWAP

client.hotSwap = async function () {
    console.log('System >> App ... Hot swap triggered ...');
    await global.LogsHandler.sendSimplyLog('System', null, [{ name: 'Hot swap', value: `Ongoing hot swap` }]);

    const old_INT_modules = client.INT_modules

    delete require.cache[require.resolve('./database/MySQL')];
    delete require.cache[require.resolve('./database/Redis')];
    delete require.cache[require.resolve('./github/GitHub')];
    delete require.cache[require.resolve('./server_modules/servers_actions.js')];

    initializeBot(true)

    for (const server_name in client.servers_link) {
        const game_server = client.servers_link[server_name];
        game_server.drop_link()
    }

    require('./server_modules/servers_actions.js')(client);
    client.INT_modules += setInterval(async () => {
        require('./server_modules/servers_actions.js')(client);
    }, 120 * 60000);

    for (const interval in old_INT_modules) {
        clearInterval(interval);
    }
};

// END


client.commands = new Discord.Collection();

client.restartApp = async function (reason) {
    console.log('System >> App ... Restarting process ...');
    await global.LogsHandler.sendSimplyLog('System', null, [{ name: 'Restart', value: reason ? `Reason: ${reason}` : 'Unspecified' }]);
    process.exit(1);
};

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
    global.LogsHandler.error(error, 'Unhandled promise rejection', 'error');
});

process.on('uncaughtException', error => {
    console.error('uncaughtException:', error);
    global.LogsHandler.error(error, 'New critical error found', 'critical error');
});

process.on('warning', error => {
    console.warn('Warning:', error);
    global.LogsHandler.error(error, 'New warning found', 'warning');
});

client.on(Discord.ShardEvents.Error, error => {
    console.log(error);
    global.LogsHandler.error(error, 'A websocket connection encountered an error', 'error');
});
