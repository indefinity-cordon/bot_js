const Discord = require('discord.js');
require('dotenv').config('.env');

const manager = new Discord.ShardingManager('./bot.js', {
    totalShards: 1,//'auto', for now auto is broken, because scaling for bot a little bit harder with different shards, cause - need redo a little bit of systems, so all info about game servers is moduled, so we can load based on what shard numbers is and how many servers per shard
    token: process.env.DISCORD_TOKEN,
    respawn: true
});

console.clear();
console.log('System >> Starting up ...');
console.log('\u001b[0m');
console.log('© Skill Issuers Incorporated 0000 -', new Date().getFullYear());//Joke here, don't mind, only for local use and no copyright license and etc, because I lazy and fuck da, everybody can use my trash as they want
console.log('All rights reserved');
console.log('\u001b[0m');
console.log('\u001b[0m');
console.log('System >> Loaded Version', require(`${process.cwd()}/package.json`).version);
console.log('\u001b[0m');

manager.on('shardCreate', shard => {
    console.log(`System >> Starting Shard #${shard.id + 1} ...`);
    console.log('\u001b[0m');

    shard.on("death", (process) => {
        console.log(`System >> Death Shard #${shard.id + 1} ...`);
        if (process.exitCode === null) {
            console.log(`System >> Exited With NULL Shard #${shard.id + 1} ...`);
        }
    });

    shard.on("shardDisconnect", (event) => {
        console.log(`System >> Disconnected Shard #${shard.id + 1} ...`);
    });

    shard.on("shardReconnecting", () => {
        console.log(`System >> Reconnecting Shard #${shard.id + 1} ...`);
    });
});

manager.spawn();

const LogsHandlerclass = require('./LogsHandler.js');
global.LogsHandler = new LogsHandlerclass();
if (process.env.WEBHOOK_ID && process.env.WEBHOOK_TOKEN) {
    global.LogsHandler.botLogs = new Discord.WebhookClient({
        id: process.env.WEBHOOK_ID,
        token: process.env.WEBHOOK_TOKEN,
    });
}

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
    global.LogsHandler.error(error, 'Unhandled promise rejection', 'error');
});

process.on('warning', error => {
    console.warn('Warning:', error);
    global.LogsHandler.error(error, 'New warning found', 'warning');
});