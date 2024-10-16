const { Client, GatewayIntentBits, Collection, WebhookClient, ShardEvents } = require('discord.js');
const fs = require('fs');
require('dotenv').config('.env');

const client = new Client({
	autoReconnect: true,
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildPresences
	],
	restTimeOffset: 0
});

client.commands = new Collection();
global.discord_client = client

//LOGS
const LogsHandlerClass = require('./~LogsHandler.js');
global._LogsHandler = new LogsHandlerClass();

if (process.env.WEBHOOK_ID && process.env.WEBHOOK_TOKEN) {
	global._LogsHandler.botLogs = new WebhookClient({
		id: process.env.WEBHOOK_ID,
		token: process.env.WEBHOOK_TOKEN,
	});
}

process.on('unhandledRejection', error => {
	console.error('Unhandled promise rejection:', error);
	global._LogsHandler.error(error, 'Unhandled promise rejection', 'error');
});

process.on('uncaughtException', error => {
	console.error('uncaughtException:', error);
	global._LogsHandler.error(error, 'New critical error found', 'critical error');
});

process.on('warning', error => {
	console.warn('Warning:', error);
	global._LogsHandler.error(error, 'New warning found', 'warning');
});

client.on(ShardEvents.Error, error => {
	console.log(error);
	global._LogsHandler.error(error, 'A websocket connection encountered an error', 'error');
});
//LOGS END


if (process.env.GITHUB_PAT) {
	require('./~GitHub.js')();
}


/*
 * >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> SAFE BOT PART <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
*/


global.restartApp = async function (reason) {
	console.log('System >> App ... Restarting process ...');
	await global._LogsHandler.sendSimplyLog('System', null, [{ name: 'Restart', value: reason ? `Reason: ${reason}` : 'Unspecified' }]);
	process.exit(1);
};

async function initializeBot() {
	require('./database/MySQL')(true);
	if (process.env.REDIS_STRING) require('./database/Redis')();

	await global.database;

	global.handling_commands_actions = {};
	global.handling_commands = [];

	fs.readdirSync('./handlers').forEach((dir) => {
		fs.readdirSync(`./handlers/${dir}`).forEach((handler) => {
			require(`./handlers/${dir}/${handler}`)(client);
		});
	});

	await client.login(process.env.DISCORD_TOKEN);

	global.guilds_link = {};
	global.servers_link = {};
	require('./server_modules/servers_actions.js')(client);
	//setInterval(async () => require('./server_modules/servers_actions.js')(client), 120 * 60000);
}

initializeBot();


//For sedalya puka
const links = [
	'https://tenor.com/view/blocked-message-gif-24291794',
	'https://tenor.com/view/blocked-message-gif-24291794',
	'https://tenor.com/view/blocked-message-gif-24291794',
	'https://tenor.com/view/blocked-message-gif-24291794',
	'https://tenor.com/view/blocked-message-gif-24291794',
	'https://tenor.com/view/talk-lizard-ironic-gif-25847938',
	'https://tenor.com/view/talk-lizard-ironic-gif-25847938',
	'https://tenor.com/view/stupidity-look-serius-gif-26117549',
	'https://tenor.com/view/sus-scout-lachen-tf2-gif-17981608274864336621',
	'https://tenor.com/view/mortal-kombat-skull-emoji-gif-25107751',
	'https://tenor.com/view/rat-rodent-vermintide-vermintide2-skaven-gif-20147931',
	'https://tenor.com/view/talk-lizard-ironic-gif-25847938',
	'https://tenor.com/view/talk-lizard-ironic-gif-25847938',
	'https://tenor.com/view/blocked-message-gif-24291794',
	'https://tenor.com/view/blocked-message-gif-24291794',
	'https://tenor.com/view/blocked-message-gif-24291794',
	'https://tenor.com/view/blocked-message-gif-24291794',
	'https://tenor.com/view/blocked-message-gif-24291794'
];

function getRandomLink() {
	const index = Math.floor(Math.random() * links.length);
	return links[index];
}

global.locked_response_fun = false

client.on('messageCreate', async (message) => {
	if (message.author.bot || message.channel.guild.id !== '614611020039585792') return;

	if (message.author.id == '155734640705929216' && !locked_response_fun) {
		global.locked_response_fun = true;
		setTimeout(() => {
			global.locked_response_fun = false;
		}, 5 * 60000);
		message.channel.send(getRandomLink());
	}
});
//End of funny
