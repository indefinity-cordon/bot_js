const chalk = require('chalk');

module.exports = (client) => {
    client.redisCallback = async function ({
        data: data
    }) {
        if (data) {
            const instances = await client.tgs_getInstances();
            let responded_instance;
            for (const instance of instances) {
                if (data.source === instance.name) {
                    responded_instance = instance;
                    break;
                }
            }
            let responded_game_server;
            for (const server_name in client.servers_link) {
                const game_server = client.servers_link[server_name];
                if (game_server.tgs_id !== responded_instance.id) continue;
                responded_game_server = game_server;
            }
            if (!responded_game_server) return;
            const status = await client.databaseRequest(client.database, "SELECT channel_id, message_id, role_id FROM server_channels WHERE server_name = ? AND type = ?", [responded_game_server.server_name, data.type]);
            if (!status.length) {
                console.log(chalk.blue(chalk.bold(`Database`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`MySQL`), chalk.red(`Failed to find server related feed channels. Aborting. data: ${[data]}`));
            } else {
                const channel = await client.channels.fetch(status[0].channel_id);
                switch (data.state) {
                    case "ooc": {//"author" = key, "message" = msg
                    } break;

                    case "start": {
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
                            client.databaseRequest(client.database, "UPDATE server_channels SET message_id = ? WHERE server_name = ? AND type = ? AND channel_id = ?", [message.id, data.source, data.type, status[0].channel_id]);
                        });
                    } break;

                    case "ahelp": {//"embed" = actions
                        await client.embed({
                            title: data.embed.title,
                            desc: data.embed.desc,
                            fields: data.embed.fields,
                            footer: data.embed.footer,
                            content: data.embed.content,
                            url: data.embed.url,
                            author: data.embed.author,
                            color: `#5a2944`
                        }, channel);
                    } break;

                    case "add_time_ban": {//"ref_player_id" = id
                    } break;

                    case "remove_time_ban": {//"ref_player_id" = id
                    } break;

                    case "add_job_ban": {//"ref_player_id" = id
                    } break;

                    case "remove_job_ban": {//"ref_player_id" = id
                    } break;

                    case "add_perma_ban": {//"ref_player_id" = id
                    } break;

                    case "remove_perma_ban": {//"ref_player_id" = id
                    } break;

                    case "auto_unban": {//"ref_player_id" = id
                    } break;

                    case "auto_unjobban": {//"ref_player_id" = id
                    } break;

                    case "asay": {
                        await client.embed({
                            title: `Asay of ${data.author}`,
                            desc: `Message ${data.message}\n Rank: ${data.rank}`,
                            color: `#261395`
                        }, channel);
                    } break;

                    case "fax": {
//"sender" = usr.client.ckey, "sender_name" = usr, "fax_name" = original_fax.name, "departament" = "[network], [target_department]", "message" = original_fax.info, "admins" = length(GLOB.admins)
                    } break;

                    case "login": {
                        await client.embed({
                            title: `Admin Login`,
                            desc: data.key
                        }, channel);
                    } break;

                    case "logout": {
                        await client.embed({
                            title: `Admin logout`,
                            desc: data.key
                        }, channel);
                    } break;
                }
            }
        } else {
            console.log(chalk.blue(chalk.bold(`Socket`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Redis`), chalk.red(`Malformed Redis message, without data.`));
        }
    }
}
