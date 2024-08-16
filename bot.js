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
    exec('npm restart', (error, stdout, stderr) => {
        if (error) {
            console.error(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), (chalk.green(`App`)), chalk.red(`Error restarting process: ${error.message}`), (chalk.white(`...`)));
            return;
        }
        if (stderr) {
            console.error(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), (chalk.green(`App`)), chalk.red(`Stderr: ${stderr}`), (chalk.white(`...`)));
            return;
        }
        console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), (chalk.green(`App`)), chalk.red(`Process restarted:\n${stdout}`));
    });
}

global.handling_commands_actions = [];
global.handling_commands = [];

require("./database/MySQL")(client);
require("./socket/Redis")(client);

initializeMess(client)

async function initializeMess(client) {
    await new Promise(resolve => {
        let interval = setInterval( async () => {
            if (!global.database) return;
            clearInterval(interval);
            (async () => {
                global.handling_game_servers = await client.databaseRequest({ database: global.database, query: "SELECT server_name, db_name FROM servers", params: []})
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

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('warning', warn => {
    console.warn("Warning:", warn);
});

client.on(Discord.ShardEvents.Error, error => {
    console.log(error);
});
