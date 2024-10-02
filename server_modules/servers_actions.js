module.exports = async (client) => {
    await client.guilds.fetch();
    const actual_guild = await global.mysqlRequest(game_server.game_connection, "SELECT rank_name FROM discord_ranks WHERE guild_id = ?", [client.guilds.cache[0].id]);
    const servers = await global.gather_data(global.database, 'Server', "SELECT * FROM ##TABLE## WHERE guild = ?", [actual_guild[0].id]);
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
                await game_server.sync();
                game_server.game_connection = await global.mysqlCreate({
                    host: process.env.DB_HOST, 
                    port: process.env.DB_PORT, 
                    user: process.env.DB_USER, 
                    password: process.env.DB_PASSWORD, 
                    database: server.data.db_name
                });
                await require(`./servers/${game_server.data.file_name}`)(client, game_server);
            }
            updated_servers[`${game_server.data.server_name}`] = game_server;
            if (!game_server.message_updater_intervals) {
                game_server.message_updater_intervals = {};
                client.serverMessageUpdator(game_server);
            }
            if (game_server.data.guild && !game_server.update_roles_interval) {
                client.serverRoles(game_server);
            }
            if (!game_server.update_custom_operatos_interval) {
                game_server.serverCustomOperators();
            }
        }
        global.servers_link = updated_servers;
    }
};
