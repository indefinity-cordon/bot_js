const Discord = require('discord.js');
const fs = require('fs');
const chalk = require('chalk');
const simpleGit = require('simple-git');
const axios = require('axios');
require('dotenv').config('.env');

const git = simpleGit(process.cwd());

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

initializeMess(client)

async function initializeMess (client) {
    await client.database
    client.handling_game_servers = await client.databaseRequest({ database: client.database, query: "SELECT server_name, db_name FROM servers", params: [] });
    client.servers_options = client.handling_game_servers.map(server => ({
        label: server.server_name,
        value: server.server_name
    }));
    await client.login(process.env.DISCORD_TOKEN);
    const commit = await getLastCommit(client);
    if(botLogs) {
        const embed = new Discord.EmbedBuilder()
            .setTitle(`System`)
            .addFields([
                {
                    name: "Start",
                    value: `Commit SHA: ${commit}`,
                }
            ])
        botLogs.send({
            username: 'Bot Logs',
            embeds: [embed],
        }).catch(() => {
            console.log('Error sending start info to webhook');
        })
        console.log(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.blue(`[INFO]`), (chalk.white(`>>`)), chalk.red(`Current commit: ${commit}`));
    }
    setInterval(
        tryForUpdate,
        5 * 60 * 1000, // Каждые N минут (первое число)
        client
    );
    client.servers_link = [];
    client.ServerActions = require(`${process.cwd()}/server_modules/servers_actions.js`);
    client.ServerActions(client);
    fs.readdirSync('./handlers').forEach((dir) => {
        fs.readdirSync(`./handlers/${dir}`).forEach((handler) => {
            require(`./handlers/${dir}/${handler}`)(client);
        });
    });
    resolve();
}

async function getLastCommit(client) {
    try {
        await git.addConfig('credential.helper', 'store');
        const github_link = await client.databaseRequest({ database: client.database, query: "SELECT param FROM settings WHERE name = 'github_link'", params: [] });
        const github_branch = await client.databaseRequest({ database: client.database, query: "SELECT param FROM settings WHERE name = 'github_branch'", params: [] });
        const github_token = await client.databaseRequest({ database: client.database, query: "SELECT param FROM settings WHERE name = 'github_token'", params: [] });
        await git.remote(['set-url', 'origin', `https://${github_token[0].param}@github.com/${github_link[0].param}.git`]);
        const response = await axios.get(
            `https://api.github.com/repos/${github_link[0].param}/commits/${github_branch[0].param}`,
            {
                headers: {
                    Authorization: `token ${github_token[0].param}`,
                },
            }
        );
        return response.data.sha;
    } catch (error) {
        console.log(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.red(`[ERROR]`), (chalk.white(`>>`)), chalk.red(`Failed remote: ${error}`));
        throw error;
    }
}

async function getLastLocalCommit(client) {
    try {
        const github_branch = await client.databaseRequest({ database: client.database, query: "SELECT param FROM settings WHERE name = 'github_branch'", params: [] });
        const log = await git.log([github_branch[0].param]);
        return log.latest.hash;
    } catch (error) {
        console.log(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.red(`[ERROR]`), (chalk.white(`>>`)), chalk.red(`Failed local: ${error}`));
        throw error;
    }
}

async function pullChanges(client) {
    try {
        const github_branch = await client.databaseRequest({ database: client.database, query: "SELECT param FROM settings WHERE name = 'github_branch'", params: [] });
        await git.pull('origin', github_branch[0].param);
        console.log(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.green(`[DONE]`), (chalk.white(`>>`)), chalk.red(`Pulled latest changes`));
    } catch (error) {
        console.error(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.red(`[ERROR]`), (chalk.white(`>>`)), chalk.red(`Failed: ${error}`));
        throw error;
    }
}

async function tryForUpdate(client) {
    try {
        const remoteCommit = await getLastCommit(client);
        const localCommit = await getLastLocalCommit(client);

        if (remoteCommit !== localCommit) {
            console.log(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.green(`[PROGRESS]`), (chalk.white(`>>`)), chalk.red(`New commit found, pulling changes`));
            try {
                await pullChanges(client);
                client.restartApp();
            } catch (error) {
                throw error;
            }
        }
    } catch (error) {
        console.log(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.red(`[FAILED]`), (chalk.white(`>>`)), chalk.red(`Failed update: ${error}`));
    }
}

client.commands = new Discord.Collection();

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
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

process.on('warning', error => {
    console.warn("Warning:", error);
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
