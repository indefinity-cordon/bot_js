const Discord = require('discord.js');
const ServerActions = require(`${process.cwd()}/server_modules/servers_actions.js`);

module.exports = async (client) => {
    client.on(Discord.Events.ClientReady, async () => {
        global.servers_link = []
        ServerActions(client);
    });

    client.serverStatus = async function ({
        game_server: game_server
    }) {
        clearInterval(game_server.status_interval);
        clearInterval(game_server.update_status_messages_interval);
        await updateStatusMessages(client, game_server)
        game_server.update_status_messages_interval = setInterval(
            updateStatusMessages,
            600000,
            client,
            game_server
        );
        game_server.status_interval = setInterval(
            updateStatus,
            30000,
            client,
            game_server
        );
    }
};

async function updateStatusMessages(client, game_server) {
    game_server.status_messages = [];
    const statuses = await new Promise((resolve, reject) => {
        global.database.query("SELECT channel_id, message_id FROM server_channels WHERE server_name = ? AND type = 'status'", [game_server.server_name], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
    if (!statuses.length) {
        console.log(`Failed to find server related feed channels. Aborting, for ${game_server.server_name}`);
        return;
    }
    for (const status of statuses) {
        const channel = await client.channels.fetch(status.channel_id);
        var found_message = null;
        if (status.message_id) {
            await channel.messages.fetch().then((messages) => {
                for (const message of messages) {
                    if (message[1].id === status.message_id) {
                        found_message = message[1];
                    }
                }
            });
        }
        if (found_message === null) {
            await client.embed({
                title: `${game_server.server_name} status`,
                desc: `prepairing...`
            }, channel).then((message) => {
                found_message = message;
                new Promise((resolve, reject) => {
                    global.database.query("UPDATE server_channels SET message_id = ? WHERE server_name = ? AND type = 'status' AND channel_id = ?", [message.id, game_server.server_name, status.channel_id], (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });
            });
        }
        game_server.status_messages.push(found_message);
    }
}

async function updateStatus(client, game_server) {
    try {
        const response = JSON.parse(await client.prepareByondAPIRequest({request: JSON.stringify({query: "status", auth: "anonymous", source: "bot"}), port: game_server.port, address: game_server.ip}));
        for (const message of game_server.status_messages) {
            await client.embed({
                title: `${game_server.server_name} status`,
                desc: `**Round ID:** ${response.data.round_id}\n**Players:** ${response.data.players}\n**Map:** ${response.data.map_name}\n**Round Time:** ${await time_convert(Math.floor(response.data.round_duration / 600))}`,
                color: `#669917`,
                type: 'edit'
            }, message)
        }
    } catch (error) {
        
        for (const message of game_server.status_messages) {
            await client.embed({
                title: `${game_server.server_name} status`,
                desc: `# SERVER OFFLINE`,
                color: `#a00f0f`,
                type: 'edit'
            }, message)
        }
    }
}

async function time_convert(num) { 
    var hours = Math.floor(num / 60);  
    var minutes = num % 60;
    return `${hours}:` + `${minutes}`.padStart(2, '0');         
}