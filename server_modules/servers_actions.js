module.exports = async (client) => {
    const GameServerClass = require('./index.js');
    const servers = await client.mysqlRequest(client.database, "SELECT * FROM servers", []);
    if (!servers.length) {
        console.log('Failed to find servers. Aborting.');
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
                game_server.tgs_id = server.tgs_id;
                game_server.pull_data_update();
            } else {
                game_server = new GameServerClass(server, client);
                game_server.game_connection = await client.mysqlCreate({host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: game_server.database});
                await require(`./servers/${game_server.init_file_name}`)(client, game_server);
            }
            updated_servers[`${game_server.server_name}`] = game_server;
            if (!game_server.message_updater_intervals) {
                game_server.message_updater_intervals = {}
                client.serverMessageUpdator(game_server);
            }
            if (game_server.guild && !game_server.update_roles_interval) client.serverRoles(game_server);
            if (!game_server.update_custom_operatos_interval) game_server.serverCustomOperators();
        }
        for (const server_name in client.servers_link) {
            if (!updated_servers[server_name]) {
                const game_server = client.servers_link[server_name];
                game_server.drop_link()
                delete client.servers_link[server_name];
            }
        }
        client.servers_link = updated_servers;
    }
}
