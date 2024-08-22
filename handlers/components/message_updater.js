const Discord = require('discord.js');

module.exports = async (client) => {
    client.serverStatus = async function ({
        game_server: game_server
    }) {
        for(const type of game_server.updater_messages) {
            clearInterval(game_server.message_updater_intervals[type]);
        }
        clearInterval(game_server.update_status_messages_interval);
        await game_server.game_connection
        await updateUpdatersMessages(client, game_server);
        game_server.update_status_messages_interval = setInterval(
            updateUpdatersMessages,
            10 * 60 * 1000, // Каждые N минут (первое число)
            client,
            game_server
        );
        for(const type of game_server.updater_messages) {
            game_server.message_updater_intervals[type] = setInterval(
                game_server.handling_updaters[type],
                1 * 60 * 1000, // Каждые N минут (первое число)
                type
            );
        }
    };
    client.ServerActions(client);
};

async function updateUpdatersMessages(client, game_server) {
    game_server.updater_messages.splice();
    const updaters = await client.databaseRequest({ database: client.database, query: "SELECT channel_id, message_id, type FROM server_channels WHERE server_name = ?", params: [game_server.server_name] });
    if (!updaters.length) {
        console.log(`Failed to find server related feed channels. Aborting, for ${game_server.server_name}`);
        return;
    }
    for (const updater of updaters) {
        const channel = await client.channels.fetch(updater.channel_id);
        var found_message = null;
        if (updater.message_id && updater.message_id !== "1") {
            await channel.messages.fetch().then((messages) => {
                for (const message of updater) {
                    if (message[1].id === status.message_id) {
                        found_message = message[1];
                    }
                }
            });
        }
        if (found_message === null && updater.message_id !== "1") {
            await client.embed({
                title: `${game_server.server_name} ${updater.type}`,
                desc: `prepairing...`
            }, channel).then((message) => {
                found_message = message;
                client.databaseRequest({ database: client.database, query: "UPDATE server_channels SET message_id = ? WHERE server_name = ? AND type = ? AND channel_id = ?", params: [message.id, game_server.server_name, updater.type, updater.channel_id] });
            });
        }
        if (!game_server.updater_messages[updater.type]) game_server.updater_messages[updater.type] = []
        game_server.updater_messages[updater.type].push(found_message);
    }
}
