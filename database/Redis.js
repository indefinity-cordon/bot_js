const redis = require('redis');
const chalk = require('chalk');

const connection = redis.createClient({
    url: `redis://${process.env.REDIS_USER}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_SERVER}:${process.env.REDIS_PORT}`
});

connection.on('error', err => console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`[ERROR]`), (chalk.white(`>>`)), chalk.red(`Redis`), chalk.white(`>>`), chalk.red(err)));

module.exports = async () => {
    console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`Redis`), chalk.green(`is connecting...`))
    connection.connect((err) => {
        if (err) {
            console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`[ERROR]`), (chalk.white(`>>`)), chalk.red(`Redis`), chalk.white(`>>`), chalk.red(`Failed to connect to Redis Server!`), chalk.white(`>>`), chalk.red(err))
            process.exit(1)
        } else {
            console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`Redis`), chalk.green(`Connected to the Redis server.`))
            global.redis_connection = connection;
        }
    });
    return;
}
