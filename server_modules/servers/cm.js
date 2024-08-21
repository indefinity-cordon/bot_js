module.exports = (client, game_server) => {
    game_server.updateStatus = async function (client, game_server) {
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
                }, message);
            }
        }
    }


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
        //TODO: Admins
        client.ephemeralEmbed({
            title: `**${request[0].role_rank ? `HIDDEN` : db_player_profile[0].ckey}** player info`,
            desc: `\n${player_info}\n${rank_info}\n**Total playtime:** ${Math.round(player_playtime / 6) / 10} Hours`,
            color: `#6d472b`
        }, interaction);
    }


    //HANDLING COMMMANDS
    game_server.admins = async function (client, interaction) {
        const handling_commands = [
            { label: "View Admins", value: "v_admins" },
            { label: "View Ranks", value: "v_ranks" },
//            { label: "Adminst", value: "admins" }, Потом добавить интеракции с добавлением админов/удалением/изменением
//            { label: "Ranks", value: "ranks" } Так же как и выше
        ];
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`select-action`)
            .setPlaceholder('Select action')
            .addOptions(handling_commands);

        const row = new ActionRowBuilder()
            .addComponents(selectMenu);

        if (client.activeCollectors && client.activeCollectors[interaction.user.id]) {
            client.activeCollectors[interaction.user.id].stop();
        }

        const filter = collected => collected.customId === `select-action` && collected.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });
        client.activeCollectors = client.activeCollectors || {};
        client.activeCollectors[interaction.user.id] = collector;

        await interaction.editReply({
            content: 'Please select action to perform:',
            components: [row],
            ephemeral: true
        });

        return new Promise((resolve, reject) => {
            collector.on('collect', async collected => {
                await collected.deferUpdate();
                const db_request_admin = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT player_id, rank_id, extra_titles_encoded FROM admins", params: [] });
                const db_request_ranks = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT id, rank_name, text_rights FROM admin_ranks", params: [] });
                switch(handling_commands[collected.values[0]]) {
                    case "v_admins":
                        //Замапить админов, линкануть с players таблицей ckey админа, а так же с его рангом и вывести список всех админов
                        break;
                    case "v_ranks":
                        let text = "";
                        for (const db_rank of db_request_ranks) {
                            text += `Name: ${db_rank.rank_name}, Rights: ${db_rank.text_rights}\n`;
                        }
                        const Embed = new Discord.EmbedBuilder()
                        .setTitle('View Ranks')
                        .setDescription(info_string)
                        .setColor('#6d472b');
                        await collected.editReply({ content: '', embeds: [Embed], components: [] });
                        break;
                }
                resolve();
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({ content: 'Time ran out! Please try again.', components: [] });
                }
                delete client.activeCollectors[interaction.user.id];
                reject('No actions done');
            });
        });
    }
/*
    game_server.realtime_list_handler_admins = async function (client, interaction) {
        const bot_settings = await client.databaseRequest({ database: client.database, query: "SELECT param FROM settings WHERE name = 'new_round_message'", params: [] });
    }

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
        "admins": client.admins
    };

    game_server.handling_view_commands = [
        { label: "Admin Settings", value: "admins" }
    ];
}