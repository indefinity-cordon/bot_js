const Discord = require('discord.js');

var subscribers = [];

module.exports = async (client) => {
    client.on(Discord.Events.ClientReady, async () => {
        startListining(client);
        setInterval(
            startListining,
            1200000,
            client
        );
    });
};

async function startListining(client) {
    if (!global.redis_connection) {
        return;
    }

    var subscriber
    for (subscriber in subscribers) {
        subscriber.disconnect()
    }

    subscriber = global.redis_connection.duplicate();
    subscribers.push(subscriber)
    await subscriber.connect();
    subscriber.subscribe('byond.round', client.redisCallback({data: JSON.parse(data)}));

    subscriber = global.redis_connection.duplicate();
    subscribers.push(subscriber)
    await subscriber.connect();
    subscriber.subscribe('byond.admin', client.redisCallback({data: JSON.parse(data)}));

    subscriber = global.redis_connection.duplicate();
    subscribers.push(subscriber)
    await subscriber.connect();
    subscriber.subscribe('byond.asay', client.redisCallback({data: JSON.parse(data)}));

    subscriber = global.redis_connection.duplicate();
    subscribers.push(subscriber)
    await subscriber.connect();
    subscriber.subscribe('byond.access', client.redisCallback({data: JSON.parse(data)}));
};