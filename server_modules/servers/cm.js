const Discord = require('discord.js');

module.exports = async (client, game_server) => {
    game_server.updateStatusMessage = async function (type) {
        try {
            const server_response = await client.prepareByondAPIRequest({client: client, request: JSON.stringify({query: 'status', auth: 'anonymous', source: 'bot'}), port: game_server.data.port, address: game_server.data.ip});
            if (!server_response) throw 'Returned no response';
            const response = JSON.parse(server_response);
            const data = response.data;
            if (!data) throw 'Returned no data';
            const time = Math.floor(data.round_duration / 600);
            let fields = [];
            fields.push({ name: '**Round Name**', value: `${data.round_name} `, inline: true});
            fields.push({ name: '**Round ID**', value: `${data.round_id} `, inline: true});
            fields.push({ name: '**Map**', value: `${data.map_name} `, inline: true});
            if (data.next_map_name) fields.push({ name: '**Next Map**', value: `${data.next_map_name} `, inline: true});
            fields.push({ name: '**Ship Map**', value: `${data.ship_map_name} `, inline: true});
            if (data.next_map_name) fields.push({ name: '***Next Ship Map**', value: `${data.next_ship_map_name} `, inline: true});
            fields.push({ name: '**Total Players**', value: `${data.players} `, inline: true});
            fields.push({ name: '**Gamemode**', value: `${data.mode}`, inline: true});
            fields.push({ name: '**Round Time**', value: `${Math.floor(time / 60)}:` + `${time % 60}`.padStart(2, '0'), inline: true});
            if (data.round_end_state) fields.push({ name: '**Rouned End State**', value: `${data.round_end_state} `, inline: true});
            for (const message of game_server.updater_messages[type]) {
                await client.sendEmbed({
                    embeds: [new Discord.EmbedBuilder().setTitle(' ').addFields(fields).setColor('#669917').setTimestamp()],
                    content: `${game_server.data.server_name} Status`,
                    components: [],
                    type: 'edit'
                }, message);
            }
        } catch (error) {
            game_server.handle_status(false);
            for (const message of game_server.updater_messages[type]) {
                await client.sendEmbed({
                    embeds: [new Discord.EmbedBuilder().setTitle(' ').setDescription('# SERVER OFFLINE').setColor('#a00f0f').setTimestamp()],
                    content: `${game_server.data.server_name} Status`,
                    components: [],
                    type: 'edit'
                }, message);
            }
        }
    };

    game_server.updateScheduleMessage = async function (type) {
        try {
            if (!game_server.settings_data.auto_start_config) throw 'Setup schedule';
            const server_schedule_data = await getSchedule(game_server.settings_data.auto_start_config.param);
            for (const message of game_server.updater_messages[type]) {
                await client.sendEmbed({
                    embeds: [new Discord.EmbedBuilder().setTitle(' ').setDescription(server_schedule_data).setColor('#669917').setTimestamp()],
                    content: `${game_server.data.server_name} start schedule`,
                    components: [],
                    type: 'edit'
                }, message);
            }
        } catch (error) {
            for (const message of game_server.updater_messages[type]) {
                await client.sendEmbed({
                    embeds: [new Discord.EmbedBuilder().setTitle(' ').setDescription('something went wrong').setColor('#a00f0f').setTimestamp()],
                    content: `${game_server.data.server_name} start schedule`,
                    components: [],
                    type: 'edit'
                }, message);
            }
        }
    };

    game_server.updateAdminsMessage = async function (type) {
        try {
            const db_request_admin = await global.mysqlRequest(game_server.game_connection, "SELECT player_id, rank_id, extra_titles_encoded FROM admins");
            const player_ids = db_request_admin.map(admin => admin.player_id);
            const db_request_profiles = await global.mysqlRequest(game_server.game_connection, `SELECT id, ckey, last_login FROM players WHERE id IN (${player_ids.join(',')})`);
            const profileMap = new Map();
            db_request_profiles.forEach(profile => {
                profileMap.set(profile.id, profile);
            });
            const db_request_ranks = await global.mysqlRequest(game_server.game_connection, "SELECT id, rank_name, text_rights FROM admin_ranks");
            const roleMap = new Map();
            db_request_ranks.forEach(row => {
                roleMap.set(row.id, row.rank_name);
            });
            const embeds = [];
            let description = '';
            let embed_description = null;
            let fields = [];
            for (const db_admin of db_request_admin) {
                const profile = profileMap.get(db_admin.player_id);
                if (!profile) continue;
                let extra_ranks = [];
                if (db_admin.extra_titles_encoded) {
                    extra_ranks = JSON.parse(db_admin.extra_titles_encoded).map(rank_id => roleMap.get(parseInt(rank_id)));
                }
                description += `**Ckey:** ${profile.ckey} [Last Login ${profile.last_login}]\n**Rank:** ${roleMap.get(db_admin.rank_id)}`;
                if (extra_ranks.length) {
                    description += ` [Extra Ranks ${extra_ranks.join(` & `)}]`;
                }
                description += '\n\n';
                if (embed_description && description.length > 824) {
                    fields.push({ name: ' ', value: description});
                    description = '';
                } else if (description.length > 3896) {
                    embed_description = description;
                    description = '';
                }
                if (fields.length == 25) {
                    embeds.push(new Discord.EmbedBuilder().setTitle(' ').setDescription(embed_description).addFields(fields).setColor('#669917'));
                    embed_description = null;
                    fields = [];
                }
            }
            if (embed_description && description.length) {
                fields.push({ name: ' ', value: description});
            } else if (description.length) {
                embed_description = description;
            }
            if (fields.length || embed_description) {
                embeds.push(new Discord.EmbedBuilder().setTitle(' ').setDescription(embed_description ? embed_description : ' ').addFields(fields.length ? fields : { name: ' ', value: ' '}).setColor('#669917'));
            }
            for (const message of game_server.updater_messages[type]) {
                await client.sendEmbed({
                    embeds: embeds,
                    content: `${game_server.data.server_name} Actual Admins`,
                    components: [],
                    type: 'edit'
                }, message);
            }
        } catch (error) {
            for (const message of game_server.updater_messages[type]) {
                await client.embed({
                    content: `${game_server.data.server_name} Actual Admins`,
                    title: '',
                    desc: '# ERROR',
                    color: '#a00f0f',
                    type: 'edit'
                }, message);
            }
        }
    };

    game_server.updateRanksMessage = async function (type) {
        try {
            const db_request = await global.mysqlRequest(game_server.game_connection, "SELECT id, rank_name, text_rights FROM admin_ranks");
            const embeds = [];
            let description = '';
            for (const db_rank of db_request) {
                const rank_fields = db_rank.text_rights.split('|');
                description += `**${db_rank.rank_name}**\n`;
                description += `${rank_fields.join(' & ')}\n\n`;
            }
            embeds.push(new Discord.EmbedBuilder().setTitle(' ').setDescription(description).setColor('#669917'));
            for (const message of game_server.updater_messages[type]) {
                await client.sendEmbed({
                    embeds: embeds,
                    content: `${game_server.data.server_name} Actual Ranks`,
                    components: [],
                    type: 'edit'
                }, message);
            }
        } catch (error) {
            for (const message of game_server.updater_messages[type]) {
                await client.embed({
                    content: `${game_server.data.server_name} Actual Ranks`,
                    title: '',
                    desc: '# ERROR',
                    color: '#a00f0f',
                    type: 'edit'
                }, message);
            }
        }
    };

    game_server.updateWhitelistsMessage = async function (type) {
        try {
            const db_request = await global.mysqlRequest(game_server.game_connection, "SELECT id, ckey, whitelist_status FROM players WHERE whitelist_status != ''");
            const acting_wls = {
                'Commander': ['WHITELIST_COMMANDER', 'WHITELIST_COMMANDER_COUNCIL', 'WHITELIST_COMMANDER_COUNCIL_LEGACY', 'WHITELIST_COMMANDER_COLONEL', 'WHITELIST_COMMANDER_LEADER'],
                'Synthetic': ['WHITELIST_SYNTHETIC', 'WHITELIST_SYNTHETIC_COUNCIL', 'WHITELIST_SYNTHETIC_COUNCIL_LEGACY', 'WHITELIST_SYNTHETIC_LEADER', 'WHITELIST_JOE'],
                'Yautja': ['WHITELIST_YAUTJA', 'WHITELIST_YAUTJA_LEGACY', 'WHITELIST_YAUTJA_COUNCIL', 'WHITELIST_YAUTJA_COUNCIL_LEGACY', 'WHITELIST_YAUTJA_LEADER']
            };
            const replacements = {
                'Commander': { 'WHITELIST_COMMANDER': 'CO', 'WHITELIST_COMMANDER_COUNCIL': 'CO Council', 'WHITELIST_COMMANDER_COUNCIL_LEGACY': 'CO Council Legacy', 'WHITELIST_COMMANDER_COLONEL': 'Colonel', 'WHITELIST_COMMANDER_LEADER': 'CO Leader' },
                'Synthetic': { 'WHITELIST_SYNTHETIC': 'Synthetic', 'WHITELIST_SYNTHETIC_COUNCIL': 'Synthetic Council', 'WHITELIST_SYNTHETIC_COUNCIL_LEGACY': 'Synthetic Council Legacy', 'WHITELIST_SYNTHETIC_LEADER': 'Synthetic Leader', 'WHITELIST_JOE': 'Joe' },
                'Yautja': { 'WHITELIST_YAUTJA': 'Yautja', 'WHITELIST_YAUTJA_LEGACY': 'Yautja Legacy', 'WHITELIST_YAUTJA_COUNCIL': 'Yautja Council', 'WHITELIST_YAUTJA_COUNCIL_LEGACY': 'Yautja Council Legacy', 'WHITELIST_YAUTJA_LEADER': 'Yautja Leader' }
            };
            const embeds = [];
            for(const type in acting_wls) {
                let fields = [];
                const grouped_players = {};
                for(const wl_name of acting_wls[type]) {
                    grouped_players[wl_name] = [];
                }
                for (const player of db_request) {
                    const wl_fields = player.whitelist_status.split('|');
                    const actual_wl_fields = wl_fields.filter(field => acting_wls[type].includes(field));
                    for (const wl_fields of actual_wl_fields) {
                        grouped_players[wl_fields].push(player.ckey);
                    }
                }
                for (const [status, players] of Object.entries(grouped_players)) {
                    if (!players.length) continue;
                    fields.push({ name: `**${replacements[type][status]}**`, value: players.join(', '), inline: true});
                }
                if (fields.length) embeds.push(new Discord.EmbedBuilder().setTitle(' ').addFields(fields).setColor('#669917'));
            }
            for (const message of game_server.updater_messages[type]) {
                await client.sendEmbed({
                    embeds: embeds,
                    content: `${game_server.data.server_name} Actual Whitelists`,
                    components: [],
                    type: 'edit'
                }, message);
            }
        } catch (error) {
            for (const message of game_server.updater_messages[type]) {
                await client.embed({
                    content: `${game_server.data.server_name} Actual Whitelists`,
                    title: '',
                    desc: '# ERROR',
                    color: '#a00f0f',
                    type: 'edit'
                }, message);
            }
        }
    };


    game_server.handling_updaters = {
        'message_status': game_server.updateStatusMessage,
        'message_schedule': game_server.updateScheduleMessage,
        'message_admin': game_server.updateAdminsMessage,
        'message_rank': game_server.updateRanksMessage,
        'message_whitelist': game_server.updateWhitelistsMessage
    };


    game_server.infoRequest = async function ({
        request: request
    }, interaction) {
        let rank_info = '';
        if (request[0].role_rank) {
            const db_role = await global.mysqlRequest(game_server.game_connection, "SELECT rank_name FROM discord_ranks WHERE rank_id = ?", [request[0].role_rank]);
            let db_stable_role;
            if (request[0].stable_rank != request[0].role_rank) {
                db_stable_role = await global.mysqlRequest(game_server.game_connection, "SELECT rank_name FROM discord_ranks WHERE rank_id = ?", [request[0].stable_rank]);
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
        const db_player_profile = await global.mysqlRequest(game_server.game_connection, "SELECT id, ckey, last_login, is_permabanned, permaban_reason, permaban_date, permaban_admin_id, is_time_banned, time_ban_reason, time_ban_expiration, time_ban_admin_id, time_ban_date FROM players WHERE id = ?", [request[0].player_id]);
        if (!db_player_profile[0]) {
            client.ephemeralEmbed({
                title: 'Request',
                desc: 'This is user don\'t have CM profile',
                color: '#c70058'
            }, interaction);
            return;
        }
        let player_info = `**Last login:** ${db_player_profile[0].last_login}\n`;
        if (db_player_profile[0].is_permabanned) {
            player_info += `## **Permabanned**\n**Reason:** ${db_player_profile[0].permaban_reason}, **Date:** ${db_player_profile[0].permaban_date}\n`;
        } else if (db_player_profile[0].is_time_banned) {
            player_info += `## **Banned**\n**Reason:** ${db_player_profile[0].time_ban_reason}, **Exp:** ${db_player_profile[0].time_ban_expiration}, **Date:** ${db_player_profile[0].time_ban_date}\n`;
        }
        const db_player_playtime = await global.mysqlRequest(game_server.game_connection, "SELECT role_id, total_minutes FROM player_playtime WHERE player_id = ?", [db_player_profile[0].id]);
        let player_playtime = 0;
        for (const playtime of db_player_playtime) {
            player_playtime += playtime.total_minutes;
        }
        const db_request_admin = await global.mysqlRequest(game_server.game_connection, "SELECT rank_id, extra_titles_encoded FROM admins WHERE player_id = ?", [db_player_profile[0].id]);
        if (db_request_admin[0]) {
            const db_request_ranks = await global.mysqlRequest(game_server.game_connection, "SELECT id, rank_name, text_rights FROM admin_ranks");
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
            title: `**${request[0].role_rank ? 'HIDDEN' : db_player_profile[0].ckey}** player info`,
            desc: `\n${player_info}\n${rank_info}\n**Total playtime:** ${Math.round(player_playtime / 6) / 10} Hours`,
            color: '#c70058'
        }, interaction);
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

    game_server.manageAdmins = async function (interaction) {
        const actionOptions = [
            { label: 'Add Admin', value: 'add' },
            { label: 'Remove Admin', value: 'remove' },
            { label: 'Update Admin', value: 'update' }
        ];
        const selectedAction = await client.sendInteractionSelectMenu(interaction, 'select-action', 'Select action', actionOptions, 'Choose an action for admin management:');
        if (selectedAction) {
            switch (selectedAction) {
                case 'add': {
                    await interaction.followUp({ content: 'Enter the ckey (or what it most likely) of the player to add as admin', ephemeral: true });
                    const ckey = await client.collectUserInput(interaction);
                    if (!ckey) return;
                    const playerData = await global.mysqlRequest(game_server.game_connection, "SELECT id, ckey FROM players WHERE ckey LIKE ?", [`%${ckey}%`]);
                    if (!playerData.length) {
                        await client.ephemeralEmbed({
                            title: 'Request',
                            desc: 'No player found with that ckey',
                            color: '#c70058'
                        }, interaction);
                        return;
                    }
                    const playerOptions = playerData.map(player => ({
                        label: player.ckey,
                        value: player.id.toString()
                    }));
                    const selectedPlayerId = await client.sendInteractionSelectMenu(interaction, 'select-player', 'Select Player', playerOptions, 'Select the player to add as admin:');
                    if (selectedPlayerId) {
                        const rankOptions = await getRankOptions(client, game_server.game_connection);
                        const selectedRankId = await client.sendInteractionSelectMenu(interaction, 'select-rank', 'Select Rank', rankOptions, 'Select the rank to assign:');
                        if (selectedRankId) {
                            await global.mysqlRequest(game_server.game_connection, "INSERT INTO admins (player_id, rank_id) VALUES (?, ?)", [selectedPlayerId, selectedRankId]);
                            const titlesOptions = [{ label: 'Set Up', value: 'set' }, { label: 'Skip', value: 'skip' }]
                            const seelectTitles = await client.sendInteractionSelectMenu(interaction, 'select-titles', 'Set Titles', titlesOptions, 'Would you like to assign extra titles to this admin?');
                            if (seelectTitles === 'set') {
                                const extraRankOptions = await getRankOptions(client, game_server.game_connection);
                                const selectedExtraRanks = await client.sendInteractionSelectMenu(interaction, 'select-extra-ranks', 'Select Extra Titles', extraRankOptions, 'Select extra titles to assign:', true);
                                if (selectedExtraRanks && selectedExtraRanks.length > 0) {
                                    await global.mysqlRequest(game_server.game_connection, "UPDATE admins SET extra_titles_encoded = ? WHERE player_id = ?", [JSON.stringify(selectedExtraRanks), selectedPlayerId]);
                                }
                            }
                            await client.ephemeralEmbed({
                                title: 'Request',
                                desc: 'Admin added successfully!',
                                color: '#669917'
                            }, interaction);
                        }
                    }
                } break;

                case 'remove': {
                    const adminList = await getAdminOptions(client, game_server.game_connection);
                    if (adminList.length === 0) {
                        await client.ephemeralEmbed({
                            title: 'Request',
                            desc: 'No admins found to remove',
                            color: '#c70058'
                        }, interaction);
                        return;
                    }
                    const selectedAdminId = await client.sendInteractionSelectMenu(interaction, 'select-admin', 'Select Admin', adminList, 'Select the admin to remove:');
                    if (selectedAdminId) {
                        await global.mysqlRequest(game_server.game_connection, "DELETE FROM admins WHERE player_id = ?", [selectedAdminId]);
                        await client.ephemeralEmbed({
                            title: 'Request',
                            desc: 'Admin removed successfully!',
                            color: '#669917'
                        }, interaction);
                    }
                } break;

                case 'update': {
                    const adminList = await getAdminOptions(client, game_server.game_connection);
                    if (adminList.length === 0) {
                        await client.ephemeralEmbed({
                            title: 'Request',
                            desc: 'No admins found to update',
                            color: '#c70058'
                        }, interaction);
                        return;
                    }
                    const selectedAdminId = await client.sendInteractionSelectMenu(interaction, 'select-admin', 'Select Admin', adminList, 'Select the admin to update:');
                    if (selectedAdminId) {
                        const askRankOptions = [{ label: 'Update', value: 'update' }, { label: 'Skip', value: 'skip' }]
                        const seelectRank = await client.sendInteractionSelectMenu(interaction, 'select-rank', 'Update Rank', askRankOptions, 'Would you like to update rank to this admin?');
                        if (seelectRank === 'update') {
                            const rankOptions = await getRankOptions(client, game_server.game_connection);
                            const selectedRankId = await client.sendInteractionSelectMenu(interaction, 'select-rank', 'Select Rank', rankOptions, 'Select the new rank to assign:');
                            if (selectedRankId) {
                                await global.mysqlRequest(game_server.game_connection, "UPDATE admins SET rank_id = ? WHERE player_id = ?", [selectedRankId, selectedAdminId]);
                            }
                        }
                        const titlesOptions = [{ label: 'Update', value: 'update' }, { label: 'Remove', value: 'remove' }, { label: 'Skip', value: 'skip' }]
                        const seelectTitles = await client.sendInteractionSelectMenu(interaction, 'select-titles', 'Update Titles', titlesOptions, 'Would you like to update extra titles to this admin?');
                        switch (seelectTitles) {
                            case 'update': {
                                const currentPlayer = await global.mysqlRequest(game_server.game_connection, "SELECT extra_titles_encoded FROM admins WHERE player_id = ?", [selectedAdminId]);
                                let extraTitles = currentPlayer[0].extra_titles_encoded ? JSON.parse(currentPlayer[0].extra_titles_encoded) : [];
                                const extraRankOptions = await getRankOptions(client, game_server.game_connection);
                                const availableOptions = extraRankOptions.filter(option => !extraTitles.includes(option.value));
                                const selectedExtraRanks = await client.sendInteractionSelectMenu(interaction, 'select-extra-ranks', 'Select Extra Titles', availableOptions, 'Select extra titles to assign:', true);
                                if (selectedExtraRanks && selectedExtraRanks.length > 0) {
                                    extraTitles = [...new Set([...extraTitles, ...selectedExtraRanks])];
                                    await global.mysqlRequest(game_server.game_connection, "UPDATE admins SET extra_titles_encoded = ? WHERE player_id = ?", [JSON.stringify(extraTitles), selectedAdminId]);
                                }
                            } break;
                        
                            case 'remove': {
                                const currentPlayer = await global.mysqlRequest(game_server.game_connection, "SELECT extra_titles_encoded FROM admins WHERE player_id = ?", [selectedAdminId]);
                                if (currentPlayer[0].extra_titles_encoded) {
                                    let extraTitles = JSON.parse(currentPlayer[0].extra_titles_encoded);
                                    const extraRankOptions = await getRankOptions(client, game_server.game_connection);
                                    const assignedOptions = extraRankOptions.filter(option => extraTitles.includes(option.value));
                                    const selectedExtraRanks = await client.sendInteractionSelectMenu(interaction, 'select-extra-ranks', 'Select Extra Titles', assignedOptions, 'Select extra titles to remove:', true);
                                    if (selectedExtraRanks && selectedExtraRanks.length > 0) {
                                        extraTitles = extraTitles.filter(title => !selectedExtraRanks.includes(title));
                                        await global.mysqlRequest(game_server.game_connection, "UPDATE admins SET extra_titles_encoded = ? WHERE player_id = ?", [JSON.stringify(extraTitles), selectedAdminId]);
                                    }
                                }
                            } break;
                        }
                        await client.ephemeralEmbed({
                            title: 'Request',
                            desc: 'Admin updated successfully!',
                            color: '#669917'
                        }, interaction);
                    }
                } break;
            }
        }
    };

    game_server.manageRanks = async function (interaction) {
        const actionOptions = [
            { label: 'Add Rank', value: 'add' },
            { label: 'Remove Rank', value: 'remove' },
            { label: 'Update Rank', value: 'update' }
        ];
        const selectedAction = await client.sendInteractionSelectMenu(interaction, 'select-action', 'Select action', actionOptions, 'Choose an action for rank management:');
        switch (selectedAction) {
            case 'add': {
                await interaction.followUp({ content: 'Enter the name of the new rank', ephemeral: true });
                const rankName = await client.collectUserInput(interaction);
                if (!rankName) return;
                await interaction.followUp({ content: 'Enter the text rights for this rank', ephemeral: true });
                const textRights = await client.collectUserInput(interaction);
                if (!textRights) return;
                await global.mysqlRequest(game_server.game_connection, "INSERT INTO admin_ranks (rank_name, text_rights) VALUES (?, ?)", [rankName, textRights]);
                await client.ephemeralEmbed({
                    title: 'Request',
                    desc: 'Rank ${rankName} added successfully!',
                    color: '#669917'
                }, interaction);
            } break;

            case 'remove': {
                const rankList = await getRankOptions(client, game_server.game_connection);
                if (rankList.length === 0) {
                    await client.ephemeralEmbed({
                        title: 'Request',
                        desc: 'No ranks found to remove',
                        color: '#c70058'
                    }, interaction);
                    return;
                }
                const selectedRankId = await client.sendInteractionSelectMenu(interaction, 'select-rank', 'Select Rank', rankList, 'Select the rank to remove:');
                if (selectedRankId) {
                    await global.mysqlRequest(game_server.game_connection, "DELETE FROM admin_ranks WHERE id = ?", [selectedRankId]);
                    const playersWithExtraTitles = await global.mysqlRequest(game_server.game_connection, "SELECT player_id, extra_titles_encoded FROM admins WHERE extra_titles_encoded LIKE ?", [`%${selectedRankId}%`]);
                    for (const admin of playersWithExtraTitles) {
                        let extraTitles = JSON.parse(admin.extra_titles_encoded);
                        extraTitles = extraTitles.filter(id => id !== selectedRankId);
                        const updatedExtraTitles = extraTitles.length > 0 ? JSON.stringify(extraTitles) : null;
                        await global.mysqlRequest(game_server.game_connection, "UPDATE admins SET extra_titles_encoded = ? WHERE player_id = ?", [updatedExtraTitles, admin.player_id]);
                    }
                    await client.ephemeralEmbed({
                        title: 'Request',
                        desc: 'Rank removed successfully!',
                        color: '#669917'
                    }, interaction);
                }
            } break;

            case 'update': {
                const rankList = await getRankOptions(client, game_server.game_connection);
                if (rankList.length === 0) {
                    await client.ephemeralEmbed({
                        title: 'Request',
                        desc: 'No ranks found to update',
                        color: '#c70058'
                    }, interaction);
                    return;
                }
                const selectedRankId = await client.sendInteractionSelectMenu(interaction, 'select-rank', 'Select Rank', rankList, 'Select the rank to update:');
                if (selectedRankId) {
                    const askRankOptions = [{ label: 'Update', value: 'update' }, { label: 'Skip', value: 'skip' }]
                    const seelectRank = await client.sendInteractionSelectMenu(interaction, 'select-name', 'Update Rank', askRankOptions, 'Would you like to update rank name?');
                    if (seelectRank === 'update') {
                        await interaction.followUp({ content: 'Enter the new name for the rank', ephemeral: true });
                        const newRankName = await client.collectUserInput(interaction);
                        if (!newRankName) return;
                        await global.mysqlRequest(game_server.game_connection, "UPDATE admin_ranks SET rank_name = ? WHERE id = ?", [newRankName, selectedRankId]);
                    }
                    await interaction.followUp({ content: 'Enter the text rights for this rank', ephemeral: true });
                    const newTextRights = await client.collectUserInput(interaction);
                    if (!newTextRights) return;
                    await global.mysqlRequest(game_server.game_connection, "UPDATE admin_ranks SET text_rights = ? WHERE id = ?", [newTextRights, selectedRankId]);
                    await client.ephemeralEmbed({
                        title: 'Request',
                        desc: 'Rank updated successfully!',
                        color: '#669917'
                    }, interaction);
                }
            } break;
        }
    };

    game_server.manageWhitelists = async function (interaction) {
        const actionOptions = [
            { label: 'Add Whitelists', value: 'add' },
            { label: 'Remove Whitelists', value: 'remove' }
        ];
        const acting_wls = {
            'WHITELIST_COMMANDER': 'CO',
            'WHITELIST_COMMANDER_COUNCIL': 'CO Council',
            'WHITELIST_COMMANDER_COUNCIL_LEGACY': 'CO Council Legacy',
            'WHITELIST_COMMANDER_COLONEL': 'Colonel',
            'WHITELIST_COMMANDER_LEADER': 'CO Leader',
            'WHITELIST_SYNTHETIC': 'Synthetic',
            'WHITELIST_SYNTHETIC_COUNCIL': 'Synthetic Council',
            'WHITELIST_SYNTHETIC_COUNCIL_LEGACY': 'Synthetic Council Legacy',
            'WHITELIST_SYNTHETIC_LEADER': 'Synthetic Leader',
            'WHITELIST_JOE': 'Joe',
            'WHITELIST_YAUTJA': 'Yautja',
            'WHITELIST_YAUTJA_LEGACY': 'Yautja Legacy',
            'WHITELIST_YAUTJA_COUNCIL': 'Yautja Council',
            'WHITELIST_YAUTJA_COUNCIL_LEGACY': 'Yautja Council Legacy',
            'WHITELIST_YAUTJA_LEADER': 'Yautja Leader'
        };
        const selectedAction = await client.sendInteractionSelectMenu(interaction, 'select-action', 'Select Action', actionOptions, 'Choose an action for admin role management:');
        switch (selectedAction) {
            case 'add': {
                await interaction.followUp({ content: 'Enter the ckey (or what it most likely) of the player to modify whitelist', ephemeral: true });
                const ckey = await client.collectUserInput(interaction);
                if (!ckey) return;
                const playerData = await global.mysqlRequest(game_server.game_connection, "SELECT id, ckey, whitelist_status FROM players WHERE ckey LIKE ?", [`%${ckey}%`]);
                if (!playerData.length) {
                    await client.ephemeralEmbed({
                        title: 'Request',
                        desc: 'No player found with that ckey',
                        color: '#c70058'
                    }, interaction);
                    return;
                }
                const playerOptions = playerData.map(player => ({
                    label: player.ckey,
                    value: player.id.toString()
                }));
                const selectedPlayerId = await client.sendInteractionSelectMenu(interaction, 'select-player', 'Select Player', playerOptions, 'Select the player for adding whitelists:');
                if (!selectedPlayerId) return;
                const player = playerData.find(p => p.id.toString() === selectedPlayerId);
                let currentRoles = player.whitelist_status ? player.whitelist_status.split('|') : [];
                const availableRoles = Object.entries(acting_wls).filter(([key]) => !currentRoles.includes(key)).map(([key, value]) => ({
                    label: value,
                    value: key
                }));
                if (availableRoles.length === 0) {
                    await client.ephemeralEmbed({
                        title: 'Request',
                        desc: 'No roles available to add. The player already has all possible roles',
                        color: '#c70058'
                    }, interaction);
                    return;
                }
                const selectedRoles = await client.sendInteractionSelectMenu(interaction, 'select-roles', 'Select Roles', availableRoles, 'Select the roles to add:', true);
                if (!selectedRoles) return;
                currentRoles = [...new Set([...currentRoles, ...selectedRoles])];
                await global.mysqlRequest(game_server.game_connection, "UPDATE players SET whitelist_status = ? WHERE id = ?", [currentRoles.join('|'), selectedPlayerId]);
                await client.ephemeralEmbed({
                    title: 'Request',
                    desc: 'Roles added successfully!',
                    color: '#669917'
                }, interaction);
            } break;

            case 'remove': {
                await interaction.followUp({ content: 'Enter the ckey (or what it most likely) of the player to remove whitelists from', ephemeral: true });
                const ckey = await client.collectUserInput(interaction);
                if (!ckey) return;
                const playerData = await global.mysqlRequest(game_server.game_connection, "SELECT id, ckey, whitelist_status FROM players WHERE ckey LIKE ?", [`%${ckey}%`]);
                if (!playerData.length) {
                    await client.ephemeralEmbed({
                        title: 'Request',
                        desc: 'No player found with that ckey',
                        color: '#c70058'
                    }, interaction);
                    return;
                }
                const playerOptions = playerData.map(player => ({
                    label: player.ckey,
                    value: player.id.toString()
                }));
                const selectedPlayerId = await client.sendInteractionSelectMenu(interaction, 'select-player', 'Select Player', playerOptions, 'Select the player for removing whitelists:');
                if (!selectedPlayerId) return;
                const player = playerData.find(p => p.id.toString() === selectedPlayerId);
                if (!player.whitelist_status) {
                    await client.ephemeralEmbed({
                        title: 'Request',
                        desc: 'This player has no roles to remove',
                        color: '#c70058'
                    }, interaction);
                    return;
                }
                let currentRoles = player.whitelist_status.split('|');
                const roleOptions = currentRoles.map(role => ({
                    label: acting_wls[role] || role,
                    value: role
                }));
                const selectedRoles = await client.sendInteractionSelectMenu(interaction, 'select-roles', 'Select Roles', roleOptions, 'Select the roles to remove:', true);
                if (!selectedRoles) return;
                selectedRoles.forEach(selectedRole => {
                    const index = currentRoles.indexOf(selectedRole);
                    if (index > -1) {
                        currentRoles.splice(index, 1);
                    }
                });
                await global.mysqlRequest(game_server.game_connection, "UPDATE players SET whitelist_status = ? WHERE id = ?", [currentRoles.join('|'), selectedPlayerId]);
                await client.ephemeralEmbed({
                    title: 'Request',
                    desc: 'Roles removed successfully!',
                    color: '#669917'
                }, interaction);
            } break;
        }
    };

    game_server.serverCustomOperators = async function () {
        await updateServerCustomOperators(client, game_server);
        game_server.update_custom_operatos_interval = setInterval(
            updateServerCustomOperators,
            60 * 60000, // Каждые N минут (первое число)
            client,
            game_server
        );
    };

    game_server.configureAutoStartMenu = async function (interaction) {
        if (!game_server.settings_data.auto_start_config) {
            game_server.settings_data.auto_start_config = new global.entity_construct['ServerSettings'](global.database, null, global.entity_meta['ServerSettings'])
            await game_server.settings_data.auto_start_config.sync()
        }
        const actionOptions = [
            { label: 'View Schedule', value: 'view' },
            { label: 'Set Mode', value: 'set_mode' },
            { label: 'Set Daily Times', value: 'set_daily_time' },
            { label: 'Remove Daily Times', value: 'remove_daily_time' },
            { label: 'Set Specific Days', value: 'set_specific_days' },
            { label: 'Remove Specific Days', value: 'remove_specific_days' }
        ];
        const selectedAction = await client.sendInteractionSelectMenu(interaction, 'select-auto-start', 'Select Action', actionOptions, 'Configure the automatic server start system:');
        const handlingOptions = {
            'view': viewSchedule,
            'set_mode': setMode,
            'set_daily_time': setDailyTimes,
            'remove_daily_time': removeDailyTimes,
            'set_specific_days': setSpecificDays,
            'remove_specific_days': removeSpecificDays
        };
        await handlingOptions[selectedAction](interaction, client, game_server, game_server.settings_data.auto_start_config.param);
    };

    game_server.tgsActions = async function (interaction) {
        const collected = await client.sendInteractionSelectMenu(interaction, 'select-action', 'Select action', client.handling_tgs, 'Please select action to perform:');
        if (collected) {
            await await client.handling_tgs_actions[collected](game_server.discord_server.settings_data.tgs_address.data.setting, game_server.data.tgs_id, interaction);
        }
    };

    game_server.handling_actions = {
        'manage_admins': game_server.manageAdmins,
        'manage_ranks': game_server.manageRanks,
        'manage_whitelists': game_server.manageWhitelists,
        'manage_autostart': game_server.configureAutoStartMenu,
        'manage_tgs': game_server.tgsActions,
//        'manage_battlepass_player': game_server.manageBattlepassPlayers,
//        'manage_battlepass_reward': game_server.manageBattlepassReward,
//        'manage_battlepass_server': game_server.manageBattlepassServer,
//        'player_by_ckey': game_server.managePlayer
    };

    game_server.handling_commands = [
        { label: 'Manage Admins', value: 'manage_admins' },
        { label: 'Manage Ranks', value: 'manage_ranks' },
        { label: 'Manage Whitelists', value: 'manage_whitelists' },
        { label: 'Manage Auto Start', value: 'manage_autostart' },
        { label: 'Manage TGS', value: 'manage_tgs' }
    ];

    const messageQueue = {};

    game_server.handledStatuses = {
        'ooc': addToQueue,
        'asay': addToQueue,
        'start': handleRoundStart,
        'predator': handlePredator,
        'ahelp':  handleAhelp,
        'add_time_ban': handleTimeBan,
        'remove_time_ban': handleTimeBan,
        'add_job_ban': handleJobBan,
        'remove_job_ban': handleJobBan,
        'add_perma_ban': handlePermaBan,
        'remove_perma_ban': handlePermaBan,
        'auto_unban': handleAutoUnban,
        'auto_unjobban': handleAutoUnjobban,
        'fax': handleFax,
        'login': handleLogin,
        'logout': handleLogout
    };

    async function addToQueue(channel, data) {
        if (!messageQueue[channel.id]) {
            messageQueue[channel.id] = [];
        }
        messageQueue[channel.id].push({ data });
    };

    async function handleRoundStart(channel) {
        if (await game_server.handle_status(true)) return;
        if (game_server.player_low_autoshutdown && game_server.server_status == true) {
            const server_response = await client.prepareByondAPIRequest({client: client, request: JSON.stringify({query: 'status', auth: 'anonymous', source: 'bot'}), port: game_server.data.port, address: game_server.data.ip});
            if (server_response && isJsonString(server_response)) {
                const response = JSON.parse(server_response);
                const data = response.data;
                if (data && data.players < game_server.player_low_autoshutdown) {
                    game_server.handle_status(false);
                    const instance = await client.tgs_getInstance(game_server.data.tgs_id);
                    if (instance) client.tgs_stop(game_server.discord_server.settings_data.tgs_address.data.setting, game_server.data.tgs_id);
                    return;
                }
            }

        const role = channel.guild.roles.cache.find(role => role.name === 'Round Alert');
        await client.sendEmbed({embeds: [new Discord.EmbedBuilder().setTitle('NEW ROUND!').setDescription(' ').setColor(role.hexColor)], content: `<@&${role.id}>`}, channel);
        }
    };

    async function handlePredator(channel) {
        const role = channel.guild.roles.cache.find(role => role.name === 'Predator gamer');
        await client.sendEmbed({embeds: [new Discord.EmbedBuilder().setTitle('PREDATOR ROUND!').setDescription(' ').setColor(role.hexColor)], content: `<@&${role.id}>`}, channel);
    };

    async function handleAhelp(channel, data) {
        const embed = {
            title: data.embed.title,
            desc: data.embed.desc,
            footer: data.embed.footer,
            content: data.embed.content,
            url: data.embed.url,
            color: '#5a2944'
        };
        if (data.embed && data.embed.fields.lenght) embed[fields] = data.embed.fields;
        await client.embed(embed, channel);
    };

    async function handleTimeBan(channel, data) {
        const player = await fetchPlayerById(data.ref_player_id, game_server.game_connection);
        let adding_ban = data.state === 'add_time_ban';
        let start_time;
        if (adding_ban) {
            const now_date = new Date(player.time_ban_expiration * 1000);
            start_time = new Date(Date.UTC(now_date.getUTCFullYear(), now_date.getUTCMonth(), now_date.getUTCDate(), now_date.getUTCHours(), now_date.getUTCMinutes(), 0));
        }
        const embed = {
            title: `Time Ban ${adding_ban ? 'Added' : 'Removed'}`,
            desc: `Player: ${player.ckey}\nReason: ${player.time_ban_reason}${start_time ? `\nExpiration: <t:${Math.floor(start_time.getTime() / 1000)}:t>` : ''}`,
            color: adding_ban ? '#ff0000' : '#00ff00'
        };
        await client.embed(embed, channel);
    };

    async function handleJobBan(channel, data) {
        const player = await fetchPlayerById(data.ref_player_id, game_server.game_connection);
        const jobBan = await fetchJobBanByPlayerId(data.ref_player_id, game_server.game_connection);
        if (!jobBan) return;
        let adding_ban = data.state === 'add_job_ban';
        let start_time;
        if (adding_ban) {
            const now_date = new Date(jobBan.expiration * 1000);
            start_time = new Date(Date.UTC(now_date.getUTCFullYear(), now_date.getUTCMonth(), now_date.getUTCDate(), now_date.getUTCHours(), now_date.getUTCMinutes(), 0));
        }
        const embed = {
            title: `Job Ban ${adding_ban ? 'Added' : 'Removed'}`,
            desc: `Player: ${player.ckey}\nRole: ${jobBan.role}\nReason: ${jobBan.text}${start_time ? `\nExpiration: <t:${Math.floor(start_time.getTime() / 1000)}:t>` : ''}`,
            color: adding_ban ? '#ff0000' : '#00ff00'
        };
        await client.embed(embed, channel);
    };

    async function handlePermaBan(channel, data) {
        const player = await fetchPlayerById(data.ref_player_id, game_server.game_connection);
        let adding_ban = data.state === 'add_perma_ban';
        const embed = {
            title: `Perma Ban ${adding_ban ? 'Added' : 'Removed'}`,
            desc: `Player: ${player.ckey}\nReason: ${player.permaban_reason}`,
            color: adding_ban ? '#ff0000' : '#00ff00'
        };
        await client.embed(embed, channel);
    };

    async function handleAutoUnban(channel, data) {
        const player = await fetchPlayerById(data.ref_player_id, game_server.game_connection);
        const embed = {
            title: 'Auto Unban',
            desc: `Player: ${player.ckey} has been automatically unbanned.`,
            color: '#00ff00'
        };
        await client.embed(embed, channel);
    };

    async function handleAutoUnjobban(channel, data) {
        const player = await fetchPlayerById(data.ref_player_id, game_server.game_connection);
        const embed = {
            title: 'Auto Unjobban',
            desc: `Player: ${player.ckey} has been automatically unjobbanned.`,
            color: '#00ff00'
        };
        await client.embed(embed, channel);
    };

    async function handleFax(channel, data) {
        const embed = {
            title: `Fax from ${data.sender_name}`,
            desc: `Department: ${data.departament}\nMessage: ${data.message}\nAdmins: ${data.admins}`,
            color: '#3498db'
        };
        await client.embed(embed, channel);
    };

    async function handleLogin(channel, data) {
        await client.sendEmbed({embeds: [new Discord.EmbedBuilder().setTitle(' ').setDescription(`Admin Login: ${data.key}`).setColor('#2ecc71')]}, channel);
    };

    async function handleLogout(channel, data) {
        await client.sendEmbed({embeds: [new Discord.EmbedBuilder().setTitle(' ').setDescription(`Admin Logout: ${data.key}`).setColor('#e74c3c')]}, channel);
    };

    async function fetchPlayerById(playerId, database) {
        const players = await global.mysqlRequest(database, "SELECT * FROM players WHERE id = ?", [playerId]);
        return players.length ? players[0] : null;
    };

    async function fetchJobBanByPlayerId(playerId, database) {
        const jobBans = await global.mysqlRequest(database, "SELECT * FROM player_job_bans WHERE player_id = ?", [playerId]);
        return jobBans.length ? jobBans[0] : null;
    };

    async function handleOOC(channel, data, combine = false) {
        const messageContent = data.message
            .replace(/<@&(\d+)>/g, ' ')
            .replace(/<@!?(\d+)>/g, ' ')
            .replace(/https?:\/\/\S+/g, ' ')
            .replace(/@everyone/g, ' ')
            .replace(/@here/g, ' ');
        const embed = new Discord.EmbedBuilder()
            .setTitle(' ')
            .setDescription(`OOC: ${data.author}: ${messageContent}`)
            .setColor('#7289da');
        if (combine) {
            return embed;
        } else {
            await client.sendEmbed({ embeds: [embed] }, channel);
        }
    };

    async function handleAsay(channel, data, combine = false) {
        const messageContent = data.message
            .replace(/<@&(\d+)>/g, ' ')
            .replace(/<@!?(\d+)>/g, ' ')
            .replace(/https?:\/\/\S+/g, ' ')
            .replace(/@everyone/g, ' ')
            .replace(/@here/g, ' ');
        const embed = new Discord.EmbedBuilder()
            .setTitle(' ')
            .setDescription(`Asay: ${data.author}: ${messageContent} (${data.rank})`)
            .setColor('#7289da');
        if (combine || !channel) {
            return embed;
        } else {
            await client.sendEmbed({ embeds: [embed] }, channel);
        }
    };

    setInterval(async () => {
        for (const channelId in messageQueue) {
            const messages = messageQueue[channelId];
            const messagesToSend = [];
            while (messages.length > 0) {
                const { data } = messages.shift();
                let embed;
                switch (data.state) {
                    case 'ooc': {
                        embed = await handleOOC(null, data, true);
                    } break;
                    case 'asay': {
                        embed = await handleAsay(null, data, true);
                    } break;
                    default: {
                        console.log(`CM >> [ERROR] >> Something went wrong, not found: ${data.state}, for server: ${game_server.data.server_name}`);
                    } break;
                }
                if (messagesToSend.length < 5 && embed) {
                    messagesToSend.push(embed);
                } else {
                    messages.unshift({ data });
                    break;
                }
            }
            if (messagesToSend.length > 0) {
                await client.sendEmbed({ embeds: messagesToSend }, await client.channels.fetch(channelId));
            }
            if (messages.length === 0) {
                delete messageQueue[channelId];
            }
        }
    }, 2000);

    game_server.handle_status = async function (new_status) {
        if (game_server.server_status == new_status) return false;
        game_server.settings_data.server_status.param = new_status;
        if (game_server.server_status) {
            const status = await global.mysqlRequest(global.database, "SELECT channel_id, message_id FROM server_channels WHERE server = ? AND type = 'round'", [game_server.id]);
            const channel = await client.channels.fetch(status[0].channel_id);
            if (channel) {
                const role = channel.guild.roles.cache.find(role => role.name === 'Round Alert');
                const now_date = new Date();
                const start_time = new Date(Date.UTC(now_date.getUTCFullYear(), now_date.getUTCMonth(), now_date.getUTCDate(), now_date.getUTCHours(), now_date.getUTCMinutes(), 0));
                await client.sendEmbed({ embeds: [new Discord.EmbedBuilder().setTitle(' ').setDescription(`Запуск!\nРаунд начнётся в <t:${Math.floor(start_time.getTime() / 1000 + 30 * 60000)}:t>`).setColor('#669917')], content: `<@&${role.id}>`}, channel);
            }
        } else {
            const status = await global.mysqlRequest(global.database, "SELECT channel_id, message_id FROM server_channels WHERE server = ? AND type = 'round'", [game_server.id]);
            const channel = await client.channels.fetch(status[0].channel_id);
            if (channel) {
                await client.sendEmbed({ embeds: [new Discord.EmbedBuilder().setTitle(' ').setDescription(`Сервер выключен!\nИнформацию по следующему запуску смотрите в расписание`).setColor('#669917')], content: ` `}, channel);
            }
        }
        return true;
    };
};


async function getAdminOptions(client, database_connection) {
    const admins = await global.mysqlRequest(database_connection, "SELECT a.player_id, p.ckey FROM admins a JOIN players p ON a.player_id = p.id");

    return admins.map(admin => ({
        label: admin.ckey,
        value: admin.player_id.toString()
    }));
};

async function getRankOptions(client, database_connection) {
    const ranks = await global.mysqlRequest(database_connection, "SELECT id, rank_name FROM admin_ranks");

    return ranks.map(rank => ({
        label: rank.rank_name,
        value: rank.id.toString()
    }));
};


async function updateServerCustomOperators(client, game_server) {
    if (!game_server.settings_data.auto_start_config) {
        return;
    }

    const server_schedule_data = game_server.settings_data.auto_start_config.param;
    if (game_server.update_custom_operators_data['intervals']['autostart']) {
        clearTimeout(game_server.update_custom_operators_data['intervals']['autostart']);
    }

    const now_date = new Date();
    const now_utc = new Date(now_date.getTime() - now_date.getTimezoneOffset() * 60000);
    const now_utc_string = now_utc.toISOString().split('T')[0];
    if (server_schedule_data.specific_days) {
        server_schedule_data.specific_days = server_schedule_data.specific_days.filter(date => date >= now_utc_string);
    }
    if (server_schedule_data.mode === 'daily') {
        const kill_numbers = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const start_time_utc = server_schedule_data.daily[kill_numbers[now_date.getUTCDay()]];
        if (start_time_utc) {
            const [hours, minutes] = start_time_utc.split(':').map(Number);
            const start_date_utc = new Date(now_date.getUTCFullYear(), now_date.getUTCMonth(), now_date.getUTCDate(), hours, minutes, 0);
            if (start_date_utc > now_utc) {
                const time_remaining = start_date_utc - now_utc;
                game_server.update_custom_operators_data['intervals']['autostart'] = setTimeout(async () => {
                    await autoStartServer(client, game_server);
                }, time_remaining);
            }
        }
    }
    if (server_schedule_data.mode === 'specific_days' && server_schedule_data.specific_days) {
        if (server_schedule_data.specific_days.includes(now_utc_string)) {
            const [hours, minutes] = server_schedule_data.time.split(':').map(Number);
            const start_date_utc = new Date(now_date.getUTCFullYear(), now_date.getUTCMonth(), now_date.getUTCDate(), hours, minutes, 0);
            if (start_date_utc > now_utc) {
                const time_remaining = start_date_utc - now_utc;
                game_server.update_custom_operators_data['intervals']['autostart'] = setTimeout(async () => {
                    await autoStartServer(client, game_server);
                }, time_remaining);
            }
        }
    }
};


async function autoStartServer(client, game_server) {
    if(game_server.server_status) return;
    const instance = await client.tgs_getInstance(game_server.data.tgs_id);
    if(!instance) return;
    client.tgs_start(game_server.discord_server.settings_data.tgs_address.data.setting, game_server.data.tgs_id)
};


async function viewSchedule(interaction, client, game_server, server_schedule_data) {
    const schedule = await getSchedule(server_schedule_data);
    if (schedule) {
        await client.ephemeralEmbed({
            title: 'Request',
            desc: schedule,
            color: '#669917'
        }, interaction);
    } else {
        await client.ephemeralEmbed({
            title: 'Request',
            desc: 'An error occurred while retrieving the schedule.',
            color: '#c70058'
        }, interaction);
    }
};

async function getSchedule(server_schedule_data) {
    try {
        const now = new Date();
        let schedule = ' ';
        if (server_schedule_data.daily) {
            schedule += '**Daily Schedule:**\n';
            for (const [day, time] of Object.entries(server_schedule_data.daily)) {
                const [hours, minutes] = time.split(':').map(Number);
                const start_time = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hours, minutes, 0));
                schedule += `- ${day}: <t:${Math.floor(start_time.getTime() / 1000)}:t>\n`;
            }
        }
        if (server_schedule_data.spec) {
            schedule += '\n**Specific Dates:**\n';
            for (const [date, time] of Object.entries(server_schedule_data.spec)) {
                const [hours, minutes] = time.split(':').map(Number);
                const [year, month, day] = date.split('-').map(Number);
                const start_time = new Date(Date.UTC(year, month, day, hours, minutes, 0));
                schedule += `- ${date}: <t:${Math.floor(start_time.getTime() / 1000)}:t>\n`;
            }
        }
        if (!server_schedule_data.daily && !server_schedule_data.spec) {
            schedule += 'No scheduled times available.';
        }
        return schedule;
    } catch (error) {
        return;
    }
};

