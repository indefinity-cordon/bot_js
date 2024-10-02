module.exports = async (client) => {
    const servers = await global.gather_data(global.database, 'Server', "SELECT * FROM ##TABLE##", []);
    if (!servers.length) {
        console.log('Failed to find servers. Aborting.');
    } else {
        let updated_servers = {};

        for (const serverData of servers) {
            let game_server;

            // Проверяем, если сервер уже есть в клиенте
            if (serverData.server_name in global.servers_link) {
                game_server = global.servers_link[serverData.server_name];

                // Используем уже существующий объект, просто обновляем его данные
                await game_server.sync(global.database); // Синхронизация с базой данных
                game_server.database = serverData.db_name;
                
                // Обновляем соединение с БД сервера
                await new Promise((resolve, reject) => {
                    game_server.game_connection.changeUser({database: game_server.database}, (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });

                // Обновляем параметры сервера
                game_server.data.init_file_name = serverData.file_name;
                game_server.data.guild = serverData.guild;
                game_server.data.ip = serverData.ip;
                game_server.data.port = serverData.port;
                game_server.data.tgs_id = serverData.tgs_id;
                game_server.pull_data_update();
            } else {
                // Создаем новый объект Server и синхронизируем его
                game_server = new Server(serverData.id); // Инициализируем сервер по его ID
                await game_server.sync(global.database); // Синхронизируем данные сервера из базы

                // Устанавливаем соединение с базой данных сервера
                game_server.game_connection = await global.mysqlCreate({
                    host: process.env.DB_HOST, 
                    port: process.env.DB_PORT, 
                    user: process.env.DB_USER, 
                    password: process.env.DB_PASSWORD, 
                    database: game_server.data.db_name
                });
                await require(`./servers/${game_server.data.init_file_name}`)(client, game_server);
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
            await game_server.save(global.database);
        }
        for (const server_name in global.servers_link) {
            if (!updated_servers[server_name]) {
                const game_server = global.servers_link[server_name];
                game_server.drop_link();
                delete global.servers_link[server_name];
            }
        }
        global.servers_link = updated_servers;
    }
};
