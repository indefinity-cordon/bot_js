const chalk = require('chalk');

module.exports = (client) => {
    client.redisCallback = async function ({
        data: data
    }) {
        console.log(`redis req ${data}`)
        if (data) {
            const status = await new Promise((resolve, reject) => {
                global.database.query("SELECT channel_id, message_id, role_id FROM server_channels WHERE server_name = ? AND type = ?", [data.source, data.type], (err, result) => {
                    if (err) {
                        console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`[ERROR]`), (chalk.white(`>>`)), chalk.red(`MySQL`), chalk.red(`Failed to save message id for deletion, data: ${[message.id]}; ${[data]}; ${[status[0].channel_id]}.`))
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
            if (!status.length) {
                console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`[ERROR]`), (chalk.white(`>>`)), chalk.red(`MySQL`), chalk.red(`Failed to find server related feed channels. Aborting. data: ${[data]}.`))
            } else {
                const channel = await client.channels.fetch(status[0].channel_id);
                switch (data.state) {
                    case "start":
                        if (status[0].message_id) {
                            await channel.messages.fetch().then((messages) => {
                                for (const message of messages) {
                                    if (message[1].id === status[0].message_id) {
                                        message[1].delete();
                                    }
                                }
                            });
                        }
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
                                        reject(console.log(chalk.blue(chalk.bold(`Database`)), (chalk.white(`>>`)), chalk.red(`[ERROR]`), (chalk.white(`>>`)), chalk.red(`MySQL`), chalk.red(`Failed to save message id for deletion. Data: ${[message.id]}; ${[data]}; ${[status[0].channel_id]}.`)));
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
                        }
                        break;

                    case "ahelp":
                        await client.embed({
                            title: data.embed.title,
                            desc: data.embed.desc,
                            fields: data.embed.fields,
                            footer: data.embed.footer,
                            content: data.embed.content,
                            url: data.embed.url,
                            author: data.embed.author,
                            color: `#5a2944`
                        }, channel)
                        break;

                    case "ban":
                        await client.embed({
                            title: data.title,
                            desc: data.desc,
                            color: data.color
                        }, channel)
                        break;

                    case "fflog":
                        await client.embed({
                            title: data.title,
                            desc: data.desc,
                            color: data.color
                        }, channel)
                        break;

                    case "asay":
                        await client.embed({
                            title: `Asay of ${data.author}`,
                            desc: `Message ${data.message}\n Rank: ${data.rank}`,
                            color: `#261395`
                        }, channel)
                        break;

                    case "fax":
                        await client.embed({
                            title: data.title,
                            desc: data.desc,
                            fields: data.fields,
                            color: `#76b0a8`
                        }, channel)
                        break;

                    case "login":
                        await client.embed({
                            title: `Admin Login`,
                            desc: data.key
                        }, channel)
                        break;

                    case "logout":
                        await client.embed({
                            title: `Admin logout`,
                            desc: data.key
                        }, channel)
                        break;
                }
            }
        } else {
            console.log(chalk.blue(chalk.bold(`Socket`)), (chalk.white(`>>`)), chalk.red(`Redis`), (chalk.white(`>>`)), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Malformed Redis message, without data.`))
        }
    }
}
