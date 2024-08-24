const Discord = require('discord.js');

module.exports = (client, game_server) => {
    game_server.updateStatusMessage = async function (type) {
        try {
            const server_response = await client.prepareByondAPIRequest({client: client, request: JSON.stringify({query: "status", auth: "anonymous", source: "bot"}), port: game_server.port, address: game_server.ip});
            if (!server_response) {
                for (const message of game_server.updater_messages[type]) {
                    await client.embed({
                        title: ` `,
                        desc: `# SERVER OFFLINE`,
                        content: `${game_server.server_name} Status`,
                        color: `#a00f0f`,
                        type: 'edit'
                    }, message);
                }
                return;
            };
            const response = JSON.parse(server_response);
            const data = response.data;
            const time = Math.floor(data.round_duration / 600);
            let fields = [];
            fields.push({ name: `**Round Name**`, value: data.round_name});
            fields.push({ name: `**Round ID**`, value: data.round_id});
            fields.push({ name: `**Map**`, value: data.map_name});
            if (data.next_map_name) fields.push({ name: `**Next Map**`, value: data.next_map_name});
            fields.push({ name: `**Ship Map**`, value: data.ship_map_name});
            if (data.next_map_name) fields.push({ name: `***Next Ship Map**`, value: data.next_ship_map_name});
            fields.push({ name: `**Total Players**`, value: data.players});
            fields.push({ name: `**Gamemode**`, value: data.mode});
            fields.push({ name: `**Round Time**`, value: `${Math.floor(time / 60)}:` + `${time % 60}`.padStart(2, '0')});
            if (data.round_end_state) fields.push({ name: `**ouned End State**`, value: data.round_end_state});
            for (const message of game_server.updater_messages[type]) {
                await client.sendEmbed({
                    embeds: [new Discord.EmbedBuilder().setTitle(` `).addFields(fields).setColor('#669917')],
                    content: `${game_server.server_name} Status`,
                    components: [],
                    type: `edit`
                }, message);
            }
        } catch (error) {
            for (const message of game_server.updater_messages[type]) {
                await client.embed({
                    title: ` `,
                    desc: `# SERVER OFFLINE`,
                    content: `${game_server.server_name} Status`,
                    color: `#a00f0f`,
                    type: 'edit'
                }, message);
            }
        }
    };

    game_server.updateAdminsMessage = async function (type) {
        try {
            const db_request_admin = await client.databaseRequest(game_server.game_connection, "SELECT player_id, rank_id, extra_titles_encoded FROM admins", []);
            const player_ids = db_request_admin.map(admin => admin.player_id);
            const db_request_profiles = await client.databaseRequest(game_server.game_connection, `SELECT id, ckey, last_login FROM players WHERE id IN (${player_ids.join(',')})`, []);
            const profileMap = new Map();
            db_request_profiles.forEach(profile => {
                profileMap.set(profile.id, profile);
            });
            const db_request_ranks = await client.databaseRequest(game_server.game_connection, "SELECT id, rank_name, text_rights FROM admin_ranks", []);
            const roleMap = new Map();
            db_request_ranks.forEach(row => {
                roleMap.set(row.id, row.rank_name);
            });
            let description = ``;
            for (const db_admin of db_request_admin) {
                const profile = profileMap.get(db_admin.player_id);
                if (!profile) continue;
                let extra_ranks = [];
                if (db_admin.extra_titles_encoded) {
                    extra_ranks = JSON.parse(db_admin.extra_titles_encoded).map(rank_id => roleMap.get(parseInt(rank_id)));
                }
                description += `**Ckey:** ${`${profile.ckey}`.padEnd(30, "\u00A0")}`;
                description += `[Last Login ${profile.last_login}]\n`;
                if (extra_ranks.length) {
                    description += `**Rank:** ${`${roleMap.get(db_admin.rank_id)}`.padEnd(30, "\u00A0")}[Extra Ranks ${extra_ranks.join(' & ')}]`;
                } else {
                    description += `**Rank:** ${roleMap.get(db_admin.rank_id)}`;
                }
                description += `\n\n`;
            }
            for (const message of game_server.updater_messages[type]) {
                await client.sendEmbed({
                    embeds: [new Discord.EmbedBuilder().setTitle(` `).setDescription(description).setColor('#669917')],
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

    game_server.updateRanksMessage = async function (type) {
        try {
            const db_request = await client.databaseRequest(game_server.game_connection, "SELECT id, rank_name, text_rights FROM admin_ranks", []);
            const embeds = [];
            let description = ``;
            for (const db_rank of db_request) {
                const rank_fields = db_rank.text_rights.split('|');
                description += `**${db_rank.rank_name}**\n`;
                description += `${rank_fields.join(' & ')}\n\n`;
            }
            embeds.push(new Discord.EmbedBuilder().setTitle(` `).setDescription(description).setColor('#669917'));
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

    game_server.updateWhitelistsMessage = async function (type) {
        try {
            const db_request = await client.databaseRequest(game_server.game_connection, "SELECT id, ckey, whitelist_status FROM players WHERE whitelist_status != \"\"", []);
            const acting_wls = {
                "Commander": ["WHITELIST_COMMANDER", "WHITELIST_COMMANDER_COUNCIL", "WHITELIST_COMMANDER_COUNCIL_LEGACY", "WHITELIST_COMMANDER_COLONEL", "WHITELIST_COMMANDER_LEADER"],
                "Synthetic": ["WHITELIST_SYNTHETIC", "WHITELIST_SYNTHETIC_COUNCIL", "WHITELIST_SYNTHETIC_COUNCIL_LEGACY", "WHITELIST_SYNTHETIC_LEADER", "WHITELIST_JOE"],
                "Yautja": ["WHITELIST_YAUTJA", "WHITELIST_YAUTJA_LEGACY", "WHITELIST_YAUTJA_COUNCIL", "WHITELIST_YAUTJA_COUNCIL_LEGACY", "WHITELIST_YAUTJA_LEADER"]
            };
            const replacements = {
                "Commander": { "WHITELIST_COMMANDER": "CO", "WHITELIST_COMMANDER_COUNCIL": "CO Council", "WHITELIST_COMMANDER_COUNCIL_LEGACY": "CO Council Legacy", "WHITELIST_COMMANDER_COLONEL": "Colonel", "WHITELIST_COMMANDER_LEADER": "CO Leader" },
                "Synthetic": { "WHITELIST_SYNTHETIC": "Synthetic", "WHITELIST_SYNTHETIC_COUNCIL": "Synthetic Council", "WHITELIST_SYNTHETIC_COUNCIL_LEGACY": "Synthetic Council Legacy", "WHITELIST_SYNTHETIC_LEADER": "Synthetic Leader", "WHITELIST_JOE": "Joe" },
                "Yautja": { "WHITELIST_YAUTJA": "Yautja", "WHITELIST_YAUTJA_LEGACY": "Yautja Legacy", "WHITELIST_YAUTJA_COUNCIL": "Yautja Council", "WHITELIST_YAUTJA_COUNCIL_LEGACY": "Yautja Council Legacy", "WHITELIST_YAUTJA_LEADER": "Yautja Leader" }
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
                if (fields.length) embeds.push(new Discord.EmbedBuilder().setTitle(` `).addFields(fields).setColor('#669917'));
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
        "status": game_server.updateStatusMessage,
        "admin": game_server.updateAdminsMessage,
        "rank": game_server.updateRanksMessage,
        "whitelist": game_server.updateWhitelistsMessage
    };


    game_server.infoRequest = async function ({
        request: request
    }, interaction) {
        let rank_info = ``;
        if (request[0].role_rank) {
            const db_role = await client.databaseRequest(game_server.game_connection, "SELECT rank_name FROM discord_ranks WHERE rank_id = ?", [request[0].role_rank]);
            let db_stable_role;
            if (request[0].stable_rank != request[0].role_rank) {
                db_stable_role = await client.databaseRequest(game_server.game_connection, "SELECT rank_name FROM discord_ranks WHERE rank_id = ?", [request[0].stable_rank]);
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
        const db_player_profile = await client.databaseRequest(game_server.game_connection, "SELECT id, ckey, last_login, is_permabanned, permaban_reason, permaban_date, permaban_admin_id, is_time_banned, time_ban_reason, time_ban_expiration, time_ban_admin_id, time_ban_date FROM players WHERE id = ?", [request[0].player_id]);
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
        const db_player_playtime = await client.databaseRequest(game_server.game_connection, "SELECT role_id, total_minutes FROM player_playtime WHERE player_id = ?", [db_player_profile[0].id]);
        let player_playtime = 0;
        for (const playtime of db_player_playtime) {
            player_playtime += playtime.total_minutes;
        }
        const db_request_admin = await client.databaseRequest(game_server.game_connection, "SELECT rank_id, extra_titles_encoded FROM admins WHERE player_id = ?", [db_player_profile[0].id]);
        if (db_request_admin[0]) {
            const db_request_ranks = await client.databaseRequest(game_server.game_connection, "SELECT id, rank_name, text_rights FROM admin_ranks", []);
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
                    await interaction.followUp({ content: 'Enter the ckey (or what it most likely) of the player to add as admin:', ephemeral: true });
                    const ckey = await client.collectUserInput(interaction);
                    if (!ckey) return;
                    const playerData = await client.databaseRequest(game_server.game_connection, "SELECT id, ckey FROM players WHERE ckey LIKE ?", [`%${ckey}%`]);
                    if (!playerData.length) {
                        await interaction.followUp({ content: 'No player found with that ckey.', ephemeral: true });
                        return;
                    }
                    const playerOptions = playerData.map(player => ({
                        label: player.ckey,
                        value: player.id.toString()
                    }));
                    const selectedPlayerId = await client.sendInteractionSelectMenu(interaction, `select-player`, 'Select Player', playerOptions, 'Select the player to add as admin:');
                    if (selectedPlayerId) {
                        const rankOptions = await getRankOptions(client, game_server.game_connection);
                        const selectedRankId = await client.sendInteractionSelectMenu(interaction, `select-rank`, 'Select Rank', rankOptions, 'Select the rank to assign:');
                        if (selectedRankId) {
                            await client.databaseRequest(game_server.game_connection, "INSERT INTO admins (player_id, rank_id) VALUES (?, ?)", [selectedPlayerId, selectedRankId]);
                            const titlesOptions = [{ label: 'Set Up', value: 'set' }, { label: 'Skip', value: 'skip' }]
                            const seelectTitles = await client.sendInteractionSelectMenu(interaction, `select-titles`, 'Set Titles', titlesOptions, 'Would you like to assign extra titles to this admin?');
                            if (seelectTitles === 'set') {
                                const extraRankOptions = await getRankOptions(client, game_server.game_connection);
                                const selectedExtraRanks = await client.sendInteractionSelectMenu(interaction, `select-extra-ranks`, 'Select Extra Titles', extraRankOptions, 'Select extra titles to assign:', true);
                                if (selectedExtraRanks && selectedExtraRanks.length > 0) {
                                    await client.databaseRequest(game_server.game_connection, "UPDATE admins SET extra_titles_encoded = ? WHERE player_id = ?", [JSON.stringify(selectedExtraRanks), selectedPlayerId]);
                                }
                            }
                            await client.ephemeralEmbed({
                                title: `Request`,
                                desc: `Admin added successfully!`,
                                color: `#669917`
                            }, interaction);
                        }
                    }
                } break;

                case 'remove': {
                    const adminList = await getAdminOptions(client, game_server.game_connection);
                    if (adminList.length === 0) {
                        await client.ephemeralEmbed({
                            title: `Request`,
                            desc: `No admins found to remove.`,
                            color: `#c70058`
                        }, interaction);
                        return;
                    }
                    const selectedAdminId = await client.sendInteractionSelectMenu(interaction, `select-admin`, 'Select Admin', adminList, 'Select the admin to remove:');
                    if (selectedAdminId) {
                        await client.databaseRequest(game_server.game_connection, "DELETE FROM admins WHERE player_id = ?", [selectedAdminId]);
                        await client.ephemeralEmbed({
                            title: `Request`,
                            desc: `Admin removed successfully!`,
                            color: `#669917`
                        }, interaction);
                    }
                } break;

                case 'update': {
                    const adminList = await getAdminOptions(client, game_server.game_connection);
                    if (adminList.length === 0) {
                        await client.ephemeralEmbed({
                            title: `Request`,
                            desc: `No admins found to update.`,
                            color: `#c70058`
                        }, interaction);
                        return;
                    }
                    const selectedAdminId = await client.sendInteractionSelectMenu(interaction, `select-admin`, 'Select Admin', adminList, 'Select the admin to update:');
                    if (selectedAdminId) {
                        const askRankOptions = [{ label: 'Update', value: 'update' }, { label: 'Skip', value: 'skip' }]
                        const seelectRank = await client.sendInteractionSelectMenu(interaction, `select-rank`, 'Update Rank', askRankOptions, 'Would you like to update rank to this admin?');
                        if (seelectRank === 'update') {
                            const rankOptions = await getRankOptions(client, game_server.game_connection);
                            const selectedRankId = await client.sendInteractionSelectMenu(interaction, `select-rank`, 'Select Rank', rankOptions, 'Select the new rank to assign:');
                            if (selectedRankId) {
                                await client.databaseRequest(game_server.game_connection, "UPDATE admins SET rank_id = ? WHERE player_id = ?", [selectedRankId, selectedAdminId]);
                            }
                        }
                        const titlesOptions = [{ label: 'Update', value: 'update' }, { label: 'Remove', value: 'remove' }, { label: 'Skip', value: 'skip' }]
                        const seelectTitles = await client.sendInteractionSelectMenu(interaction, `select-titles`, 'Update Titles', titlesOptions, 'Would you like to update extra titles to this admin?');
                        switch (seelectTitles) {
                            case 'update': {
                                const currentPlayer = await client.databaseRequest(game_server.game_connection, "SELECT extra_titles_encoded FROM admins WHERE player_id = ?", [selectedAdminId]);
                                let extraTitles = currentPlayer[0].extra_titles_encoded ? JSON.parse(currentPlayer[0].extra_titles_encoded) : [];
                                const extraRankOptions = await getRankOptions(client, game_server.game_connection);
                                const availableOptions = extraRankOptions.filter(option => !extraTitles.includes(option.value));
                                const selectedExtraRanks = await client.sendInteractionSelectMenu(interaction, `select-extra-ranks`, 'Select Extra Titles', availableOptions, 'Select extra titles to assign:', true);
                                if (selectedExtraRanks && selectedExtraRanks.length > 0) {
                                    extraTitles = [...new Set([...extraTitles, ...selectedExtraRanks])];
                                    await client.databaseRequest(game_server.game_connection, "UPDATE admins SET extra_titles_encoded = ? WHERE player_id = ?", [JSON.stringify(extraTitles), selectedAdminId]);
                                }
                            } break;
                        
                            case 'remove': {
                                const currentPlayer = await client.databaseRequest(game_server.game_connection, "SELECT extra_titles_encoded FROM admins WHERE player_id = ?", [selectedAdminId]);
                                if (currentPlayer[0].extra_titles_encoded) {
                                    let extraTitles = JSON.parse(currentPlayer[0].extra_titles_encoded);
                                    const extraRankOptions = await getRankOptions(client, game_server.game_connection);
                                    const assignedOptions = extraRankOptions.filter(option => extraTitles.includes(option.value));
                                    const selectedExtraRanks = await client.sendInteractionSelectMenu(interaction, `select-extra-ranks`, 'Select Extra Titles', assignedOptions, 'Select extra titles to remove:', true);
                                    if (selectedExtraRanks && selectedExtraRanks.length > 0) {
                                        extraTitles = extraTitles.filter(title => !selectedExtraRanks.includes(title));
                                        await client.databaseRequest(game_server.game_connection, "UPDATE admins SET extra_titles_encoded = ? WHERE player_id = ?", [JSON.stringify(extraTitles), selectedAdminId]);
                                    }
                                }
                            } break;
                        }
                        await client.ephemeralEmbed({
                            title: `Request`,
                            desc: `Admin updated successfully!`,
                            color: `#669917`
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
        const selectedAction = await client.sendInteractionSelectMenu(interaction, `select-action`, 'Select action', actionOptions, 'Choose an action for rank management:');
        if (selectedAction) {
            switch (selectedAction) {
                case 'add': {
                    await interaction.followUp({ content: 'Enter the name of the new rank:', ephemeral: true });
                    const rankName = await client.collectUserInput(interaction);
                    if (!rankName) return;
                    await interaction.followUp({ content: 'Enter the text rights for this rank:', ephemeral: true });
                    const textRights = await client.collectUserInput(interaction);
                    if (!textRights) return;
                    await client.databaseRequest(game_server.game_connection, "INSERT INTO admin_ranks (rank_name, text_rights) VALUES (?, ?)", [rankName, textRights]);
                    await client.ephemeralEmbed({
                        title: `Request`,
                        desc: `Rank ${rankName} added successfully!`,
                        color: `#669917`
                    }, interaction);
                } break;

                case 'remove': {
                    const rankList = await getRankOptions(client, game_server.game_connection);
                    if (rankList.length === 0) {
                        await client.ephemeralEmbed({
                            title: `Request`,
                            desc: `No ranks found to remove.`,
                            color: `#c70058`
                        }, interaction);
                        return;
                    }
                    const selectedRankId = await client.sendInteractionSelectMenu(interaction, `select-rank`, 'Select Rank', rankList, 'Select the rank to remove:');
                    if (selectedRankId) {
                        await client.databaseRequest(game_server.game_connection, "DELETE FROM admin_ranks WHERE id = ?", [selectedRankId]);
                        const playersWithExtraTitles = await client.databaseRequest(game_server.game_connection, "SELECT player_id, extra_titles_encoded FROM admins WHERE extra_titles_encoded LIKE ?", [`%${selectedRankId}%`]);
                        for (const admin of playersWithExtraTitles) {
                            let extraTitles = JSON.parse(admin.extra_titles_encoded);
                            extraTitles = extraTitles.filter(id => id !== selectedRankId);
                            const updatedExtraTitles = extraTitles.length > 0 ? JSON.stringify(extraTitles) : null;
                            await client.databaseRequest(game_server.game_connection, "UPDATE admins SET extra_titles_encoded = ? WHERE player_id = ?", [updatedExtraTitles, admin.player_id]);
                        }
                        await client.ephemeralEmbed({
                            title: `Request`,
                            desc: `Rank removed successfully!`,
                            color: `#669917`
                        }, interaction);
                    }
                } break;

                case 'update': {
                    const rankList = await getRankOptions(client, game_server.game_connection);
                    if (rankList.length === 0) {
                        await client.ephemeralEmbed({
                            title: `Request`,
                            desc: `No ranks found to update.`,
                            color: `#c70058`
                        }, interaction);
                        return;
                    }
                    const selectedRankId = await client.sendInteractionSelectMenu(interaction, `select-rank`, 'Select Rank', rankList, 'Select the rank to update:');
                    if (selectedRankId) {
                        const askRankOptions = [{ label: 'Update', value: 'update' }, { label: 'Skip', value: 'skip' }]
                        const seelectRank = await client.sendInteractionSelectMenu(interaction, `select-name`, 'Update Rank', askRankOptions, 'Would you like to update rank name?');
                        if (seelectRank === 'update') {
                            await interaction.followUp({ content: 'Enter the new name for the rank:', ephemeral: true });
                            const newRankName = await client.collectUserInput(interaction);
                            if (!newRankName) return;
                            await client.databaseRequest(game_server.game_connection, "UPDATE admin_ranks SET rank_name = ? WHERE id = ?", [newRankName, selectedRankId]);
                        }
                        await interaction.followUp({ content: 'Enter the text rights for this rank:', ephemeral: true });
                        const newTextRights = await client.collectUserInput(interaction);
                        if (!newTextRights) return;
                        await client.databaseRequest(game_server.game_connection, "UPDATE admin_ranks SET text_rights = ? WHERE id = ?", [newTextRights, selectedRankId]);
                        await client.ephemeralEmbed({
                            title: `Request`,
                            desc: `Rank updated successfully!`,
                            color: `#669917`
                        }, interaction);
                    }
                } break;
            }
        }
    };

    game_server.manageWhitelists = async function (interaction) {
        const actionOptions = [
            { label: 'Add Whitelists', value: 'add' },
            { label: 'Remove Whitelists', value: 'remove' }
        ];
        const acting_wls = {
            "WHITELIST_COMMANDER": "CO",
            "WHITELIST_COMMANDER_COUNCIL": "CO Council",
            "WHITELIST_COMMANDER_COUNCIL_LEGACY": "CO Council Legacy",
            "WHITELIST_COMMANDER_COLONEL": "Colonel",
            "WHITELIST_COMMANDER_LEADER": "CO Leader",
            "WHITELIST_SYNTHETIC": "Synthetic",
            "WHITELIST_SYNTHETIC_COUNCIL": "Synthetic Council",
            "WHITELIST_SYNTHETIC_COUNCIL_LEGACY": "Synthetic Council Legacy",
            "WHITELIST_SYNTHETIC_LEADER": "Synthetic Leader",
            "WHITELIST_JOE": "Joe",
            "WHITELIST_YAUTJA": "Yautja",
            "WHITELIST_YAUTJA_LEGACY": "Yautja Legacy",
            "WHITELIST_YAUTJA_COUNCIL": "Yautja Council",
            "WHITELIST_YAUTJA_COUNCIL_LEGACY": "Yautja Council Legacy",
            "WHITELIST_YAUTJA_LEADER": "Yautja Leader"
        };
        const selectedAction = await client.sendInteractionSelectMenu(interaction, `select-action`, 'Select Action', actionOptions, 'Choose an action for admin role management:');
        if (selectedAction) {
            switch (selectedAction) {
                case 'add': {
                    await interaction.followUp({ content: 'Enter the ckey (or what it most likely) of the player to modify whitelist:', ephemeral: true });
                    const ckey = await client.collectUserInput(interaction);
                    if (!ckey) return;
                    const playerData = await client.databaseRequest(game_server.game_connection, "SELECT id, ckey, whitelist_status FROM players WHERE ckey LIKE ?", [`%${ckey}%`]);
                    if (!playerData.length) {
                        await interaction.followUp({ content: 'No player found with that ckey.', ephemeral: true });
                        return;
                    }
                    const playerOptions = playerData.map(player => ({
                        label: player.ckey,
                        value: player.id.toString()
                    }));
                    const selectedPlayerId = await client.sendInteractionSelectMenu(interaction, `select-player`, 'Select Player', playerOptions, 'Select the player for adding whitelists:');
                    if (!selectedPlayerId) return;
                    const player = playerData.find(p => p.id.toString() === selectedPlayerId);
                    let currentRoles = player.whitelist_status ? player.whitelist_status.split('|') : [];
                    const availableRoles = Object.entries(acting_wls).filter(([key]) => !currentRoles.includes(key)).map(([key, value]) => ({
                        label: value,
                        value: key
                    }));
                    if (availableRoles.length === 0) {
                        await interaction.followUp({ content: 'No roles available to add. The player already has all possible roles.', ephemeral: true });
                        return;
                    }
                    const selectedRoles = await client.sendInteractionSelectMenu(interaction, `select-roles`, 'Select Roles', availableRoles, 'Select the roles to add:', true);
                    if (!selectedRoles) return;
                    currentRoles = [...new Set([...currentRoles, ...selectedRoles])];
                    await client.databaseRequest(game_server.game_connection, "UPDATE players SET whitelist_status = ? WHERE id = ?", [currentRoles.join('|'), selectedPlayerId]);
                    await client.ephemeralEmbed({
                        title: `Request`,
                        desc: `Roles added successfully!`,
                        color: `#669917`
                    }, interaction);
                } break;

                case 'remove': {
                    await interaction.followUp({ content: 'Enter the ckey (or what it most likely) of the player to remove whitelists from:', ephemeral: true });
                    const ckey = await client.collectUserInput(interaction);
                    if (!ckey) return;
                    const playerData = await client.databaseRequest(game_server.game_connection, "SELECT id, ckey, whitelist_status FROM players WHERE ckey LIKE ?", [`%${ckey}%`]);
                    if (!playerData.length) {
                        await interaction.followUp({ content: 'No player found with that ckey.', ephemeral: true });
                        return;
                    }
                    const playerOptions = playerData.map(player => ({
                        label: player.ckey,
                        value: player.id.toString()
                    }));
                    const selectedPlayerId = await client.sendInteractionSelectMenu(interaction, `select-player`, 'Select Player', playerOptions, 'Select the player for removing whitelists:');
                    if (!selectedPlayerId) return;
                    const player = playerData.find(p => p.id.toString() === selectedPlayerId);
                    if (!player.whitelist_status) {
                        await interaction.followUp({ content: 'This player has no roles to remove.', ephemeral: true });
                        return;
                    }
                    let currentRoles = player.whitelist_status.split('|');
                    const roleOptions = currentRoles.map(role => ({
                        label: acting_wls[role] || role,
                        value: role
                    }));
                    const selectedRoles = await client.sendInteractionSelectMenu(interaction, `select-roles`, 'Select Roles', roleOptions, 'Select the roles to remove:', true);
                    if (!selectedRoles) return;
                    selectedRoles.forEach(selectedRole => {
                        const index = currentRoles.indexOf(selectedRole);
                        if (index > -1) {
                            currentRoles.splice(index, 1);
                        }
                    });
                    await client.databaseRequest(game_server.game_connection, "UPDATE players SET whitelist_status = ? WHERE id = ?", [currentRoles.join('|'), selectedPlayerId]);
                    await client.ephemeralEmbed({
                        title: `Request`,
                        desc: `Roles removed successfully!`,
                        color: `#669917`
                    }, interaction);
                } break;
            }
        }
    };

    game_server.handling_actions = {
        "manage_admins": game_server.manageAdmins,
        "manage_ranks": game_server.manageRanks,
        "manage_whitelists": game_server.manageWhitelists
    };

    game_server.handling_commands = [
        { label: "Manage Admins", value: "manage_admins" },
        { label: "Manage Ranks", value: "manage_ranks" },
        { label: "Manage Whitelists", value: "manage_whitelists" }
    ];
}

async function getAdminOptions(client, database_connection) {
    const admins = await client.databaseRequest(database_connection, "SELECT a.player_id, p.ckey FROM admins a JOIN players p ON a.player_id = p.id", []);

    return admins.map(admin => ({
        label: admin.ckey,
        value: admin.player_id.toString()
    }));
};

async function getRankOptions(client, database_connection) {
    const ranks = await client.databaseRequest(database_connection, "SELECT id, rank_name FROM admin_ranks", []);

    return ranks.map(rank => ({
        label: rank.rank_name,
        value: rank.id.toString()
    }));
};