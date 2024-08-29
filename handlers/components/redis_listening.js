const Discord = require('discord.js');

let subscriber;

module.exports = async (client) => {
    client.on(Discord.Events.ClientReady, async () => {
        startListining(client);
        setInterval(
            startListining,
            20 * 60 * 1000, // Каждые N минут (первое число),
            client
        );
    });
};

async function startListining(client) {
    if (!client.redis_connection) return;

    if (subscriber) subscriber.disconnect();
    subscriber = client.redis_connection.duplicate();
    await subscriber.connect();
    subscriber.pSubscribe(`byond.*`, async (data) => {
        console.log(data)
        client.redisCallback(JSON.parse(data));
    });
}