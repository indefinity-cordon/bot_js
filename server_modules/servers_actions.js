module.exports = async (client) => {
    const GameServerClass = require('./index.s.mts');
    const servers = await client.databaseRequest({ database: client.database, query: "SELECT server_name, db_name, file_name, guild, ip, port FROM servers", params: [] });
    if (!servers.length) {
        console.log(`Failed to find servers. Aborting.`);
    } else {
        let updated_servers = [];
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
                game_server.game_connection = null;
                await client.createDBConnection({ game_server: game_server });
                game_server.init_file_name = server.file_name;
                game_server.guild = server.guild;
                game_server.ip = server.ip;
                game_server.port = server.port;
                game_server.status_messages = [];
                require(`./servers/${game_server.init_file_name}`)(client, game_server);
            }
            updated_servers[`${game_server.server_name}`] = game_server;
            if (!game_server.status_interval) client.serverStatus({ game_server: game_server });
            if (game_server.guild && !game_server.update_roles_interval) client.serverRoles({ game_server: game_server });
        }
        if ( client.servers_link.length ) {
            client.servers_link -= updated_servers;
            for (const server of client.servers_link) {
                let remove_game_server = client.servers_link[server];
                clearInterval(remove_game_server.status_interval);
                clearInterval(remove_game_server.update_status_messages_interval);
                clearInterval(remove_game_server.update_roles_interval);
                remove_game_server.status_messages.splice();
                delete client.servers_link[server];
            }
        }
        client.servers_link = updated_servers;
    }
}
