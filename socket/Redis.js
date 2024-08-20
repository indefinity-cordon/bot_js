const redis = require('redis');
const chalk = require('chalk');

const connection = redis.createClient({
    username: `${process.env.REDIS_USER}`,
    password: `${process.env.REDIS_PASSWORD}`,
    socket: {
        host: `${process.env.REDIS_SERVER}`,
        port: `${process.env.REDIS_PORT}`
    }
});

connection.on('error', err => console.log(chalk.blue(chalk.bold(`Socket`)), (chalk.white(`>>`)), chalk.red(`Redis`), (chalk.white(`>>`)), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(err)));

module.exports = async (client) => {
    console.log(chalk.blue(chalk.bold(`Socket`)), (chalk.white(`>>`)), chalk.red(`Redis`), chalk.green(`starting connecting...`));
    client.redis_connection = null;
    await connection.connect((err, result) => {
        if (err) {
            console.log(chalk.blue(chalk.bold(`Socket`)), (chalk.white(`>>`)), chalk.red(`Redis`), (chalk.white(`>>`)), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Failed connect to the Redis server.`));
        } else {
            client.redis_connection = connection;
            console.log(chalk.blue(chalk.bold(`Socket`)), (chalk.white(`>>`)), chalk.red(`Redis`), chalk.green(`Connected to the Redis server.`));
        }
    });
}
