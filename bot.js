const Discord = require('discord.js');
const fs = require('fs');
require('dotenv').config('.env');

// TODO: Do the auto reconections on drop and some tries to be online with fucked up state plus auto update and restart in future

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

require("./database/MySQL")(client);
require("./socket/Redis")(client);

initializeMess(client)

async function initializeMess(client) {
    await new Promise(resolve => {
        let interval = setInterval( async () => {
            if (!global.database) return;
            clearInterval(interval);
            (async () => {
                global.handling_game_servers = await new Promise((resolve, reject) => {
                    global.database.query("SELECT server_name, db_name FROM servers", [], (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });
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
