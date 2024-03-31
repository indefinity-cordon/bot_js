const redis = require('redis');
const chalk = require('chalk');

const connection = redis.createClient({
    url: `redis://${process.env.REDIS_USER}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_SERVER}:${process.env.REDIS_PORT}`
});

connection.on('error', err => console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`[ERROR]`), (chalk.white(`>>`)), chalk.red(`Redis`), chalk.white(`>>`), chalk.red(err)));

module.exports = async () => {
    console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`Redis`), chalk.green(`is connecting...`))
    global.redis_connection = connection;
    connection.connect((err) => {
        if (!err) {
            console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`Redis`), chalk.green(`Connected to the Redis server.`))
        }
    });
    return;
}
