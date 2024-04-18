const redis = require('redis');
const chalk = require('chalk');

const connection = redis.createClient({
    url: `${process.env.REDIS_CONNECTION_STRING}`
});

connection.on('error', err => console.log(chalk.blue(chalk.bold(`Socket`)), (chalk.white(`>>`)), chalk.red(`Redis`), (chalk.white(`>>`)), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(err)));

module.exports = async () => {
    console.log(chalk.blue(chalk.bold(`Socket`)), (chalk.white(`>>`)), chalk.red(`Redis`), chalk.green(`starting connecting...`));
    global.redis_connection = null;
    await connection.connect((err, result) => {
        if (err) {
            console.log(chalk.blue(chalk.bold(`Socket`)), (chalk.white(`>>`)), chalk.red(`Redis`), (chalk.white(`>>`)), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Failed connect to the Redis server.`));
        } else {
            global.redis_connection = connection;
            console.log(chalk.blue(chalk.bold(`Socket`)), (chalk.white(`>>`)), chalk.red(`Redis`), chalk.green(`Connected to the Redis server.`));
        }
    });
}
