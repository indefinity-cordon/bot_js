const { ShardingManager, WebhookClient } = require('discord.js');
require('dotenv').config('.env');

const manager = new ShardingManager('./bot.js', {
    token: process.env.DISCORD_TOKEN,
    respawn: true
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
    global._LogsHandler.botLogs = new WebhookClient({
        id: process.env.WEBHOOK_ID,
        token: process.env.WEBHOOK_TOKEN,
    });
}

if (process.env.GITHUB_PAT) {
    require('./~GitHub.js')(manager);
}

manager.restartApp = async function (reason) {
    console.log('System >> App ... Restarting process ...');
    await global._LogsHandler.sendSimplyLog('System', null, [{ name: 'Restart', value: reason ? `Reason: ${reason}` : 'Unspecified' }]);
    process.exit(1);
};

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


async function spawnCustomShards() {
    const guilds = await global.mysqlRequest(global.database, "SELECT * FROM guilds");
    const guild_mappings = guilds.map(guild => ({ guildId: guild.guild_id, shardId: guild.id }));
    const total_shards = guild_mappings.length;

    console.log(`System >> Total Shards to spawn: ${total_shards}`);

    manager.spawn(total_shards, 0, true).then(() => {
        guild_mappings.forEach((mapping) => {
            console.log(`System >> Assigning Shard #${mapping.shardId} to Guild ID: ${mapping.guildId}`);
            manager.broadcastEval(
                (client, { shardId, guildId }) => {
                    if (client.shard.ids[0] === shardId - 1) {
                        process.env.GUILD_ID = guildId;
                        console.log(`Shard #${shardId} assigned to Guild ID: ${guildId}`);
                        global.initializeBotContinue();
                    }
                },
                { context: { shardId: mapping.shardId, guildId: mapping.guildId } }
            ).catch(console.error);
        });
    }).catch(console.error);
}

async function runStartUp() {
    await require('./database/MySQL')(false);
    await spawnCustomShards();

    console.log('\u001b[0m');
    console.log('\u001b[0m');
    console.log('System >> Loaded Version', require(`${process.cwd()}/package.json`).version);
    console.log('\u001b[0m');
};

runStartUp().catch(error => {
    console.error('Failed to start shards:', error);
});
