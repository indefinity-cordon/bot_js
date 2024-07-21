module.exports = (client, game_server) => {
    game_server.updateStatus = async function (client, game_server) {
        try {
            const response = JSON.parse(await client.prepareByondAPIRequest({request: JSON.stringify({query: "status", auth: "anonymous", source: "bot"}), port: game_server.port, address: game_server.ip}));
            const data = response.data
            const time = Math.floor(data.round_duration / 600)
            const desc = `**Round Name:** ${data.round_name}\n
                **Round ID:** ${data.round_id}\n
                **Map:** ${data.map_name}${data.next_map_name ? ` | **Next Map:** ${data.next_map_name}` : ``}\n
                **Ship Map:**  ${data.ship_map_name}${data.next_ship_map_name ? ` | **Next Map:** ${data.next_ship_map_name}` : ``}\n
                **Total Players:** ${data.players}\n
                **Gamemode:** ${data.gamemode}\n
                **Round Time:** ${`${Math.floor(time / 60)}:` + `${time % 60}`.padStart(2, '0')}\n
                ${data.round_end_state ? `\n**Rouned End State:** ${data.round_end_state}` : ``}`
            for (const message of game_server.status_messages) {
                await client.embed({
                    title: `${game_server.server_name} status`,
                    desc: desc,
                    color: `#669917`,
                    type: 'edit'
                }, message)
            }
        } catch (error) {
            
            for (const message of game_server.status_messages) {
                await client.embed({
                    title: `${game_server.server_name} status`,
                    desc: `# SERVER OFFLINE`,
                    color: `#a00f0f`,
                    type: 'edit'
                }, message)
            }
        }
    }
    game_server.infoRequest = async function ({
        request: request
    }, interaction) {
        let rank_info = ``;
        if (request[0].role_rank) {
            const db_role = await new Promise((resolve, reject) => {
                game_server.game_connection.query("SELECT role_name FROM discord_ranks WHERE rank = ?", [request[0].role_rank], (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
            let db_stable_role;
            if (request[0].stable_rank != request[0].role_rank) {
                db_stable_role = await new Promise((resolve, reject) => {
                    game_server.game_connection.query("SELECT role_name FROM discord_ranks WHERE rank = ?", [request[0].stable_rank], (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });
            }
            if(request[0].stable_rank && !db_stable_role) {
                rank_info += `[SPECIAL] Supported Rank: ${db_role[0].rank_name}\n`
            } else {
                if (db_stable_role) {
                    rank_info += `[SPECIAL] Supported Rank: ${db_role[0].rank_name}\n`
                }
                rank_info = `Supported Rank: ${db_role[0].rank_name}\n`
            }
        }
        const db_player_profile = await new Promise((resolve, reject) => {
            game_server.game_connection.query("SELECT id, ckey, last_login, is_permabanned, permaban_reason, permaban_date, permaban_admin_id, is_time_banned, time_ban_reason, time_ban_expiration, time_ban_admin_id, time_ban_date FROM players WHERE ckey = ?", [request[0].player_id], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        if (!db_player_profile[0]) {
            client.ephemeralEmbed({
                title: `Information Request`,
                desc: `This is user don't have CMI profile`,
                color: `#6d472b`
            }, interaction);
            return;
        }
        let player_info = `**Last login:** ${db_player_profile[0].last_login}\n`;
        if (db_player_profile[0].is_permabanned) {
            player_info += `## **Permabanned**\n**Reason:** ${db_player_profile[0].permaban_reason}, **Date:** ${db_player_profile[0].permaban_date}\n`;
        } else if (db_player_profile[0].is_time_banned) {
            player_info += `## **Banned**\n**Reason:** ${db_player_profile[0].time_ban_reason}, **Exp:** ${db_player_profile[0].time_ban_expiration}, **Date:** ${db_player_profile[0].time_ban_date}\n`;
        }
        const db_player_playtime = await new Promise((resolve, reject) => {
            game_server.game_connection.query("SELECT role_id, total_minutes FROM player_playtime WHERE player_id = ?", [db_player_profile[0].id], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        let player_playtime = 0;
        for (const playtime of db_player_playtime) {
            player_playtime += playtime.total_minutes
        }
        //TODO: Admins
        client.ephemeralEmbed({
            title: `**${request[0].stable_rank ? `HIDDEN` : request[0].player_id}** player info`,
            desc: `\n${player_info}\n${rank_info}\n**Total playtime:** ${Math.round(player_playtime / 6) / 10} Hours`,
            color: `#6d472b`
        }, interaction);
    }
}