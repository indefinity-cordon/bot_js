const Discord = require('discord.js');
const simpleGit = require('simple-git');
require('dotenv').config('.env');

const manager = new Discord.ShardingManager('./bot.js', {
    token: process.env.DISCORD_TOKEN,
    totalShards: 1,
    respawn: true,
});



console.clear();
console.log('System >> Starting up ...');
console.log('\u001b[0m');
console.log('© Skill Issuers Incorporated 0000 -', new Date().getFullYear());//Joke here, don't mind, only for local use and no copyright license and etc, because I lazy and fuck da, everybody can use my trash as they want
console.log('All rights reserved');


//LOGS
const LogsHandlerClass = require('./~LogsHandler.js');
global._LogsHandler = new LogsHandlerClass();

if (process.env.WEBHOOK_ID && process.env.WEBHOOK_TOKEN) {
    global._LogsHandler.botLogs = new Discord.WebhookClient({
        id: process.env.WEBHOOK_ID,
        token: process.env.WEBHOOK_TOKEN,
    });
}

if (process.env.GITHUB_PAT) {
    manager.git = simpleGit(process.cwd());
    require('./~GitHub.js')(manager);
    manager.git_commit = await manager.getLastLocalCommit();
    console.log('GitHub >> Current commit:', manager.git_commit);
    global._LogsHandler.sendSimplyLog('System', null, [{ name: 'Start', value: `Commit SHA: ${manager.git_commit}` }]);
}

manager.on('shardCreate', shard => {
    console.log(`System >> Starting Shard #${shard.id + 1} ...`);

    shard.on('death', (process) => {
        console.log(`System >> Death Shard #${shard.id + 1} ...`);
        if (process.exitCode === null) {
            console.log(`System >> Exited With NULL Shard #${shard.id + 1} ...`);
        }
    });

    shard.on('shardDisconnect', (event) => {
        console.log(`System >> Disconnected Shard #${shard.id + 1} ...`);
    });

    shard.on('shardReconnecting', () => {
        console.log(`System >> Reconnecting Shard #${shard.id + 1} ...`);
    });
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
    global._LogsHandler.error(error, 'Unhandled promise rejection', 'error');
});

process.on('warning', error => {
    console.warn('Warning:', error);
    global._LogsHandler.error(error, 'New warning found', 'warning');
});
//LOGS END


async function getShardMappings() {
    const handling_guild_servers = await global.mysqlRequest(global.database, "SELECT id, guild_id FROM guilds");
    const guild_configs = handling_guild_servers.map(guild => ({ guild_Id: guild.guild_id, shard_Id: guild.id }));

    const shard_map = new Map();

    guild_configs.forEach(guild => {
        shard_map.set(guild.shard_Id, guild.guild_Id);
    });

    return shard_map;
}

async function spawnCustomShards() {
    const shard_map = await getShardMappings();

    console.log('System >> Starting Free Shard');
    manager.spawn();

    for (const [shard_Id, guild] of shard_map.entries()) {
        console.log(`System >> Starting Shard #${shard_Id + 1} for Guild: ${guild}`);
        manager.totalShards++
        const shard = manager.createShard(shard_Id);
        shard.guilds = [guild];
        await shard.spawn();
    }
}

runStartUp()

async function runStartUp() {
    await require('./database/MySQL')(false);
    spawnCustomShards().catch(console.error);
};



manager.restartApp = async function (reason) {
    console.log('System >> App ... Restarting process ...');
    await global._LogsHandler.sendSimplyLog('System', null, [{ name: 'Restart', value: reason ? `Reason: ${reason}` : 'Unspecified' }]);
    manager.broadcastEval('this.process.exit(1)');
};



console.log('\u001b[0m');
console.log('\u001b[0m');
console.log('System >> Loaded Version', require(`${process.cwd()}/package.json`).version);
console.log('\u001b[0m');
