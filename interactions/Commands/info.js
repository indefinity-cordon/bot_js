const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');

let servers_options = [];
let servers_reverse_options = [];
for (const server of global.handling_game_servers) {
    servers_options.push({
        name: `${server.server_name}`,
        value: `${server.db_name}`
    });
    servers_reverse_options[`${server.server_name}`] = `${server.db_name}`; // Fix for discord.js issue, it's not returning right value
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Order information about yourself')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Select user to show info about')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('server')
                .setDescription('Select game server')
                .setRequired(true)
                .addChoices(...servers_options)
        )
    ,

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        await interaction.deferReply({ ephemeral: true });
        await client.ephemeralEmbed({
            title: `Information Request`,
            desc: `In progress...`,
            color: `#6d472b`
        }, interaction);
        const user = await interaction.options.getUser('user');
        let server = servers_reverse_options[await interaction.options.getString('server')];
        console.log(`target server ${server}`)
        const db_discord_link = await new Promise((resolve, reject) => {
            global.database.query("SELECT player_ckey, discord_id, role_rank, stable_rank FROM discord_links WHERE discord_id = ?", [user.id], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        if (!db_discord_link[0] || !db_discord_link[0].discord_id) {
            client.ephemeralEmbed({
                title: `Information Request`,
                desc: `This is user don't have linked game profile`,
                color: `#6d472b`
            }, interaction);
            return;
        }
        client.ephemeralEmbed({
            title: `Information Request`,
            desc: `Connecting to database...`,
            color: `#8f0c0c`
        }, interaction);
        const db_status = await new Promise((resolve, reject) => {
            global.game_database.changeUser({database : server}, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        if (!db_status) {
            client.ephemeralEmbed({
                title: `Information Request`,
                desc: `Cannot connect to database...`,
                color: `#8f0c0c`
            }, interaction);
            return;
        }
        switch (server) {
            case "cmi":
                let rank_info = ``;
                if (db_discord_link[0].role_rank) {
                    const db_role = await new Promise((resolve, reject) => {
                        global.game_database.query("SELECT role_name FROM discord_ranks WHERE rank = ?", [db_discord_link[0].role_rank], (err, result) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(result);
                            }
                        });
                    });
                    let db_stable_role;
                    if (db_discord_link[0].stable_rank != db_discord_link[0].role_rank) {
                        db_stable_role = await new Promise((resolve, reject) => {
                            global.game_database.query("SELECT role_name FROM discord_ranks WHERE rank = ?", [db_discord_link[0].stable_rank], (err, result) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(result);
                                }
                            });
                        });
                    }
                    if(db_discord_link[0].stable_rank && !db_stable_role) {
                        rank_info += `[SPECIAL] Supported Rank: ${db_role[0].rank_name}\n`
                    } else {
                        if (db_stable_role) {
                            rank_info += `[SPECIAL] Supported Rank: ${db_role[0].rank_name}\n`
                        }
                        rank_info = `Supported Rank: ${db_role[0].rank_name}\n`
                    }
                }
                const db_player_profile = await new Promise((resolve, reject) => {
                    global.game_database.query("SELECT id, ckey, last_login, is_permabanned, permaban_reason, permaban_date, permaban_admin_id, is_time_banned, time_ban_reason, time_ban_expiration, time_ban_admin_id, time_ban_date FROM players WHERE ckey = ?", [db_discord_link[0].player_ckey], (err, result) => {
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
                    title: `**${db_discord_link[0].stable_rank ? `HIDDEN` : db_discord_link[0].player_ckey}** player info`,
                    desc: `\n${player_info}\n${rank_info}\n**Total playtime:** ${Math.round(player_playtime / 6) / 10} Hours`,
                    color: `#6d472b`
                }, interaction);
                break;
            case "tgmc":
                client.ephemeralEmbed({
                    title: `Information Request`,
                    desc: `This is user don't have TGMC profile`,
                    color: `#6d472b`
                }, interaction);
                break;
        }
    },
};