async function setMode(interaction, client, game_server, server_schedule_data) {
    const modeOptions = [
        { label: 'Daily', value: 'daily' },
        { label: 'Specific Days', value: 'weekly' },
        { label: 'OFF', value: 'off' }
    ];
    const selectedMode = await client.sendInteractionSelectMenu(interaction, 'select-mode', 'Select mode', modeOptions, 'Choose a mode for server auto-start:');
    server_schedule_data.mode = selectedMode;
    await client.ephemeralEmbed({
        title: 'Request',
        desc: `Mode set to ${selectedMode} for server ${game_server.data.server_name}`,
        color: '#669917'
    }, interaction);
};

async function setDailyTimes(interaction, client, game_server, server_schedule_data) {
    const dayOptions = [
        { label: 'Monday', value: 'monday' },
        { label: 'Tuesday', value: 'tuesday' },
        { label: 'Wednesday', value: 'wednesday' },
        { label: 'Thursday', value: 'thursday' },
        { label: 'Friday', value: 'friday' },
        { label: 'Saturday', value: 'saturday' },
        { label: 'Sunday', value: 'sunday' }
    ];
    const selectedDay = await client.sendInteractionSelectMenu(interaction, 'select-day', 'Select day', dayOptions, 'Choose a day for setting up auto-start time:');
    await interaction.followUp({ content: 'Please enter the time for auto-start in hh:mm (UTC+0) format', ephemeral: true });
    const timeInput = await client.collectUserInput(interaction);
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(timeInput)) {
        await client.ephemeralEmbed({
            title: 'Request',
            desc: 'Invalid time format. Please use hh:mm format',
            color: '#c70058'
        }, interaction);
        return;
    }
    server_schedule_data.daily = server_schedule_data.daily || {};
    server_schedule_data.daily[selectedDay] = timeInpu
    await client.ephemeralEmbed({
        title: 'Request',
        desc: `Time set to ${timeInput} for ${selectedDay} on server ${game_server.data.server_name}`,
        color: '#669917'
    }, interaction);
};

