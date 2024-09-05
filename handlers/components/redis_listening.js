const Discord = require('discord.js');
require('dotenv').config('.env');

let subscriber;
let collectors = [];

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
        if (!isJsonString(data)) {
            client.redisLogCallback(data);
        } else {
            client.redisCallback(JSON.parse(data));
        }
    });

    for (const old_collector of collectors) {
        old_collector.stop();
    }
    for (const server_name in client.servers_link) {
        const db_request = await client.databaseRequest(client.database, "SELECT type, channel_id, message_id FROM server_channels WHERE server_name = ? AND message_id = \"-2\"", [client.servers_link[server_name].server_name]);
        for (const message_collector of db_request) {
            const channel = await client.channels.fetch(message_collector.channel_id);
            if (!channel) return;
            const collector = channel.createMessageCollector()
            collector.on('collect', message => {
                if (message.author.id !== process.env.DISCORD_ID) sendToRedis(message, client, message_collector.type);
            });
            collectors.push(collector)
        }
    }
}

function isJsonString(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

function sendToRedis(message, client, redis_channel) {
    const redisMessage = {
        color: "#22a88b",
        source: "DISCORD",
        author: message.member.displayName,
        message: message.content
    };
    client.redis_connection.publish(redis_channel, JSON.stringify(redisMessage));
}
