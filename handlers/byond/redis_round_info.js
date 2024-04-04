const Discord = require('discord.js');
const config = require("../../config/bot.js");

var subscriber;

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
    if(!global.redis_connection) {
        return;
    }
    if (subscriber) {
        subscriber.disconnect()
    }
    subscriber = global.redis_connection.duplicate();
    await subscriber.connect();
    subscriber.subscribe('byond.round', async (data) => {
        data = JSON.parse(data);
        const status = await new Promise((resolve, reject) => {
            global.database.query("SELECT channel_id, message_id, role_id FROM server_channels WHERE server_name = ? AND type = ?", [data.source, data.type], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        if (!status.length) {
            console.log(`Failed to find server (${data.source}) and type (${data.type}) related feed channels. Aborting. FULL DATA TRANSMISSION LOG ${data}`);
        } else {
            const channel = await client.channels.fetch(status[0].channel_id);
            var found_message = null;
            if (status[0].message_id) {
                await channel.messages.fetch().then((messages) => {
                    for (const message of messages) {
                        if (message[1].id === status[0].message_id) {
                            found_message = message[1];
                        }
                    }
                });
            }
            switch (data.state) {
                case "start":
                    if (found_message)
                        found_message.delete();
                    const role = channel.guild.roles.cache.find(role => role.name === `${data.source} Round`);
                    await client.embed({
                        title: `NEW ROUND!`,
                        desc: `<@&${role.id}>`,
                        color: role.hexColor
                    }, channel).then((message) => {
                        new Promise((resolve, reject) => {
                            global.database.query("UPDATE server_channels SET message_id = ? WHERE server_name = ? AND type = ? AND channel_id = ?", [message.id, data.source, data.type, status[0].channel_id], (err, result) => {
                                if (err) {
                                    message.delete({timeout: 300000});
                                    reject(err);
                                } else {
                                    resolve(result);
                                }
                            });
                        });
                    });
                    break;
                case "statistic":
                    await channel.messages.fetch().then((messages) => {
                        for (const message of messages) {
                            message[1].delete();
                        }
                    });
                    for (const stat of data.statistic) {
                        await client.embed({
                            title: stat.title,
                            desc: stat.desc
                        }, channel)
                    break;
                }
            }
        }
    });
};