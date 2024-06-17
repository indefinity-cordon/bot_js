module.exports = (client, game_server) => {
    game_server.infoRequest = async function ({
        request: request
    }, interaction) {
        let rank_info = ``;
        if (request[0].role_rank) {
            const db_role = await new Promise((resolve, reject) => {
                global.game_database.query("SELECT role_name FROM discord_ranks WHERE rank = ?", [request[0].role_rank], (err, result) => {
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
                    global.game_database.query("SELECT role_name FROM discord_ranks WHERE rank = ?", [request[0].stable_rank], (err, result) => {
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
            global.game_database.query("SELECT id, ckey, last_login, is_permabanned, permaban_reason, permaban_date, permaban_admin_id, is_time_banned, time_ban_reason, time_ban_expiration, time_ban_admin_id, time_ban_date FROM players WHERE ckey = ?", [request[0].player_ckey], (err, result) => {
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
            global.game_database.query("SELECT role_id, total_minutes FROM player_playtime WHERE player_id = ?", [db_player_profile[0].id], (err, result) => {
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
            title: `**${request[0].stable_rank ? `HIDDEN` : request[0].player_ckey}** player info`,
            desc: `\n${player_info}\n${rank_info}\n**Total playtime:** ${Math.round(player_playtime / 6) / 10} Hours`,
            color: `#6d472b`
        }, interaction);
    }
}