async function removeDailyTimes(interaction, client, game_server, server_schedule_data) {
    if (!server_schedule_data.daily || Object.keys(server_schedule_data.daily).length === 0) {
        await client.ephemeralEmbed({
            title: 'Request',
            desc: `No daily start times are set for server ${game_server.data.server_name}`,
            color: '#c70058'
        }, interaction);
        return;
    }
    const dayOptions = Object.keys(server_schedule_data.daily).map(day => ({
        label: day,
        value: day
    }));
    if (!dayOptions.length) {
        await client.ephemeralEmbed({
            title: 'Request',
            desc: `No days are available for removal from daily start schedule for server ${game_server.data.server_name}`,
            color: '#c70058'
        }, interaction);
        return;
    }
    const selectedDay = await client.sendInteractionSelectMenu(interaction, 'select-day', 'Select a day to remove from daily start schedule', dayOptions, 'Choose a day to remove:');
    delete server_schedule_data.daily[selectedDay];
    await client.ephemeralEmbed({
        title: 'Request',
        desc: `Removed daily start time for ${selectedDay} on server ${game_server.data.server_name}`,
        color: '#669917'
    }, interaction);
};

async function setSpecificDays(interaction, client, game_server, server_schedule_data) {
    let moreDays = true;
    const specificTimes = {};
    while (moreDays) {
        await interaction.followUp({ content: 'Please enter a date for specific start in YYYY-MM-DD format (1984-01-01) or type "done" to finish', ephemeral: true });
        const dateInput = await client.collectUserInput(interaction);
        if (dateInput.toLowerCase() === 'done') {
            moreDays = false;
        } else {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(dateInput)) {
                await client.ephemeralEmbed({
                    title: 'Request',
                    desc: 'Invalid date format. Please use YYYY-MM-DD format',
                    color: '#c70058'
                }, interaction);
                return;
            }
            await interaction.followUp({ content: 'Please enter the time for auto-start in hh:mm (UTC+0) format', ephemeral: true });
            const timeInput = await client.collectUserInput(interaction);
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
            if (!timeRegex.test(timeInput)) {
                await client.ephemeralEmbed({
                    title: 'Request',
                    desc: 'Invalid time format. Please use hh:mm format',
                    color: '#c70058'
                }, interaction);
                return;
            }
            specificTimes[dateInput] = timeInput;
        }
    }
    server_schedule_data.spec = server_schedule_data.spec || {};
    Object.keys(specificTimes).forEach(date => {
        server_schedule_data.spec[date] = specificTimes[date];
    });
    await client.ephemeralEmbed({
        title: 'Request',
        desc: `Specific start days set for server ${game_server.data.server_name}`,
        color: '#669917'
    }, interaction);
};

