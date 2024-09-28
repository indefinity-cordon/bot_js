const chalk = require('chalk');

module.exports = (client) => {
    client.redisCallback = async function (data) {
        if (!data) {
            console.log(chalk.blue(chalk.bold('Database')), chalk.white('>>'), chalk.red('[ERROR]'), chalk.white('>>'), chalk.red('Redis'), chalk.red('Malformed Redis message, without data.'));
            return;
        }
        if (data.source == 'DISCORD')
            return;
        const instances = await client.tgs_getInstances();
        const responded_instance = instances.find(instance => instance.name === data.source);
        if (!responded_instance) {
            console.log(chalk.blue(chalk.bold('Database')), chalk.white('>>'), chalk.red('[ERROR]'), chalk.white('>>'), chalk.red('Redis'), chalk.red(`Failed to find server instance. Aborting. data: ${data.source}, instances found: ${JSON.stringify(instances)}`));
            return;
        }
        let responded_game_server;
        for (const server_name in client.servers_link) {
            let game_server = client.servers_link[server_name];
            if (game_server.tgs_id == responded_instance.id) {
                responded_game_server = game_server;
                break;
            }
        }
        if (!responded_game_server) {
            console.log(chalk.blue(chalk.bold('Database')), chalk.white('>>'), chalk.red('[ERROR]'), chalk.white('>>'), chalk.red('Redis'), chalk.red(`Failed to find server object. Aborting. data: ${data.source}, instance id: ${responded_instance.id}`));
            return;
        }
        const status = await client.mysqlRequest(client.database, "SELECT channel_id, message_id FROM server_channels WHERE server_name = ? AND type = ?", [responded_game_server.server_name, data.type]);
        if (!status.length) {
            console.log(chalk.blue(chalk.bold('Database')), chalk.white('>>'), chalk.red('[ERROR]'), chalk.white('>>'), chalk.red('MySQL'), chalk.red(`Failed to find server related feed channels. Aborting. server: ${responded_game_server.server_name}, channel: ${data.type}`));
            return;
        }
        const channel = await client.channels.fetch(status[0].channel_id);
        if (!channel) {
            console.log(chalk.blue(chalk.bold('Database')), chalk.white('>>'), chalk.red('[ERROR]'), chalk.white('>>'), chalk.red('Redis'), chalk.red(`Failed to find server related feed channels. Aborting. data: ${JSON.stringify(data)}`));
            return;
        }
        if(responded_game_server.handledStatuses[data.state])
            await responded_game_server.handledStatuses[data.state](channel, data)
        else
            console.log(chalk.blue(chalk.bold('Database')), chalk.white('>>'), chalk.red('[ERROR]'), chalk.white('>>'), chalk.red(`Unknown state received: ${data.state}`));
    };

    client.redisLogCallback = async function (data) {
        //TODO: make in future something with it
    };
}