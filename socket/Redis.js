const redis = require('redis');
const chalk = require('chalk');

const connection = redis.createClient(process.env.REDIS_STRING);

connection.on('error', err => console.log(chalk.blue(chalk.bold(`Socket`)), chalk.white('>>'), chalk.red(`[ERROR]`), chalk.white('>>'), chalk.red(`Redis`), chalk.red(err)));

module.exports = async (client) => {
    console.log(chalk.blue(chalk.bold(`Socket`)), chalk.white('>>'), chalk.red(`Redis`), chalk.green(`starting connecting...`));
    await connection.connect();
    client.redis_connection = connection;
}
