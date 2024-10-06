module.exports = (client) => {
    client.redisCallback = async function (data) {
        if (!data) return console.log('Database >> Redis >> [WARNING] Malformed Redis message, without data');

        if (data.source == 'DISCORD') return;
        let responded_game_server;
        for (const server_name in global.servers_link) {
            if (global.servers_link[server_name].instance_name !== data.source) continue;
            responded_game_server = global.servers_link[server_name];
            break;
        }
        if (!responded_game_server) return console.log(`Database >> Redis >> [WARNING] Failed to find server object. Aborting. data: ${data.source}`);

        if (!data.type) return;

        const status = await global.mysqlRequest(global.database, "SELECT channel_id, message_id FROM server_channels WHERE server = ? AND type = ?", [responded_game_server.id, data.type]);
        if (!status.length) return console.log(`Database >> MySQL >> Failed to find server related feed channels. Aborting. server: ${responded_game_server.data.server_name}, channel: ${data.type}`);

        const channel = await client.channels.fetch(status[0].channel_id);
        if (!channel) return console.log(`Database >> Redis >> [WARNING] Failed to find server related feed channels. Aborting. data: ${JSON.stringify(data)}`);

        if(responded_game_server.handledStatuses[data.state])
            await responded_game_server.handledStatuses[data.state](channel, data)
        else
            console.log(`Database >> Redis >> [WARNING] Unknown state received: ${data.state}`);
    };

    client.redisLogCallback = async function (data) {
        //TODO: make in future something with it
    };
}