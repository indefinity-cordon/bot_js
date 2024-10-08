const { ShardingManager, WebhookClient } = require('discord.js');
require('dotenv').config('.env');

const manager = new ShardingManager('./bot.js', {
	token: process.env.DISCORD_TOKEN,
	respawn: true,
	totalShards: 1
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

async function runStartUp() {
	manager.spawn();

	console.log('\u001b[0m');
	console.log('\u001b[0m');
	console.log('System >> Loaded Version', require(`${process.cwd()}/package.json`).version);
	console.log('\u001b[0m');
};

runStartUp().catch(error => {
	console.error('Failed to start shards:', error);
});
