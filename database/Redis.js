const redis = require('redis');
const chalk = require('chalk');

module.exports = async (client) => {
    if (!client.redis_connection) {
        client.redis_connection = redis.createClient(process.env.REDIS_STRING);
        client.redis_connection.on('error', err => console.log(chalk.blue(chalk.bold(`Database`)), chalk.white('>>'), chalk.red(`[ERROR]`), chalk.white('>>'), chalk.red(`Redis`), chalk.red(err)));
        console.log(chalk.blue(chalk.bold(`Database`)), chalk.white('>>'), chalk.red(`Redis`), chalk.green(`starting connecting...`));
        redisConnect(client);
    }

    client.INT_modules += setInterval(async () => {
        const redisActive = await checkRedisConnection(client);
        if (!redisActive) {
            console.log(chalk.blue(chalk.bold('Database')), chalk.white('>>'), chalk.red('[ERROR]'), chalk.white('>>'), chalk.red('Failed to restore Redis connection'));
        }
    }, 60000);
};

async function checkRedisConnection(client) {
    try {
        const result = await client.redis_connection.ping();
        if (result === 'PONG') return true;
    } catch (err) {
        console.log(chalk.blue(chalk.bold('Database')), chalk.white('>>'), chalk.red('[ERROR]'), chalk.white('>>'), chalk.red('Redis Connection lost, attempting to reconnect...'));
        return await redisConnect(client);
    }
};

async function redisConnect(client) {
    try {
        await client.redis_connection.connect();
        console.log(chalk.blue(chalk.bold('Database')), chalk.white('>>'), chalk.green('Connected to Redis'));
        return true;
    } catch (err) {
        console.log(chalk.blue(chalk.bold('Database')), chalk.white('>>'), chalk.red('[ERROR]'), chalk.white('>>'), chalk.red('Failed connection to Redis'), err);
        return false;
    }
};