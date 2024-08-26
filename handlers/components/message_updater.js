const Discord = require('discord.js');

module.exports = async (client) => {
    client.serverMessageUpdator = async function (game_server) {
        await game_server.game_connection
        await updateUpdatersMessages(client, game_server);
        game_server.update_status_messages_interval = setInterval(
            updateUpdatersMessages,
            60 * 60 * 1000, // Каждые N минут (первое число)
            client,
            game_server
        );
    };
    client.ServerActions(client);
};

async function updateUpdatersMessages(client, game_server) {
    const db_request = await client.databaseRequest(client.database, "SELECT type, channel_id, message_id FROM server_channels WHERE server_name = ? AND message_id != \"1\"", [game_server.server_name]);
    if (!db_request.length) {
        console.log(`Failed to find server related feed channels. Aborting, for ${game_server.server_name}`);
        return;
    }
    for(const type in game_server.updater_messages) {
        clearInterval(game_server.message_updater_intervals[type]);
        delete game_server.message_updater_intervals[type];
        delete game_server.updater_messages[type];
    }
    for (const updater of db_request) {
        const channel = await client.channels.fetch(updater.channel_id);
        var found_message = null;
        if (updater.message_id) {
            await channel.messages.fetch().then((messages) => {
                for (const message of messages) {
                    if (message[1].id === updater.message_id) {
                        found_message = message[1];
                    }
                }
            });
        }
        if (found_message === null) {
            await client.embed({
                title: `${game_server.server_name}`,
                desc: `prepairing...`
            }, channel).then((message) => {
                found_message = message;
                client.databaseRequest(client.database, "UPDATE server_channels SET message_id = ? WHERE server_name = ? AND type = ? AND channel_id = ?", [message.id, game_server.server_name, updater.type, updater.channel_id]);
            });
        }
        if (!game_server.updater_messages[updater.type]) game_server.updater_messages[updater.type] = []
        game_server.updater_messages[updater.type].push(found_message);
    }
    for(const type in game_server.updater_messages) {
        game_server.message_updater_intervals[type] = setInterval(
            game_server.handling_updaters[type],
            1 * 60 * 1000, // Каждые N минут (первое число)
            type
        );
    }
}
