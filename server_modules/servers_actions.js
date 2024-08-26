module.exports = async (client) => {
    const GameServerClass = require('./index.js');
    const servers = await client.databaseRequest(client.database, "SELECT server_name, db_name, file_name, guild, ip, port FROM servers", []);
    if (!servers.length) {
        console.log(`Failed to find servers. Aborting.`);
    } else {
        let updated_servers = {};
        for (const server of servers) {
            let game_server;
            if (server.server_name in client.servers_link) {
                game_server = client.servers_link[server.server_name];
                game_server.database = server.db_name;
                await new Promise((resolve, reject) => {
                    game_server.game_connection.changeUser({database : game_server.database}, (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });
                game_server.init_file_name = server.file_name;
                game_server.guild = server.guild;
                game_server.ip = server.ip;
                game_server.port = server.port;
            } else {
                game_server = new GameServerClass();
                game_server.server_name = server.server_name;
                game_server.database = server.db_name;
                await client.createDBConnection(game_server);
                game_server.init_file_name = server.file_name;
                game_server.guild = server.guild;
                game_server.ip = server.ip;
                game_server.port = server.port;
                require(`./servers/${game_server.init_file_name}`)(client, game_server);
            }
            updated_servers[`${game_server.server_name}`] = game_server;
            if (!game_server.message_updater_intervals) {
                game_server.message_updater_intervals = {}
                client.serverMessageUpdator(game_server);
            }
            if (game_server.guild && !game_server.update_roles_interval) client.serverRoles(game_server);
        }
        for (const server_name in client.servers_link) {
            if (!updated_servers[server_name]) {
                let remove_game_server = client.servers_link[server_name];
                clearInterval(remove_game_server.update_status_messages_interval);
                clearInterval(remove_game_server.update_roles_interval);
                for(const type in remove_game_server.updater_messages) {
                    clearInterval(remove_game_server.message_updater_intervals[type]);
                    delete remove_game_server.message_updater_intervals[type];
                    delete remove_game_server.updater_messages[type];
                }
                remove_game_server.updater_messages = null;
                delete client.servers_link[server_name];
            }
        }
        client.servers_link = updated_servers;
    }
}
