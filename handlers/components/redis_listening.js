const Discord = require('discord.js');

var subscribers = [];

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

    subscribers.forEach(subscriber => subscriber.disconnect());
    subscribers.length = 0;

    // Function to subscribe to a channel
    async function subscribeToChannel(channel) {
        const subscriber = client.redis_connection.duplicate();
        subscribers.push(subscriber);
        await subscriber.connect();
        subscriber.subscribe(channel, async (data) => {
            client.redisCallback(JSON.parse(data));
        });
    }

    // List of channels to subscribe to
    const channels = ['byond.round', 'byond.admin', 'byond.asay', 'byond.access'];

    // Subscribe to each channel
    for (const channel of channels) {
        await subscribeToChannel(channel);
    }
}