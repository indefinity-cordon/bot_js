const Discord = require('discord.js');

module.exports = (client, game_server) => {
    game_server.updateStatus = async function (type) {
        try {
            const server_response = await client.prepareByondAPIRequest({client: client, request: JSON.stringify({query: "status", auth: "anonymous", source: "bot"}), port: game_server.port, address: game_server.ip});
            if (!server_response) return;
            const response = JSON.parse(server_response);
            const data = response.data
            const time = Math.floor(data.round_duration / 600)
            const desc = `**Round Name:** ${data.round_name}\n
                **Round ID:** ${data.round_id}\n
                **Map:** ${data.map_name}${data.next_map_name ? ` | **Next Map:** ${data.next_map_name}` : ``}\n
                **Ship Map:**  ${data.ship_map_name}${data.next_ship_map_name ? ` | **Next Map:** ${data.next_ship_map_name}` : ``}\n
                **Total Players:** ${data.players}\n
                **Gamemode:** ${data.mode}\n
                **Round Time:** ${`${Math.floor(time / 60)}:` + `${time % 60}`.padStart(2, '0')}\n
                ${data.round_end_state ? `\n**Rouned End State:** ${data.round_end_state}` : ``}`
            for (const message of game_server.updater_messages[type]) {
                await client.embed({
                    title: `${game_server.server_name} status`,
                    desc: desc,
                    color: `#669917`,
                    type: 'edit'
                }, message)
            }
        } catch (error) {
            for (const message of game_server.updater_messages[type]) {
                await client.embed({
                    title: `${game_server.server_name} status`,
                    desc: `# SERVER OFFLINE`,
                    color: `#a00f0f`,
                    type: 'edit'
                }, message);
            }
        }
    }

    game_server.updateAdmins = async function (type) {
        try {
            const db_request_admin = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT player_id, rank_id, extra_titles_encoded FROM admins", params: [] });
            const db_request_ranks = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT id, rank_name, text_rights FROM admin_ranks", params: [] });
            const roleMap = new Map();
            db_request_ranks.forEach(row => {
                roleMap.set(row.id, row.rank_name);
            });
            const embeds = [];
            let fields = [];
            for (const db_admin of db_request_admin) {
                const db_player_profile = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT ckey, last_login FROM players WHERE id = ?", params: [db_admin.player_id] });
                let info = `**Rank:** ${roleMap.get(db_admin.rank_id)}\n`;
                let extra_ranks;
                if (db_admin.extra_titles_encoded) {
                    for(const rank_id of JSON.parse(db_admin.extra_titles_encoded)) {
                        extra_ranks += `(${roleMap.get(rank_id)}) `;
                    }
                }
                if (extra_ranks) info += `**Extra Ranks:** ${extra_ranks}`;
                info += `**Last login:** ${db_player_profile[0].last_login}\n`;
                fields.push({ name: `**${db_player_profile[0].ckey}**`, value: info });
                if (fields.length === 25) {
                    embeds.push(
                        new Discord.EmbedBuilder()
                            .setTitle(` `)
                            .addFields(fields)
                            .setColor('#6d472b')
                    );
                    fields = [];
                }
            }
            if (fields.length > 0) {
                embeds.push(
                    new Discord.EmbedBuilder()
                        .setTitle(` `)
                        .addFields(fields)
                        .setColor('#6d472b')
                );
            }
            for (const message of game_server.updater_messages[type]) {
                await client.sendEmbed({
                    embeds: embeds,
                    content: `${game_server.server_name} Actual Admins`,
                    components: [],
                    type: `edit`
                }, message);
            }
        } catch (error) {
            for (const message of game_server.updater_messages[type]) {
                await client.embed({
                    content: `${game_server.server_name} Actual Admins`,
                    title: ``,
                    desc: `# ERROR`,
                    color: `#a00f0f`,
                    type: 'edit'
                }, message);
            }
        }
    }

    game_server.updateWhitelists = async function (type) {
        try {
            let acting_wls;
            switch (type) {
                case "whitelist_c": {
                    acting_wls = [
                        "WHITELIST_COMMANDER",
                        "WHITELIST_COMMANDER_COUNCIL",
                        "WHITELIST_COMMANDER_COUNCIL_LEGACY",
                        "WHITELIST_COMMANDER_COLONEL",
                        "WHITELIST_COMMANDER_LEADER"
                    ]
                } break;
                case "whitelist_s": {
                    acting_wls = [
                        "WHITELIST_SYNTHETIC",
                        "WHITELIST_SYNTHETIC_COUNCIL",
                        "WHITELIST_SYNTHETIC_COUNCIL_LEGACY",
                        "WHITELIST_SYNTHETIC_LEADER"
                    ]
                } break;
                case "whitelist_j": {
                    acting_wls = [
                        "WHITELIST_JOE"
                    ]
                } break;
                case "whitelist_p": {
                    acting_wls = [
                        "WHITELIST_YAUTJA",
                        "WHITELIST_YAUTJA_LEGACY",
                        "WHITELIST_YAUTJA_COUNCIL",
                        "WHITELIST_YAUTJA_COUNCIL_LEGACY",
                        "WHITELIST_YAUTJA_LEADER"
                    ]
                } break;
            }
            const embeds = [];
            let fields = [];
            const db_player_profiles = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT id, ckey, whitelist_status FROM players WHERE whitelist_status != \"\"", params: [] });
            for(const player of db_player_profiles) {
                const wl_fields = player.whitelist_status.split('|');
                const actual_wl_fields = wl_fields.filter(field => acting_wls.includes(field));
    
                if (actual_wl_fields.length > 0) {
                    fields.push({ name: `**${player.ckey}**`, value: `**Status:** ${actual_wl_fields.join(', ')}` });
                    if (fields.length === 25) {
                        embeds.push(
                            new Discord.EmbedBuilder()
                                .setTitle(` `)
                                .addFields(fields)
                                .setColor('#6d472b')
                        );
                        fields = [];
                    }
                }
            }
            if (fields.length > 0) {
                embeds.push(
                    new Discord.EmbedBuilder()
                        .setTitle(` `)
                        .addFields(fields)
                        .setColor('#6d472b')
                );
            }
            for (const message of game_server.updater_messages[type]) {
                await client.sendEmbed({
                    embeds: embeds,
                    content: `${game_server.server_name} Actual Whitelists`,
                    components: [],
                    type: `edit`
                }, message);
            }
        } catch (error) {
            for (const message of game_server.updater_messages[type]) {
                await client.embed({
                    content: `${game_server.server_name} Actual Whitelists`,
                    title: ``,
                    desc: `# ERROR`,
                    color: `#a00f0f`,
                    type: 'edit'
                }, message);
            }
        }
    }


    game_server.handling_updaters = {
        "status": game_server.updateStatus,
        "admin": game_server.updateAdmins,
        "whitelist_c": game_server.updateWhitelists,
        "whitelist_s": game_server.updateWhitelists,
        "whitelist_j": game_server.updateWhitelists,
        "whitelist_p": game_server.updateWhitelists
    };


    game_server.infoRequest = async function ({
        request: request
    }, interaction) {
        let rank_info = ``;
        if (request[0].role_rank) {
            const db_role = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT rank_name FROM discord_ranks WHERE rank_id = ?", params: [request[0].role_rank] });
            let db_stable_role;
            if (request[0].stable_rank != request[0].role_rank) {
                db_stable_role = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT rank_name FROM discord_ranks WHERE rank_id = ?", params: [request[0].stable_rank] });
            }
            if(request[0].stable_rank && !db_stable_role) {
                rank_info += `[SPECIAL] Supported Rank: ${db_role[0].rank_name}\n`;
            } else {
                if (db_stable_role) {
                    rank_info += `[SPECIAL] Supported Rank: ${db_role[0].rank_name}\n`;
                }
                rank_info = `Supported Rank: ${db_role[0].rank_name}\n`;
            }
        }
        const db_player_profile = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT id, ckey, last_login, is_permabanned, permaban_reason, permaban_date, permaban_admin_id, is_time_banned, time_ban_reason, time_ban_expiration, time_ban_admin_id, time_ban_date FROM players WHERE id = ?", params: [request[0].player_id] });
        if (!db_player_profile[0]) {
            client.ephemeralEmbed({
                title: `Information Request`,
                desc: `This is user don't have CM profile`,
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
        const db_player_playtime = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT role_id, total_minutes FROM player_playtime WHERE player_id = ?", params: [db_player_profile[0].id] });
        let player_playtime = 0;
        for (const playtime of db_player_playtime) {
            player_playtime += playtime.total_minutes;
        }
        const db_request_admin = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT rank_id, extra_titles_encoded FROM admins WHERE player_id = ?", params: [db_player_profile[0].id] });
        if (db_request_admin[0]) {
            const db_request_ranks = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT id, rank_name, text_rights FROM admin_ranks", params: [] });
            const roleMap = new Map();
            db_request_ranks.forEach(row => {
                roleMap.set(row.id, row.rank_name);
            });
            player_info += `**Rank:** ${roleMap.get(db_admin.rank_id)}\n`;
            let extra_ranks;
            if (db_admin.extra_titles_encoded) {
                for(const rank_id of JSON.parse(db_admin.extra_titles_encoded)) {
                    extra_ranks += `(${roleMap.get(rank_id)}) `;
                }
            }
            if (extra_ranks) player_info += `**Extra Ranks:** ${extra_ranks}`;
        }
        client.ephemeralEmbed({
            title: `**${request[0].role_rank ? `HIDDEN` : db_player_profile[0].ckey}** player info`,
            desc: `\n${player_info}\n${rank_info}\n**Total playtime:** ${Math.round(player_playtime / 6) / 10} Hours`,
            color: `#6d472b`
        }, interaction);
    }


    //HANDLING COMMMANDS
    game_server.viewAdmins = async function (interaction) {
        const db_request_admin = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT player_id, rank_id, extra_titles_encoded FROM admins", params: [] });
        const db_request_ranks = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT id, rank_name, text_rights FROM admin_ranks", params: [] });
        const roleMap = new Map();
        db_request_ranks.forEach(row => {
            roleMap.set(row.id, row.rank_name);
        });
        const embeds = [];
        let fields = [];
        for (const db_admin of db_request_admin) {
            const db_player_profile = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT ckey, last_login FROM players WHERE id = ?", params: [db_admin.player_id] });
            let info = `**Rank:** ${roleMap.get(db_admin.rank_id)}\n`;
            let extra_ranks;
            if (db_admin.extra_titles_encoded) {
                for(const rank_id of JSON.parse(db_admin.extra_titles_encoded)) {
                    extra_ranks += `(${roleMap.get(rank_id)}) `;
                }
            }
            if (extra_ranks) info += `**Extra Ranks:** ${extra_ranks}`;
            info += `**Last login:** ${db_player_profile[0].last_login}\n`;
            fields.push({ name: `**${db_player_profile[0].ckey}**`, value: info });
            if (fields.length === 25) {
                embeds.push(
                    new Discord.EmbedBuilder()
                        .setTitle(` `)
                        .addFields(fields)
                        .setColor('#6d472b')
                );
                fields = [];
            }
        }
        if (fields.length > 0) {
            embeds.push(
                new Discord.EmbedBuilder()
                    .setTitle(` `)
                    .addFields(fields)
                    .setColor('#6d472b')
            );
        }
        await interaction.editReply({ content: 'View Admins', embeds: embeds, components: [], ephemeral: true });
    }

    game_server.viewRanks = async function (interaction) {
        const db_request_ranks = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT id, rank_name, text_rights FROM admin_ranks", params: [] });
        const embeds = [];
        let fields = [];
        for (const db_rank of db_request_ranks) {
            fields.push({ name: `${db_rank.rank_name}`, value: `**Rights:** ${db_rank.text_rights}` });
            if (fields.length === 25) {
                embeds.push(
                    new Discord.EmbedBuilder()
                        .setTitle(` `)
                        .addFields(fields)
                        .setColor('#6d472b')
                );
                fields = [];
            }
        }
        if (fields.length > 0) {
            embeds.push(
                new Discord.EmbedBuilder()
                    .setTitle(` `)
                    .addFields(fields)
                    .setColor('#6d472b')
            );
        }
        await interaction.editReply({ content: 'View Ranks', embeds: embeds, components: [], ephemeral: true });
    };

/*
    game_server.admin_playtimes = async function (client, interaction) {
        
    }
    game_server.playtimes = async function (client, interaction) {
        
    }

    // Если админ, то можем выбрать другой любой ID игрока и запросить через notes
    game_server.admin_notes = async function (client, interaction) {
        
    }
    // Запрашиваем информацию по нотесам игрока (его ID)
    game_server.notes = async function (client, interaction) {
        
    }

    game_server.admin_battlepass = async function (client, interaction) {
        
    }

    game_server.server_battlepass = async function (client, interaction) {
        
    }

    game_server.user_battlepass = async function (client, interaction) {
        
    }
*/
    game_server.handling_view_actions = {
        "admins": game_server.viewAdmins,
        "ranks": game_server.viewRanks
    };

    game_server.handling_view_commands = [
        { label: "View Admins", value: "admins" },
        { label: "View Ranks", value: "ranks" }
    ];
}