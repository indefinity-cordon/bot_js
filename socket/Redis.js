const redis = require('redis');
const chalk = require('chalk');

const connection = redis.createClient(process.env.REDIS_STRING);

connection.on('error', err => console.log(chalk.blue(chalk.bold(`Socket`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Redis`), chalk.red(err)));

module.exports = async (client) => {
    console.log(chalk.blue(chalk.bold(`Socket`)), chalk.white(`>>`), chalk.red(`Redis`), chalk.green(`starting connecting...`));
    client.redis_connection = null;
    await connection.connect((err, result) => {
        if (err) {
            console.log(chalk.blue(chalk.bold(`Socket`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Redis`), chalk.red(`Failed connect to the Redis server.`));
        } else {
            client.redis_connection = connection;
            console.log(chalk.blue(chalk.bold(`Socket`)), chalk.white(`>>`), chalk.red(`Redis`), chalk.green(`Connected to the Redis server.`));
        }
    });
}
