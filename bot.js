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

const botLogs = new Discord.WebhookClient({
    id: process.env.WEBHOOK_ID,
    token: process.env.WEBHOOK_TOKEN,
});

// Use in funny moments
client.restartApp = function (reason) {
    console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), (chalk.green(`App`)), chalk.red(`Restarting process`), (chalk.white(`...`)));
    
    if (botLogs) {
        const embed = new Discord.EmbedBuilder()
        .setTitle(`System`)
        .addFields([
            {
                name: "Restart",
                value: reason ? `Reason: ${reason}` : "Reason is not provided",
            }
        ])

        botLogs.send({
            username: 'Bot Logs',
            embeds: [embed],
        }).catch(() => {
            console.log('Error sending start info to webhook');
        })
    }
    process.exit(1);
}

client.handling_commands_actions = [];
client.handling_commands = [];

require("./database/MySQL")(client);
require("./socket/Redis")(client);
require("./github/GitHub")(client);

initializeMess(client)

async function initializeMess (client) {
    await client.database;
    client.handling_game_servers = await client.databaseRequest({ database: client.database, query: "SELECT server_name, db_name FROM servers", params: [] });
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
}

client.commands = new Discord.Collection();

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
    global.errorHandler.error(error)
    if (!botLogs) return;
    if (error) {
        if (error.length > 950) error = error.slice(0, 950) + '... view console for details';
        if (error.stack) {
            console.error(error.stack);
            if (error.stack.length > 950) error.stack = error.stack.slice(0, 950) + '... view console for details';
        }
    }
    const embed = new Discord.EmbedBuilder()
        .setTitle(`Unhandled promise rejection`)
        .addFields([
            {
                name: "Error",
                value: error ? Discord.codeBlock(error) : "No error",
            },
            {
                name: "Stack error",
                value: error.stack ? Discord.codeBlock(error.stack) : "No stack error",
            },
        ])
    botLogs.send({
        username: 'Bot Logs',
        embeds: [embed],
    }).catch(() => {
        console.log('Error sending unhandled promise rejection to webhook');
        console.log(error);
    })
});

process.on('uncaughtException', error => {
    console.error("uncaughtException:", error);
    global.errorHandler.critical_error(error)
    if (!botLogs) return;
    if (error) {
        if (error.length > 950) error = error.slice(0, 950) + '... view console for details';
        if (error.stack) {
            console.warn(error.stack);
            if (error.stack.length > 950) error.stack = error.stack.slice(0, 950) + '... view console for details';
        }
    }
    const embed = new Discord.EmbedBuilder()
        .setTitle(`New critical error found`)
        .addFields([
            {
                name: `Critical Error`,
                value: error ? Discord.codeBlock(error) : "No error",
            },
            {
                name: `Stack error`,
                value: error.stack ? Discord.codeBlock(error.stack) : "No stack error",
            },
        ])
    botLogs.send({
        username: 'Bot Logs',
        embeds: [embed],
    }).catch(() => {
        console.log('Error sending critical error to webhook');
        console.log(error);
    })
});

process.on('warning', error => {
    console.warn("Warning:", error);
    global.errorHandler.warning(error)
    if (!botLogs) return;
    if (error) {
        if (error.length > 950) error = error.slice(0, 950) + '... view console for details';
        if (error.stack) {
            console.warn(error.stack);
            if (error.stack.length > 950) error.stack = error.stack.slice(0, 950) + '... view console for details';
        }
    }
    const embed = new Discord.EmbedBuilder()
        .setTitle(`New warning found`)
        .addFields([
            {
                name: `Warn`,
                value: error ? Discord.codeBlock(error) : "No warning",
            },
            {
                name: `Stack error`,
                value: error.stack ? Discord.codeBlock(error.stack) : "No stack error",
            },
        ])
    botLogs.send({
        username: 'Bot Logs',
        embeds: [embed],
    }).catch(() => {
        console.log('Error sending warning to webhook');
        console.log(error);
    })
});

client.on(Discord.ShardEvents.Error, error => {
    console.log(error);
    global.errorHandler.minor_error(error)
    if (!botLogs) return;
    if (error) {
        if (error.length > 950) error = error.slice(0, 950) + '... view console for details';
        if (error.stack) {
            console.log(error.stack);
            if (error.stack.length > 950) error.stack = error.stack.slice(0, 950) + '... view console for details';
        }
    }
    const embed = new Discord.EmbedBuilder()
        .setTitle(`A websocket connection encountered an error`)
        .addFields([
            {
                name: `Error`,
                value: error ? Discord.codeBlock(error) : "No error",
            },
            {
                name: `Stack error`,
                value: error.stack ? Discord.codeBlock(error.stack) : "No stack error",
            },
        ])
    botLogs.send({
        username: 'Bot Logs',
        embeds: [embed],
    }).catch(() => {
        console.log('Error sending warning to webhook');
        console.log(error);
    })
});
