const redis = require('redis');
const chalk = require('chalk');

const connection = redis.createClient({
    url: `redis://${process.env.REDIS_USER}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_SERVER}:${process.env.REDIS_PORT}`
});

connection.on('error', err => console.log(chalk.blue(chalk.bold(`Socket`)), (chalk.white(`>>`)), chalk.red(`Redis`), (chalk.white(`>>`)), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(err)));

module.exports = async () => {
    console.log(chalk.blue(chalk.bold(`Socket`)), (chalk.white(`>>`)), chalk.red(`Redis`), chalk.green(`starting connecting...`))
    global.redis_connection = null;
    new Promise((resolve, reject) => {
        connection.connect((err, result) => {
            if (err) {
                console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`[ERROR]`), (chalk.white(`>>`)), chalk.red(`MySQL`), chalk.red(`Failed connect to the Game database.`));
                console.log(chalk.blue(chalk.bold(`Socket`)), (chalk.white(`>>`)), chalk.red(`Redis`), (chalk.white(`>>`)), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Failed connect to the Redis server.`));
                reject(err);
            } else {
                global.redis_connection = connection;
                console.log(chalk.blue(chalk.bold(`Socket`)), (chalk.white(`>>`)), chalk.red(`Redis`), chalk.green(`Connected to the Redis server.`))
                resolve(result);
            }
        });
    });
}
