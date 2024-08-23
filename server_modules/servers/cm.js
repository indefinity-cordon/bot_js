const Discord = require('discord.js');

module.exports = (client, game_server) => {
    game_server.updateStatus = async function (type) {
        try {
            const server_response = await client.prepareByondAPIRequest({client: client, request: JSON.stringify({query: "status", auth: "anonymous", source: "bot"}), port: game_server.port, address: game_server.ip});
            if (!server_response) throw 'server offline';
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
    };

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
                const extra_ranks = [];
                if (db_admin.extra_titles_encoded) {
                    for(const rank_id of JSON.parse(db_admin.extra_titles_encoded)) {
                        extra_ranks += `${roleMap.get(rank_id)}`;
                    }
                }
                if (extra_ranks.length > 0) info += `**Extra Ranks:** ${extra_ranks.join(' & ')}`;
                info += `**Last login:** ${db_player_profile[0].last_login}\n`;
                fields.push({ name: `**${db_player_profile[0].ckey}**`, value: info });
                if (fields.length === 25) {
                    embeds.push(
                        new Discord.EmbedBuilder()
                            .setTitle(` `)
                            .addFields(fields)
                            .setColor('#669917')
                    );
                    fields = [];
                }
            }
            if (fields.length > 0) {
                embeds.push(
                    new Discord.EmbedBuilder()
                        .setTitle(` `)
                        .addFields(fields)
                        .setColor('#669917')
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
    };

    game_server.updateRanks = async function (type) {
        try {
            const db_request_ranks = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT id, rank_name, text_rights FROM admin_ranks", params: [] });
            const embeds = [];
            let fields = [];
            for (const db_rank of db_request_ranks) {
                const rank_fields = db_rank.text_rights.split('|');
                fields.push({ name: `${db_rank.rank_name}`, value: `**Rights:** ${rank_fields.join(' & ')}` });
                if (fields.length === 25) {
                    embeds.push(
                        new Discord.EmbedBuilder()
                            .setTitle(` `)
                            .addFields(fields)
                            .setColor('#669917')
                    );
                    fields = [];
                }
            }
            if (fields.length > 0) {
                embeds.push(
                    new Discord.EmbedBuilder()
                        .setTitle(` `)
                        .addFields(fields)
                        .setColor('#669917')
                );
            }
            for (const message of game_server.updater_messages[type]) {
                await client.sendEmbed({
                    embeds: embeds,
                    content: `${game_server.server_name} Actual Ranks`,
                    components: [],
                    type: `edit`
                }, message);
            }
        } catch (error) {
            for (const message of game_server.updater_messages[type]) {
                await client.embed({
                    content: `${game_server.server_name} Actual Ranks`,
                    title: ``,
                    desc: `# ERROR`,
                    color: `#a00f0f`,
                    type: 'edit'
                }, message);
            }
        }
    };

    game_server.updateWhitelists = async function (type) {
        try {
            let acting_wls, replacements;
            switch (type) {
                case "whitelist_c": {
                    acting_wls = [
                        "WHITELIST_COMMANDER",
                        "WHITELIST_COMMANDER_COUNCIL",
                        "WHITELIST_COMMANDER_COUNCIL_LEGACY",
                        "WHITELIST_COMMANDER_COLONEL",
                        "WHITELIST_COMMANDER_LEADER"
                    ];
                    replacements = {
                        "WHITELIST_COMMANDER": "CO",
                        "WHITELIST_COMMANDER_COUNCIL": "CO Council",
                        "WHITELIST_COMMANDER_COUNCIL_LEGACY": "CO Council Legacy",
                        "WHITELIST_COMMANDER_COLONEL": "Colonel",
                        "WHITELIST_COMMANDER_LEADER": "CO Leader"
                    };
                } break;
                case "whitelist_s": {
                    acting_wls = [
                        "WHITELIST_SYNTHETIC",
                        "WHITELIST_SYNTHETIC_COUNCIL",
                        "WHITELIST_SYNTHETIC_COUNCIL_LEGACY",
                        "WHITELIST_SYNTHETIC_LEADER"
                    ];
                    replacements = {
                        "WHITELIST_SYNTHETIC": "Synthetic",
                        "WHITELIST_SYNTHETIC_COUNCIL": "Synthetic Council",
                        "WHITELIST_SYNTHETIC_COUNCIL_LEGACY": "Synthetic Council Legacy",
                        "WHITELIST_SYNTHETIC_LEADER": "Synthetic Leader"
                    };
                } break;
                case "whitelist_j": {
                    acting_wls = ["WHITELIST_JOE"];
                    replacements = { "WHITELIST_JOE": "Joe" };
                } break;
                case "whitelist_p": {
                    acting_wls = [
                        "WHITELIST_YAUTJA",
                        "WHITELIST_YAUTJA_LEGACY",
                        "WHITELIST_YAUTJA_COUNCIL",
                        "WHITELIST_YAUTJA_COUNCIL_LEGACY",
                        "WHITELIST_YAUTJA_LEADER"
                    ];
                    replacements = {
                        "WHITELIST_YAUTJA": "Yautja",
                        "WHITELIST_YAUTJA_LEGACY": "Yautja Legacy",
                        "WHITELIST_YAUTJA_COUNCIL": "Yautja Council",
                        "WHITELIST_YAUTJA_COUNCIL_LEGACY": "Yautja Council Legacy",
                        "WHITELIST_YAUTJA_LEADER": "Yautja Leader"
                    };
                } break;
            }
            const embeds = [];
            let fields = [];
            const db_player_profiles = await client.databaseRequest({
                database: game_server.game_connection,
                query: "SELECT id, ckey, whitelist_status FROM players WHERE whitelist_status != \"\"",
                params: []
            });
            for (const player of db_player_profiles) {
                const wl_fields = player.whitelist_status.split('|');
                const actual_wl_fields = wl_fields
                    .filter(field => acting_wls.includes(field))
                    .map(field => replacements[field] || field);
                if (actual_wl_fields.length > 0) {
                    fields.push({ name: `**${player.ckey}**`, value: `**Status:** ${actual_wl_fields.join(' & ')}` });
                    if (fields.length === 25) {
                        embeds.push(
                            new Discord.EmbedBuilder()
                                .setTitle(` `)
                                .addFields(fields)
                                .setColor('#669917')
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
                        .setColor('#669917')
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
    };


    game_server.handling_updaters = {
        "status": game_server.updateStatus,
        "admin": game_server.updateAdmins,
        "rank": game_server.updateRanks,
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
                title: `Request`,
                desc: `This is user don't have CM profile`,
                color: `#c70058`
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
            player_info += `**Rank:** ${roleMap.get(db_request_admin[0].rank_id)}\n`;
            const extra_ranks = [];
            if (db_request_admin[0].extra_titles_encoded) {
                for(const rank_id of JSON.parse(db_request_admin[0].extra_titles_encoded)) {
                    extra_ranks += `${roleMap.get(rank_id)}`;
                }
            }
            if (extra_ranks.length > 0) info += `**Extra Ranks:** ${extra_ranks.join(' & ')}`;
        }
        client.ephemeralEmbed({
            title: `**${request[0].role_rank ? `HIDDEN` : db_player_profile[0].ckey}** player info`,
            desc: `\n${player_info}\n${rank_info}\n**Total playtime:** ${Math.round(player_playtime / 6) / 10} Hours`,
            color: `#c70058`
        }, interaction);
    };


    //HANDLING COMMMANDS
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

    game_server.manageAdmins = async function (interaction) {
        const actionOptions = [
            { label: 'Add Admin', value: 'add' },
            { label: 'Remove Admin', value: 'remove' },
            { label: 'Update Admin', value: 'update' }
        ];

        const selectedAction = await client.sendInteractionSelectMenu(interaction, `select-action`, 'Select action', actionOptions, 'Choose an action for admin management:');
        if (selectedAction) {
            switch (selectedAction) {
                case 'add': {
                    await client.sendInteractionInput(interaction, 'rank-name-modal', 'Enter the ckey of the player to add as admin:', 'Ckey', '');
                    client.onInteractionInput(interaction, 'rank-name-modal', async (ckey) => {
                        const playerData = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT id, ckey FROM players WHERE ckey LIKE ?", params: [`%${ckey}%`] });
                        if (!playerData.length) {
                            return;
                        }
                        const playerOptions = playerData.map(player => ({
                            label: player.ckey,
                            value: player.id.toString()
                        }));
                        const selectedPlayerId = await client.sendInteractionSelectMenu(interaction, `select-player`, 'Select Player', playerOptions, 'Select the player to add as admin:');
                        if (selectedPlayerId) {
                            const rankOptions = await getRankOptions(game_server.game_connection);
                            const selectedRankId = await client.sendInteractionSelectMenu(interaction, `select-rank`, 'Select Rank', rankOptions, 'Select the rank to assign:');
                            if (selectedRankId) {
                                await client.databaseRequest({ 
                                    database: game_server.game_connection, 
                                    query: "INSERT INTO admins (player_id, rank_id) VALUES (?, ?, ?)", 
                                    params: [selectedPlayerId, selectedRankId] 
                                });
                                await client.sendSuccessEmbed({
                                    content: 'Admin added successfully!',
                                    interaction: interaction
                                });
                            }
                        }
                    });
                } break;
                case 'remove': {
                    const adminList = await getAdminOptions(game_server.game_connection);
                    if (adminList.length === 0) {
                        await client.sendErrorEmbed({
                            content: 'No admins found to remove.',
                            interaction: interaction
                        });
                        return;
                    }
                    const selectedAdminId = await client.sendInteractionSelectMenu(interaction, `select-admin`, 'Select Admin', adminList, 'Select the admin to remove:');
                    if (selectedAdminId && await client.sendInteractionConfirm(interaction, `Are you sure you want to remove this admin?`)) {
                        await client.databaseRequest({ 
                            database: game_server.game_connection, 
                            query: "DELETE FROM admins WHERE player_id = ?", 
                            params: [selectedAdminId] 
                        });
                        await client.sendSuccessEmbed({
                            content: 'Admin removed successfully!',
                            interaction: interaction
                        });
                    }
                } break;
                case 'update': {
                    const adminList = await getAdminOptions(game_server.game_connection);
                    if (adminList.length === 0) {
                        await client.sendErrorEmbed({
                            content: 'No admins found to update.',
                            interaction: interaction
                        });
                        return;
                    }
                    const selectedAdminId = await client.sendInteractionSelectMenu(interaction, `select-admin`, 'Select Admin', adminList, 'Select the admin to update:');
                    if (selectedAdminId) {
                        const rankOptions = await getRankOptions(game_server.game_connection);
                        const selectedRankId = await client.sendInteractionSelectMenu(interaction, `select-rank`, 'Select Rank', rankOptions, 'Select the new rank to assign:');
                        if (selectedRankId) {
                            await client.databaseRequest({ 
                                database: game_server.game_connection, 
                                query: "UPDATE admins SET rank_id = ? WHERE player_id = ?", 
                                params: [selectedRankId, selectedAdminId] 
                            });
                            await client.sendSuccessEmbed({
                                content: 'Admin updated successfully!',
                                interaction: interaction
                            });
                        }
                    }
                } break;
            }
        };
    };

    game_server.manageRanks = async function (interaction) {
        const actionOptions = [
            { label: 'Add Rank', value: 'add' },
            { label: 'Remove Rank', value: 'remove' },
            { label: 'Update Rank', value: 'update' }
        ];
    
        const selectedAction = await client.sendInteractionSelectMenu(interaction, `select-action`, 'Select action', actionOptions, 'Choose an action for rank management:');
        if (selectedAction) {
            switch (selectedAction) {
                case 'add': {
                    await client.sendInteractionInput(interaction, 'rank-name-modal', 'Enter the name of the new rank:', 'Rank Name', '');
                    client.onInteractionInput(interaction, 'rank-name-modal', async (rankName) => {
                        await client.sendInteractionInput(interaction, 'rank-rights-modal', 'Enter the text rights for this rank:', 'rank|rights', '');
                        client.onInteractionInput(interaction, 'rank-rights-modal', async (textRights) => {
                            await client.databaseRequest({
                                database: game_server.game_connection,
                                query: "INSERT INTO admin_ranks (rank_name, text_rights) VALUES (?, ?)",
                                params: [rankName, textRights]
                            });
                            await client.sendSuccessEmbed({
                                content: `Rank ${rankName} added successfully!`,
                                interaction: interaction
                            });
                        });
                    });
                    break;
                }
                case 'remove': {
                    const rankList = await getRankOptions(game_server.game_connection);
                    if (rankList.length === 0) {
                        await client.sendErrorEmbed({
                            content: 'No ranks found to remove.',
                            interaction: interaction
                        });
                        return;
                    }
                    const selectedRankId = await client.sendInteractionSelectMenu(interaction, `select-rank`, 'Select Rank', rankList, 'Select the rank to remove:');
                    if (selectedRankId && await client.sendInteractionConfirm(interaction, `Are you sure you want to remove this rank?`)) {
                        await client.databaseRequest({
                            database: game_server.game_connection,
                            query: "DELETE FROM admin_ranks WHERE id = ?",
                            params: [selectedRankId]
                        });
                        await client.sendSuccessEmbed({
                            content: 'Rank removed successfully!',
                            interaction: interaction
                        });
                    }
                    break;
                }
                case 'update': {
                    const rankList = await getRankOptions(game_server.game_connection);
                    if (rankList.length === 0) {
                        await client.sendErrorEmbed({
                            content: 'No ranks found to update.',
                            interaction: interaction
                        });
                        return;
                    }
                    const selectedRankId = await client.sendInteractionSelectMenu(interaction, `select-rank`, 'Select Rank', rankList, 'Select the rank to update:');
                    if (selectedRankId) {
                        await client.sendInteractionInput(interaction, 'rank-name-modal', 'Enter the new name for the rank:', 'Rank Name', '');
                        client.onInteractionInput(interaction, 'rank-name-modal', async (newRankName) => {
                            await client.sendInteractionInput(interaction, 'rank-rights-modal', 'Enter the text rights for this rank:', 'rank|rights', '');
                            client.onInteractionInput(interaction, 'rank-rights-modal', async (newTextRights) => {
                                await client.databaseRequest({
                                    database: game_server.game_connection,
                                    query: "UPDATE admin_ranks SET rank_name = ?, text_rights = ? WHERE id = ?",
                                    params: [newRankName, newTextRights, selectedRankId]
                                });
                                await client.sendSuccessEmbed({
                                    content: 'Rank updated successfully!',
                                    interaction: interaction
                                });
                            });
                        });
                    }
                    break;
                }
            }
        }
    };

    game_server.handling_actions = {
        "manage_admins": game_server.manageAdmins,
        "manage_ranks": game_server.manageRanks
    };

    game_server.handling_commands = [
        { label: "Manage Admins", value: "manage_admins" },
        { label: "Manage Ranks", value: "manage_ranks" }
    ];
}

async function getAdminOptions(database_connection) {
    const admins = await client.databaseRequest({
        database: database_connection,
        query: "SELECT a.player_id, p.ckey FROM admins a JOIN players p ON a.player_id = p.id",
        params: []
    });

    return admins.map(admin => ({
        label: admin.ckey,
        value: admin.player_id.toString()
    }));
};

async function getRankOptions(database_connection) {
    const ranks = await client.databaseRequest({
        database: database_connection,
        query: "SELECT id, rank_name FROM admin_ranks",
        params: []
    });

    return ranks.map(rank => ({
        label: rank.rank_name,
        value: rank.id.toString()
    }));
};