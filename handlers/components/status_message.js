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
            game_server.updateStatus,
            30000,
            client,
            game_server
        );
    }
};

async function updateStatusMessages(client, game_server) {
    game_server.status_messages = [];
    const statuses = await client.databaseRequest({ database: global.database, query: "SELECT channel_id, message_id FROM server_channels WHERE server_name = ? AND type = 'status'", params: [game_server.server_name] })
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
                client.databaseRequest({ database: global.database, query: "UPDATE server_channels SET message_id = ? WHERE server_name = ? AND type = 'status' AND channel_id = ?", params: [message.id, game_server.server_name, status.channel_id]})
            });
        }
        game_server.status_messages.push(found_message);
    }
}
