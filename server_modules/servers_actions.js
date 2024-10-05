module.exports = async (client) => {
    const guilds = await global.gather_data(global.database, 'Guild', "SELECT * FROM ##TABLE##");
    if (!guilds.length) {
        console.log('Failed to find guilds. Aborting.');
    } else {
        let updated_guilds = {};
        for (const guild of guilds) {
            guild.sync();
            updated_guilds[`${guild.data.guild_id}`] = guild;
        }
        global.guilds_link = updated_guilds;
    }


    const servers = await global.gather_data(global.database, 'Server', "SELECT * FROM ##TABLE##");
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
                server.sync();
                for (const guild_id in global.guilds_link) {
                    if (global.guilds_link[guild_id].id !== server.data.guild) continue;
                    server.discord_server = global.guilds_link[guild_id]
                }
                const data = await client.tgs_getInstance(server.discord_server.settings_data.tgs_address);
                server.instance_name = data.content.name;
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
