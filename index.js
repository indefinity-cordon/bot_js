const Discord = require('discord.js');
const simpleGit = require('simple-git');
require('dotenv').config('.env');

const manager = new Discord.ShardingManager('./bot.js', {
    token: process.env.DISCORD_TOKEN,
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


async function fetchAllGuilds() {
    const _TEMPclient = new Discord.Client({ intents: [Discord.GatewayIntentBits.Guilds] });
    await _TEMPclient.login(process.env.DISCORD_TOKEN);
    await _TEMPclient.guilds.fetch();
    const guilds = _TEMPclient.guilds.cache.map(guild => guild.id);
    await _TEMPclient.destroy();
    return guilds;
}

async function fetchGuildShardConfigs() {
    const handling_guild_servers = await global.mysqlRequest(global.database, "SELECT id, guild_id FROM guilds", []);
    const guilded = [];
    for (const guild of handling_guild_servers) {
        guilded.push({ guild_Id: guild.guild_id, shard_Id: guild.id - 1 });
    }
    return guilded;
}

async function getShardMappings() {
    const all_guilds = await fetchAllGuilds();
    const guild_configs = await fetchGuildShardConfigs();

    const shard_map = new Map();
    const free_guilds = [];

    all_guilds.forEach(guild_Id => {
        const config = guild_configs.find(match => match.guild_Id === guild_Id);
        if (config) {
            shard_map.set(config.shard_Id, guild_Id);
        } else {
            free_guilds.push(guild_Id);
        }
    });

    return { shard_map, free_guilds };
}

async function spawnCustomShards() {
    const { shard_map, free_guilds } = await getShardMappings();

    for (const [shard_Id, guild] of shard_map.entries()) {
        console.log(`System >> Starting Shard #${shard_Id} for Guild: ${guild}`);
        const shard = manager.createShard(shard_Id);
        shard.guilds = [guild];
        await shard.spawn();
    }

    if (free_guilds.length > 0) {
        console.log(`System >> Starting Free Shard for Guilds: ${free_guilds.join(', ')}`);
        manager.spawn('auto');
    }
}

runGitStartUp()

async function runGitStartUp() {
    require('./database/MySQL')(false);
    if (process.env.GITHUB_PAT) {
        manager.git = simpleGit(process.cwd());
        require('./~GitHub.js')(manager);
        manager.git_commit = await manager.getLastLocalCommit();
        console.log('GitHub >> Current commit:', manager.git_commit);
        global._LogsHandler.sendSimplyLog('System', null, [{ name: 'Start', value: `Commit SHA: ${manager.git_commit}` }]);
    }
    await global.database
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
