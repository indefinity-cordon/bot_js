const Discord = require('discord.js');
const fs = require('fs');
const chalk = require('chalk');
require('dotenv').config('.env');

process.on('warning', e => console.warn(e.stack));

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

// Use in funny moments
client.restartApp = function () {
    console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), (chalk.green(`App`)), chalk.red(`Restarting process`), (chalk.white(`...`)));
    process.exit(1);
}

client.handling_commands_actions = [];
client.handling_commands = [];

require("./database/MySQL")(client);
require("./socket/Redis")(client);

initializeMess(client)

async function initializeMess(client) {
    await new Promise(resolve => {
        let interval = setInterval( async () => {
            if (!client.database) return;
            clearInterval(interval);
            (async () => {
                client.handling_game_servers = await client.databaseRequest({ database: client.database, query: "SELECT server_name, db_name FROM servers", params: []})
                client.servers_options = client.handling_game_servers.map(server => ({
                    label: server.server_name,
                    value: server.server_name
                }));
            })();
            await client.login(process.env.DISCORD_TOKEN);
            fs.readdirSync('./handlers').forEach((dir) => {
                fs.readdirSync(`./handlers/${dir}`).forEach((handler) => {
                    require(`./handlers/${dir}/${handler}`)(client);
                });
            });
            resolve();
        }, 5000)
    })
}

client.commands = new Discord.Collection();


const botLogs = new Discord.WebhookClient({
    id: process.env.WEBHOOK_ID,
    token: process.env.WEBHOOK_TOKEN,
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
    if (!botLogs) return;
    if (error) {
        if (error.length > 950) error = error.slice(0, 950) + '... view console for details';
        if (error.stack) if (error.stack.length > 950) error.stack = error.stack.slice(0, 950) + '... view console for details';
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
        console.log('Error sending unhandled promise rejection to webhook')
        console.log(error)
    })
});

process.on('warning', error => {
    console.warn("Warning:", error);
    if (!botLogs) return;
    if (error) {
        if (error.length > 950) error = error.slice(0, 950) + '... view console for details';
        if (error.stack) if (error.stack.length > 950) error.stack = error.stack.slice(0, 950) + '... view console for details';
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
        console.log('Error sending warning to webhook')
        console.log(error)
    })
});

client.on(Discord.ShardEvents.Error, error => {
    console.log(error);
    if (!botLogs) return;
    if (error) {
        if (error.length > 950) error = error.slice(0, 950) + '... view console for details';
        if (error.stack) if (error.stack.length > 950) error.stack = error.stack.slice(0, 950) + '... view console for details';
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
        console.log('Error sending warning to webhook')
        console.log(error)
    })
});
