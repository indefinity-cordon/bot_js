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
    console.log(`subscribe1`)
    await subscriber.connect();
    subscriber.subscribe('byond.round', async (data) => {
        client.redisCallback({data: JSON.parse(data)});
    });

    subscriber = global.redis_connection.duplicate();
    subscribers.push(subscriber)
    console.log(`subscribe2`)
    await subscriber.connect();
    subscriber.subscribe('byond.admin', async (data) => {
        client.redisCallback({data: JSON.parse(data)});
    });

    subscriber = global.redis_connection.duplicate();
    subscribers.push(subscriber)
    console.log(`subscribe3`)
    await subscriber.connect();
    subscriber.subscribe('byond.asay', async (data) => {
        client.redisCallback({data: JSON.parse(data)});
    });

    subscriber = global.redis_connection.duplicate();
    subscribers.push(subscriber)
    console.log(`subscribe4`)
    await subscriber.connect();
    subscriber.subscribe('byond.access', async (data) => {
        client.redisCallback({data: JSON.parse(data)});
    });
};