async function removeSpecificDays(interaction, client, game_server, server_schedule_data) {
    const now = new Date().toISOString().split('T')[0];
    if (!server_schedule_data.spec || Object.keys(server_schedule_data.spec).length === 0) {
        await client.ephemeralEmbed({
            title: 'Request',
            desc: `No specific dates are set for server ${game_server.data.server_name}`,
            color: '#c70058'
        }, interaction);
        return;
    }
    const specificDayOptions = Object.keys(server_schedule_data.spec)
        .filter(date => date >= now)
        .map(date => ({ label: date, value: date }));
    if (!specificDayOptions.length) {
        await client.ephemeralEmbed({
            title: 'Request',
            desc: `All specific dates have passed for server ${game_server.data.server_name}`,
            color: '#c70058'
        }, interaction);
        return;
    }
    const selectedDates = await client.sendInteractionSelectMenu(interaction, 'select-date', 'Select a date to remove', specificDayOptions, 'Choose a specific date to remove:', true);
    selectedDates.forEach(selectedDate => {
        delete server_schedule_data.spec[selectedDate];
    });
    await client.ephemeralEmbed({
        title: 'Request',
        desc: `Removed specific start dates for server ${game_server.data.server_name}`,
        color: '#669917'
    }, interaction);
};


function isJsonString(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}
