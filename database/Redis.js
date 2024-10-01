const redis = require('redis');

module.exports = async (client) => {
    if (!client.redis_connection) {
        client.redis_connection = redis.createClient(process.env.REDIS_STRING);
        client.redis_connection.on('error', err => console.log('Database >> Redis >> [ERROR] >>', err));
        console.log('Database >> Redis >> Connecting ...');
        redisConnect(client);
    }

    client.INT_modules += setInterval(async () => {
        const redisActive = await checkRedisConnection(client);
        if (!redisActive) {
            console.log('Database >> Redis >> [ERROR] >> Failed to Restore Connection');
        }
    }, 60000);
};

async function checkRedisConnection(client) {
    try {
        const result = await client.redis_connection.ping();
        if (result === 'PONG') return true;
    } catch (err) {
        console.log('Database >> Redis >> [ERROR] >> Connection Lost ... Redconnect Attempt ...');
        return await redisConnect(client);
    }
};

async function redisConnect(client) {
    try {
        await client.redis_connection.connect();
        console.log('Database >> Redis >> Connected');
        return true;
    } catch (err) {
        console.log('Database >> Redis >> [ERROR] >> Connection Error:', err);
        return false;
    }
};