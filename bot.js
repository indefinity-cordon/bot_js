const Discord = require('discord.js');
const fs = require('fs');
const chalk = require('chalk');
require('dotenv').config('.env');

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

const LogsHandlerclass = require('./LogsHandler.js');
global.LogsHandler = new LogsHandlerclass();
if (process.env.WEBHOOK_ID && process.env.WEBHOOK_TOKEN) {
    global.LogsHandler.botLogs = new Discord.WebhookClient({
        id: process.env.WEBHOOK_ID,
        token: process.env.WEBHOOK_TOKEN,
    });
}

// Use in funny moments
client.restartApp = function (reason) {
    console.log(chalk.blue(chalk.bold(`System`)), chalk.white(`>>`), chalk.green(`App`), chalk.white(`...`), chalk.red(`Restarting process`), chalk.white(`...`));
    const embed = new Discord.EmbedBuilder()
    .setTitle(`System`)
    .addFields([
        {
            name: "Restart",
            value: reason ? `Reason: ${reason}` : "Reason is not provided",
        }
    ])
    global.LogsHandler.send_log(embed);
    process.exit(1);
};

client.handling_commands_actions = [];
client.handling_commands = [];

require("./database/MySQL")(client);
if (process.env.REDIS_STRING) require("./socket/Redis")(client);
if (process.env.GITHUB_PAT) require("./github/GitHub")(client);

initializeMess(client);

async function initializeMess (client) {
    await client.database;
    client.handling_game_servers = await client.databaseRequest(client.database, "SELECT server_name, db_name FROM servers", []);
    client.servers_options = client.handling_game_servers.map(server => ({
        label: server.server_name,
        value: server.server_name
    }));
    client.servers_link = {};
    client.ServerActions = require(`${process.cwd()}/server_modules/servers_actions.js`);
    await client.login(process.env.DISCORD_TOKEN);
    fs.readdirSync('./handlers').forEach((dir) => {
        fs.readdirSync(`./handlers/${dir}`).forEach((handler) => {
            require(`./handlers/${dir}/${handler}`)(client);
        });
    });
    client.ServerActions(client);
};

client.commands = new Discord.Collection();

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
    global.LogsHandler.error(error, "Unhandled promise rejection", "error");
});

process.on('uncaughtException', error => {
    console.error("uncaughtException:", error);
    global.LogsHandler.error(error, "New critical error found", "critical error");
});

process.on('warning', error => {
    console.warn("Warning:", error);
    global.LogsHandler.error(error, "New warning found", "warning");
});

client.on(Discord.ShardEvents.Error, error => {
    console.log(error);
    global.LogsHandler.error(error, "A websocket connection encountered an error", "error");
});
