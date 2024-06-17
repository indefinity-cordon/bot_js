const GameServerClass = require('../index.s.mts');

export async function updateServers(client) {
    const servers = await new Promise((resolve, reject) => {
        global.database.query("SELECT server_name, db_name, ip, port FROM servers ORDER BY id", [], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
    if (!servers.length) {
        console.log(`Failed to find servers. Aborting.`);
        return;
    } else {
        let updated_servers = [];
        for (const server of servers) {
            let game_server
            if (server.server_name in global.servers_link) {
                game_server = global.servers_link[server.server_name]
                game_server.database = server.db_name,
                game_server.ip = server.ip,
                game_server.port = server.port 
            } else {
                game_server = new GameServerClass({
                    server_name: server.server_name,
                    database: server.db_name,
                    ip: server.ip,
                    port: server.port 
                });
            }
            require(`./servers/${game_server.database}`)(client, game_server);
            updated_servers[`${game_server.server_name}`] = game_server;
            client.serverStatus({ game_server: game_server })
        }
        global.servers_link -= updated_servers
        for (const server of global.servers_link) {
            let remove_game_server = global.servers_link[server]
            clearInterval(remove_game_server.status_interval);
            clearInterval(remove_game_server.update_status_messages_interval);
            remove_game_server.status_messages = null;
            delete(remove_game_server)
        }
        global.servers_link = updated_servers
    }
}
