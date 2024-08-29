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
        if (typeof data === 'string' || data instanceof String) {
            client.redisLogCallback(data);
        } else {
            client.redisCallback(JSON.parse(data));
        }
    });

    for (const server_name in client.servers_link) {
        game_server = client.servers_link[server_name];
        const db_request = await client.databaseRequest(client.database, "SELECT type, channel_id, message_id FROM server_channels WHERE server_name = ? AND message_id = \"-2\"", [game_server.server_name]);
        for (const message_collector of db_request) {
            const channel = await client.channels.fetch(message_collector.channel_id);
            if (!channel) return;
            channel.createMessageCollector().on('collect', message => {
                sendToRedis(message, client, message_collector.type);
            });
        }
    }
}

function sendToRedis(message, client, redis_channel) {
    const redisMessage = {
        color: message.member.roles.highest.hexColor,
        source: "DISCORD",
        author: message.member.displayName,
        message: message.content
    };
    client.redis_connection.publish(redis_channel, JSON.stringify(redisMessage));
}