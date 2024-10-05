module.exports = async (client) => {
    if (!global.discord_server) return;
    const servers = await global.gather_data(global.database, 'Server', "SELECT * FROM ##TABLE## WHERE guild = ?", [global.discord_server.id]);
    if (!servers.length) {
        console.log('Failed to find servers. Aborting.');
    } else {
        let updated_servers = {};

        for (const server of servers) {
            if (server.data.server_name in global.servers_link) {
                await new Promise((resolve, reject) => {
                    server.game_connection.changeUser({database: server.data.db_name}, (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });
            } else {
                await server.sync();
                if (server.data.db_connection_string) {
                    server.game_connection = await global.mysqlCreate(server.data.db_connection_string);
                }
                await require(`./servers/${server.data.file_name}`)(client, server);
            }
            updated_servers[`${server.data.server_name}`] = server;
            if (!server.message_updater_intervals) {
                server.message_updater_intervals = {};
                client.serverMessageUpdator(server);
            }
            if (server.data.guild && !server.update_roles_interval) {
                client.serverRoles(server);
            }
            if (!server.update_custom_operatos_interval) {
                server.serverCustomOperators();
            }
        }
        global.servers_link = updated_servers;
    }
};
