const { EmbedBuilder } = require('discord.js');

module.exports = async (client, game_server) => {
	var failed_times = 0;

	game_server.updateStatusMessage = async function (type) {
		try {
			const server_response = await client.prepareByondAPIRequest({client: client, request: JSON.stringify({query: 'status_authed', auth: 'bsojgsd90423pfdsuigohdhs901248gdfgj89yasanhb8cx76cvccxc5', source: 'bot'}), port: game_server.data.port, address: game_server.data.ip});
			if (!server_response) throw 'Returned no response';

			const response = JSON.parse(server_response);
			const data = response.data;
			if (!data) throw 'Returned no data';

			for (const [key, value] of data) {
				data[key] = value ? value : 'Loading...'
			}

			const { round_duration, round_name, round_id, map_name, next_map_name, ship_map_name, next_ship_map_name, players, mode, round_end_state } = data

			failed_times = 0;
			const time = Math.floor(round_duration / 600);
			let fields = [];
			fields.push({ name: '**Round Name**', value: `${round_name} `, inline: true});
			fields.push({ name: '**Round ID**', value: `${round_id} `, inline: true});
			fields.push({ name: '**Map**', value: `${map_name} `, inline: true});
			if (next_map_name)
				fields.push({ name: '**Next Map**', value: `${next_map_name} `, inline: true});
			fields.push({ name: '**Ship Map**', value: `${ship_map_name} `, inline: true});
			if (next_ship_map_name)
				fields.push({ name: '***Next Ship Map**', value: `${next_ship_map_name} `, inline: true});
			fields.push({ name: '**Total Players**', value: `${players} `, inline: true});
			fields.push({ name: '**Gamemode**', value: `${mode}`, inline: true});
			fields.push({ name: '**Round Time**', value: `${Math.floor(time / 60)}:` + `${time % 60}`.padStart(2, '0'), inline: true});
			if (round_end_state)
				fields.push({ name: '**Rouned End State**', value: `${round_end_state} `, inline: true});
			for (const message of game_server.updater_messages[type]) {
				await client.sendEmbed({
					embeds: [new EmbedBuilder().setTitle(' ').addFields(fields).setColor('#669917').setTimestamp()],
					content: `${game_server.data.server_name} Status`,
					components: [],
					type: 'edit'
				}, message);
			}
		} catch (error) {
			if (failed_times > 5) {
				game_server.handle_status(0);
				failed_times = 0;
			} else failed_times++;
			for (const message of game_server.updater_messages[type]) {
				await client.sendEmbed({
					embeds: [new EmbedBuilder().setTitle(' ').setDescription('# SERVER OFFLINE').setColor('#a00f0f').setTimestamp()],
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
			if (!server_schedule_data) throw 'Something went wrong in getSchedule moduel';

			for (const message of game_server.updater_messages[type]) {
				await client.sendEmbed({
					embeds: [new EmbedBuilder().setTitle(' ').setDescription(server_schedule_data).setColor('#669917').setTimestamp()],
					content: `${game_server.data.server_name} start schedule`,
					components: [],
					type: 'edit'
				}, message);
			}
		} catch (error) {
			for (const message of game_server.updater_messages[type]) {
				await client.sendEmbed({
					embeds: [new EmbedBuilder().setTitle(' ').setDescription('something went wrong').setColor('#a00f0f').setTimestamp()],
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
					description += ` [Extra Ranks ${extra_ranks.join(' & ')}]`;
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
					embeds.push(new EmbedBuilder().setTitle(' ').setDescription(embed_description).addFields(fields).setColor('#669917'));
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
				embeds.push(new EmbedBuilder().setTitle(' ').setDescription(embed_description ? embed_description : ' ').addFields(fields.length ? fields : { name: ' ', value: ' '}).setColor('#669917'));
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
			embeds.push(new EmbedBuilder().setTitle(' ').setDescription(description).setColor('#669917'));
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
				if (fields.length) embeds.push(new EmbedBuilder().setTitle(' ').addFields(fields).setColor('#669917'));
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


	game_server.infoRequest = async function (request, interaction) {
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
		const db_player_profile = await global.mysqlRequest(game_server.game_connection,
			"SELECT id, ckey, last_login, is_permabanned, permaban_reason, permaban_date, permaban_admin_id, is_time_banned, time_ban_reason, time_ban_expiration, time_ban_admin_id, time_ban_date FROM players WHERE id = ?", [request[0].player_id]);
		if (!db_player_profile[0]) return client.ephemeralEmbed({ title: 'Request', desc: 'This is user don\'t have CM profile', color: '#c70058' }, interaction);

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
			let extra_ranks = [];
			if (db_request_admin[0].extra_titles_encoded) {
				extra_ranks = JSON.parse(db_request_admin[0].extra_titles_encoded).map(rank_id => roleMap.get(parseInt(rank_id)));
			}
			if (extra_ranks.length) player_info += `**Extra Ranks:** ${extra_ranks.join(' & ')}`;
		}
		await client.ephemeralEmbed({ title: `**${request[0].role_rank ? 'HIDDEN' : db_player_profile[0].ckey}** player info`, desc: `\n${player_info}\n${rank_info}\n**Total playtime:** ${Math.round(player_playtime / 6) / 10} Hours`, color: '#c70058' }, interaction);
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
		const selected_action = await client.sendInteractionSelectMenu(interaction, 'select-action', 'Select action', [
			{ label: 'Add Admin', value: 'add' },
			{ label: 'Remove Admin', value: 'remove' },
			{ label: 'Update Admin', value: 'update' }
		], 'Choose an action for admin management:');
		if (!selected_action) return;

		const handling_options = {
			'add': manageAddAdmin,
			'remove': manageRemoveAdmin,
			'update': manageUpdateAdmin
		};
		await handling_options[selected_action](interaction, client, game_server);
	};

	game_server.manageRanks = async function (interaction) {
		const selected_action = await client.sendInteractionSelectMenu(interaction, 'select-action', 'Select action', [
			{ label: 'Add Rank', value: 'add' },
			{ label: 'Remove Rank', value: 'remove' },
			{ label: 'Update Rank', value: 'update' }
		], 'Choose an action for rank management:');
		if (!selected_action) return;

		const handling_options = {
			'add': manageAddRank,
			'remove': manageRemoveRank,
			'update': manageUpdateRank
		};
		await handling_options[selected_action](interaction, client, game_server);
	};

	game_server.manageWhitelists = async function (interaction) {
		const selected_action = await client.sendInteractionSelectMenu(interaction, 'select-action', 'Select action', [
			{ label: 'Add Whitelists', value: 'add' },
			{ label: 'Remove Whitelists', value: 'remove' }
		], 'Choose an action for rank management:');
		if (!selected_action) return;

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
		const handling_options = {
			'add': manageAddWhitelist,
			'remove': manageRemoveWhitelist
		};
		await handling_options[selected_action](interaction, client, game_server, acting_wls);
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
		const selected_action = await client.sendInteractionSelectMenu(interaction, 'select-auto-start', 'Select Action', [
			{ label: 'View Schedule', value: 'view' },
			{ label: 'Set Mode', value: 'set_mode' },
			{ label: 'Set Daily Times', value: 'set_daily_time' },
			{ label: 'Remove Daily Times', value: 'remove_daily_time' },
			{ label: 'Set Specific Days', value: 'set_specific_days' },
			{ label: 'Remove Specific Days', value: 'remove_specific_days' }
		], 'Configure the automatic server start system:');
		if (!selected_action) return;

		const handling_options = {
			'view': viewSchedule,
			'set_mode': setMode,
			'set_daily_time': setDailyTimes,
			'remove_daily_time': removeDailyTimes,
			'set_specific_days': setSpecificDays,
			'remove_specific_days': removeSpecificDays
		};
		await handling_options[selected_action](interaction, client, game_server, game_server.settings_data.auto_start_config.param);
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
		if (await game_server.handle_status(1)) return;
		if (game_server.settings_data.player_low_autoshutdown && game_server.settings_data.server_status.data.setting) {
			const server_response = await client.prepareByondAPIRequest({client: client, request: JSON.stringify({query: 'status_authed', auth: 'bsojgsd90423pfdsuigohdhs901248gdfgj89yasanhb8cx76cvccxc5', source: 'bot'}), port: game_server.data.port, address: game_server.data.ip});
			if (server_response && isJsonString(server_response)) {
				const response = JSON.parse(server_response);
				const data = response.data;
				if (data && data.players < game_server.settings_data.player_low_autoshutdown.data.setting) {
					game_server.handle_status(0);
					const instance = await client.tgs_getInstance(game_server.discord_server.settings_data.tgs_address.data.setting, game_server.data.tgs_id);
					if (instance) client.tgs_stop(game_server.discord_server.settings_data.tgs_address.data.setting, game_server.data.tgs_id);
					return;
				}
			}

		const role = channel.guild.roles.cache.find(role => role.name === 'Round Alert');
		await client.sendEmbed({embeds: [new EmbedBuilder().setTitle('NEW ROUND!').setDescription(' ').setColor(role.hexColor)], content: `<@&${role.id}>`}, channel);
		}
	};

	async function handlePredator(channel) {
		const role = channel.guild.roles.cache.find(role => role.name === 'Predator gamer');
		await client.sendEmbed({embeds: [new EmbedBuilder().setTitle('PREDATOR ROUND!').setDescription(' ').setColor(role.hexColor)], content: `<@&${role.id}>`}, channel);
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
		await client.sendEmbed({embeds: [new EmbedBuilder().setTitle(' ').setDescription(`Admin Login: ${data.key}`).setColor('#2ecc71')]}, channel);
	};

	async function handleLogout(channel, data) {
		await client.sendEmbed({embeds: [new EmbedBuilder().setTitle(' ').setDescription(`Admin Logout: ${data.key}`).setColor('#e74c3c')]}, channel);
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
		const embed = new EmbedBuilder()
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
		const embed = new EmbedBuilder()
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
			while (messages.length) {
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
			if (messagesToSend.length) {
				await client.sendEmbed({ embeds: messagesToSend }, await client.channels.fetch(channelId));
			}
			if (!messages.length) {
				delete messageQueue[channelId];
			}
		}
	}, 2000);

	game_server.handle_status = async function (new_status) {
		if (game_server.settings_data.server_status.data.setting == new_status) return false;
		game_server.settings_data.server_status.data.setting = new_status;
		const status = await global.mysqlRequest(global.database, "SELECT channel_id, message_id FROM server_channels WHERE server = ? AND type = 'round'", [game_server.id]);
		const channel = await client.channels.fetch(status[0].channel_id);
		if (game_server.settings_data.server_status.data.setting) {
			if (channel) {
				const role = channel.guild.roles.cache.find(role => role.name === 'Round Alert');
				const now_date = new Date();
				const start_time = new Date(Date.UTC(now_date.getUTCFullYear(), now_date.getUTCMonth(), now_date.getUTCDate(), now_date.getUTCHours(), now_date.getUTCMinutes(), 0));
				await client.sendEmbed({ embeds: [new EmbedBuilder().setTitle(' ').setDescription(`Запуск!\nРаунд начнётся примерно в <t:${Math.floor(start_time.getTime() / 1000 + 20 * 60)}:t>`).setColor('#669917')], content: `<@&${role.id}>`}, channel);
			}
			await client.prepareByondAPIRequest({client: client, request: JSON.stringify({query: 'set_delay', auth: 'bsojgsd90423pfdsuigohdhs901248gdfgj89yasanhb8cx76cvccxc5', source: 'bot', delay: 1}), port: game_server.data.port, address: game_server.data.ip});
			async function clear_delay() {
				await client.prepareByondAPIRequest({client: client, request: JSON.stringify({query: 'set_delay', auth: 'bsojgsd90423pfdsuigohdhs901248gdfgj89yasanhb8cx76cvccxc5', source: 'bot', delay: 0}), port: game_server.data.port, address: game_server.data.ip});
				if (channel) {
					await client.sendEmbed({ embeds: [new EmbedBuilder().setTitle(' ').setDescription(`Задержка старта снята!`).setColor('#669917')], content: ` `}, channel);
				}
			}
			setTimeout(clear_delay, 20 * 60000);
		} else if (channel) {
			await client.sendEmbed({ embeds: [new EmbedBuilder().setTitle(' ').setDescription(`Сервер выключен!\nИнформацию по следующему запуску смотрите в расписание`).setColor('#669917')], content: ` `}, channel);
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
	if(game_server.settings_data.server_status.data.setting) return;
	const instance = await client.tgs_getInstance(game_server.discord_server.settings_data.tgs_address.data.setting, game_server.data.tgs_id);
	if(!instance) return;
	client.tgs_start(game_server.discord_server.settings_data.tgs_address.data.setting, game_server.data.tgs_id)
};



/// MANAGING ADMINS

async function manageAddAdmin(interaction, client, game_server) {
	await interaction.followUp({ content: 'Enter the ckey (or what it most likely) of the player to add as admin', ephemeral: true });
	const ckey = await client.collectUserInput(interaction);
	if (!ckey) return;

	const player_data = await global.mysqlRequest(game_server.game_connection, "SELECT id, ckey FROM players WHERE ckey LIKE ?", [`%${ckey}%`]);
	if (!player_data.length) return await client.ephemeralEmbed({ title: 'Request', desc: 'Not found player with that ckey', color: '#c70058' }, interaction);

	const player_options = player_data.map(player => ({
		label: player.ckey,
		value: player.id.toString()
	}));
	const selected_player = await client.sendInteractionSelectMenu(interaction, 'select-player', 'Select Player', player_options, 'Select the player to add as admin:');
	if (!selected_player) return;

	const admins = await global.mysqlRequest(database_connection, "SELECT player_id FROM admins");
	if (admins.find(admin => admin.player_id == selected_player)) return await client.ephemeralEmbed({ title: 'Request', desc: 'This admin already exist', color: '#c70058' }, interaction);

	const all_ranks = await getRankOptions(client, game_server.game_connection);
	const selected_rank = await client.sendInteractionSelectMenu(interaction, 'select-rank', 'Select Rank', all_ranks, 'Select the rank to assign:');
	if (!selected_rank) return;

	global.createLog(`${interaction.user.id} added admin [${player_data.ckey}], rank: [${all_ranks.find(rank => rank.value === selected_rank).label}]`);

	await global.mysqlRequest(game_server.game_connection, "INSERT INTO admins (player_id, rank_id) VALUES (?, ?)", [selected_player, selected_rank]);
	const selected_action = await client.sendInteractionSelectMenu(interaction, 'select-titles', 'Set Titles', [{ label: 'Set Up', value: 'set' }, { label: 'Skip', value: 'skip' }], 'Would you like to assign extra titles to this admin?');
	if (selected_action === 'set') {
		const selected_extra_ranks = await client.sendInteractionSelectMenu(interaction, 'select-extra-ranks', 'Select Extra Titles', all_ranks, 'Select extra titles to assign:', true);
		if (selected_extra_ranks && selected_extra_ranks.length) {
			global.createLog(`${interaction.user.id} admin extra titles added [${player_data.ckey}], extra_titles_encoded: [${JSON.stringify(selected_extra_ranks)}]`);

			await global.mysqlRequest(game_server.game_connection, "UPDATE admins SET extra_titles_encoded = ? WHERE player_id = ?", [JSON.stringify(selected_extra_ranks), selected_player]);
		}
	}
	await client.ephemeralEmbed({ title: 'Request', desc: 'Admin added successfully!', color: '#669917' }, interaction);
};

async function manageRemoveAdmin(interaction, client, game_server) {
	const all_admins = await getAdminOptions(client, game_server.game_connection);
	if (!all_admins.length) return await client.ephemeralEmbed({ title: 'Request', desc: 'Not found admins to remove', color: '#c70058' }, interaction);

	const selected_admin = await client.sendInteractionSelectMenu(interaction, 'select-admin', 'Select Admin', all_admins, 'Select the admin to remove:');
	if (!selected_admin) return;

	global.createLog(`${interaction.user.id} removed admin [${all_admins.find(admin => admin.value === selected_admin).label}]`);

	await global.mysqlRequest(game_server.game_connection, "DELETE FROM admins WHERE player_id = ?", [selected_admin]);
	await client.ephemeralEmbed({ title: 'Request', desc: 'Admin removed successfully!', color: '#669917' }, interaction);
};

async function manageUpdateAdmin(interaction, client, game_server) {
	const all_admins = await getAdminOptions(client, game_server.game_connection);
	if (!all_admins.length) return await client.ephemeralEmbed({ title: 'Request', desc: 'Not found admins to update', color: '#c70058' }, interaction);

	const selected_admin = await client.sendInteractionSelectMenu(interaction, 'select-admin', 'Select Admin', all_admins, 'Select the admin to update:');
	if (!selected_admin) return;

	const selected_action = await client.sendInteractionSelectMenu(interaction, 'select-rank', 'Update Rank', [{ label: 'Update', value: 'update' }, { label: 'Skip', value: 'skip' }], 'Would you like to update rank to this admin?');
	if (selected_action === 'update') {
		const all_ranks = await getRankOptions(client, game_server.game_connection);
		const selected_rank = await client.sendInteractionSelectMenu(interaction, 'select-rank', 'Select Rank', all_ranks, 'Select the new rank to assign:');
		if (selected_rank) {
			global.createLog(`${interaction.user.id} change admin rank [${all_admins.find(admin => admin.value === selected_admin).label}], new rank: [${all_ranks.find(rank => rank.value === selected_rank).label}]`);

			await global.mysqlRequest(game_server.game_connection, "UPDATE admins SET rank_id = ? WHERE player_id = ?", [selected_rank, selected_admin]);
		}
	}
	const selected_action_titles = await client.sendInteractionSelectMenu(interaction, 'select-titles', 'Update Titles', [
			{ label: 'Update', value: 'update' }, { label: 'Remove', value: 'remove' }, { label: 'Skip', value: 'skip' }
		], 'Would you like to update extra titles to this admin?');
	switch (selected_action_titles) {
		case 'update': {
			const current_player = await global.mysqlRequest(game_server.game_connection, "SELECT extra_titles_encoded FROM admins WHERE player_id = ?", [selected_admin]);
			let extra_titles = current_player[0].extra_titles_encoded ? JSON.parse(current_player[0].extra_titles_encoded) : [];
			const extra_rank_options = await getRankOptions(client, game_server.game_connection);
			const selected_extra_ranks = await client.sendInteractionSelectMenu(interaction, 'select-extra-ranks', 'Select Extra Titles', extra_rank_options.filter(option => !extra_titles.includes(option.value)), 'Select extra titles to assign:', true);
			if (selected_extra_ranks && selected_extra_ranks.length) {
				extra_titles = [...new Set([...extra_titles, ...selected_extra_ranks])];

				global.createLog(`${interaction.user.id} added admin extra titles [${all_admins.find(admin => admin.value === selected_admin).label}], new extra_titles_encoded: [${JSON.stringify(extra_titles)}] : Initial(${current_player[0].extra_titles_encoded})`);

				await global.mysqlRequest(game_server.game_connection, "UPDATE admins SET extra_titles_encoded = ? WHERE player_id = ?", [JSON.stringify(extra_titles), selected_admin]);
			}
		} break;

		case 'remove': {
			const current_player = await global.mysqlRequest(game_server.game_connection, "SELECT extra_titles_encoded FROM admins WHERE player_id = ?", [selected_admin]);
			if (current_player[0].extra_titles_encoded) {
				let extra_titles = JSON.parse(current_player[0].extra_titles_encoded);
				const extra_rank_options = await getRankOptions(client, game_server.game_connection);
				const assignedOptions = extra_rank_options.filter(option => extra_titles.includes(option.value));
				const selected_extra_ranks = await client.sendInteractionSelectMenu(interaction, 'select-extra-ranks', 'Select Extra Titles', assignedOptions, 'Select extra titles to remove:', true);
				if (selected_extra_ranks && selected_extra_ranks.length) {
					extra_titles = extra_titles.filter(title => !selected_extra_ranks.includes(title));

					global.createLog(`${interaction.user.id} removed admin extra titles [${all_admins.find(admin => admin.value === selected_admin).label}], new extra_titles_encoded: [${JSON.stringify(extra_titles)}] : Initial(${current_player[0].extra_titles_encoded})`);

					await global.mysqlRequest(game_server.game_connection, "UPDATE admins SET extra_titles_encoded = ? WHERE player_id = ?", [JSON.stringify(extra_titles), selected_admin]);
				}
			}
		} break;
	}
	await client.ephemeralEmbed({ title: 'Request', desc: 'Admin updated successfully!', color: '#669917' }, interaction);
};



/// MANAGING RANKS

async function manageAddRank(interaction, client, game_server) {
	await interaction.followUp({ content: 'Enter the name of the new rank', ephemeral: true });
	const rank_name = await client.collectUserInput(interaction);
	if (!rank_name) return;

	const all_ranks = await global.mysqlRequest(database_connection, "SELECT rank_name FROM admin_ranks");
	if (all_ranks.find(rank => rank.rank_name == rank_name)) return await client.ephemeralEmbed({ title: 'Request', desc: 'This rank already exist', color: '#c70058' }, interaction);

	await interaction.followUp({ content: 'Enter the text rights for this rank', ephemeral: true });
	const text_rights = await client.collectUserInput(interaction);
	if (!text_rights) return;

	global.createLog(`${interaction.user.id} created admin rank [${rank_name}], new text_rights: [${text_rights}]`);

	await global.mysqlRequest(game_server.game_connection, "INSERT INTO admin_ranks (rank_name, text_rights) VALUES (?, ?)", [rank_name, text_rights]);
	await client.ephemeralEmbed({ title: 'Request', desc: `Rank ${rank_name} added successfully!`, color: '#669917' }, interaction);
};

async function manageRemoveRank(interaction, client, game_server) {
	const all_ranks = await getRankOptions(client, game_server.game_connection);
	if (!all_ranks.length) return await client.ephemeralEmbed({ title: 'Request', desc: 'Not found ranks to remove', color: '#c70058' }, interaction);

	const selected_rank = await client.sendInteractionSelectMenu(interaction, 'select-rank', 'Select Rank', all_ranks, 'Select the rank to remove:');
	if (!selected_rank) return;

	global.createLog(`${interaction.user.id} removed admin rank [${ranks.find(rank => rank.value === selected_rank).label}]`);

	await global.mysqlRequest(game_server.game_connection, "DELETE FROM admin_ranks WHERE id = ?", [selected_rank]);
	const adminst_extra_titled = await global.mysqlRequest(game_server.game_connection, "SELECT player_id, extra_titles_encoded FROM admins WHERE extra_titles_encoded LIKE ?", [`%${selected_rank}%`]);
	for (const admin of adminst_extra_titled) {
		let extra_titles = JSON.parse(admin.extra_titles_encoded);
		extra_titles = extra_titles.filter(id => id !== selected_rank);
		await global.mysqlRequest(game_server.game_connection, "UPDATE admins SET extra_titles_encoded = ? WHERE player_id = ?", [extra_titles.length ? JSON.stringify(extra_titles) : null, admin.player_id]);
	}
	await client.ephemeralEmbed({ title: 'Request', desc: 'Rank removed successfully!', color: '#669917' }, interaction);
	
};

async function manageUpdateRank(interaction, client, game_server) {
	const all_ranks = await getRankOptions(client, game_server.game_connection);
	if (!all_ranks.length) return await client.ephemeralEmbed({ title: 'Request', desc: 'Not found ranks to update', color: '#c70058' }, interaction);

	const selected_rank = await client.sendInteractionSelectMenu(interaction, 'select-rank', 'Select Rank', all_ranks, 'Select the rank to update:');
	if (!selected_rank) return;

	const selected_action = await client.sendInteractionSelectMenu(interaction, 'select-name', 'Update Rank', [{ label: 'Update', value: 'update' }, { label: 'Skip', value: 'skip' }], 'Would you like to update rank name?');
	if (selected_action === 'update') {
		await interaction.followUp({ content: 'Enter the new name for the rank', ephemeral: true });
		const new_name = await client.collectUserInput(interaction);
		if (!new_name) return;

		global.createLog(`${interaction.user.id} changed admin rank [${ranks.find(rank => rank.value === selected_rank).label}], new rank_name: [${new_name}]`);

		await global.mysqlRequest(game_server.game_connection, "UPDATE admin_ranks SET rank_name = ? WHERE id = ?", [new_name, selected_rank]);
	}
	await interaction.followUp({ content: 'Enter the text rights for this rank', ephemeral: true });
	const new_rights = await client.collectUserInput(interaction);
	if (!new_rights) return;

	global.createLog(`${interaction.user.id} changed admin rank [${ranks.find(rank => rank.value === selected_rank).label}], new text_rights: [${new_rights}]`);

	await global.mysqlRequest(game_server.game_connection, "UPDATE admin_ranks SET text_rights = ? WHERE id = ?", [new_rights, selected_rank]);
	await client.ephemeralEmbed({ title: 'Request', desc: 'Rank updated successfully!', color: '#669917' }, interaction);
	
};



/// MANAGING WHITELISTS

async function manageAddWhitelist(interaction, client, game_server, acting_wls) {
	await interaction.followUp({ content: 'Enter the ckey (or what it most likely) of the player to modify whitelist', ephemeral: true });
	const ckey = await client.collectUserInput(interaction);
	if (!ckey) return;

	const player_data = await global.mysqlRequest(game_server.game_connection, "SELECT id, ckey, whitelist_status FROM players WHERE ckey LIKE ?", [`%${ckey}%`]);
	if (!player_data.length) return await client.ephemeralEmbed({ title: 'Request', desc: 'Not found player with that ckey', color: '#c70058' }, interaction);

	const player_options = player_data.map(player => ({
		label: player.ckey,
		value: player.id.toString()
	}));
	const selected_player = await client.sendInteractionSelectMenu(interaction, 'select-player', 'Select Player', player_options, 'Select the player to add whitelists:');
	if (!selected_player) return;

	const player = player_data.find(p => p.id.toString() === selected_player);
	let current_whitelists = player.whitelist_status ? player.whitelist_status.split('|') : [];
	const availableRoles = Object.entries(acting_wls).filter(([key]) => !current_whitelists.includes(key)).map(([key, value]) => ({
		label: value,
		value: key
	}));
	if (!availableRoles.length) return await client.ephemeralEmbed({ title: 'Request', desc: 'No whitelists available to add. The player already has all possible whitelists', color: '#c70058' }, interaction);

	const selected_whitelists = await client.sendInteractionSelectMenu(interaction, 'select-whitelists', 'Select Roles', availableRoles, 'Select the whitelists to add:', true);
	if (!selected_whitelists) return;

	current_whitelists = [...new Set([...current_whitelists, ...selected_whitelists])];

	global.createLog(`${interaction.user.id} added whitelist [${player.ckey}], new whitelist_status: [${current_whitelists.join('|')}] : Initial(${player.whitelist_status ? player.whitelist_status.split('|') : []})`);

	await global.mysqlRequest(game_server.game_connection, "UPDATE players SET whitelist_status = ? WHERE id = ?", [current_whitelists.join('|'), selected_player]);
	await client.ephemeralEmbed({ title: 'Request', desc: 'Roles added successfully!', color: '#669917' }, interaction);
}

async function manageRemoveWhitelist(interaction, client, game_server, acting_wls) {
	await interaction.followUp({ content: 'Enter the ckey (or what it most likely) of the player to remove whitelists from', ephemeral: true });
	const ckey = await client.collectUserInput(interaction);
	if (!ckey) return;

	const player_data = await global.mysqlRequest(game_server.game_connection, "SELECT id, ckey, whitelist_status FROM players WHERE ckey LIKE ?", [`%${ckey}%`]);
	if (!player_data.length) return await client.ephemeralEmbed({ title: 'Request', desc: 'Not found player with that ckey', color: '#c70058' }, interaction);

	const player_options = player_data.map(player => ({
		label: player.ckey,
		value: player.id.toString()
	}));
	const selected_player = await client.sendInteractionSelectMenu(interaction, 'select-player', 'Select Player', player_options, 'Select the player to remove whitelists:');
	if (!selected_player) return;

	const player = player_data.find(p => p.id.toString() === selected_player);
	if (!player.whitelist_status) return await client.ephemeralEmbed({ title: 'Request', desc: 'This player has no whitelists to remove', color: '#c70058' }, interaction);

	let current_whitelists = player.whitelist_status.split('|');
	const roleOptions = current_whitelists.map(role => ({
		label: acting_wls[role] || role,
		value: role
	}));
	const selected_whitelists = await client.sendInteractionSelectMenu(interaction, 'select-whitelists', 'Select Roles', roleOptions, 'Select the whitelists to remove:', true);
	if (!selected_whitelists) return;

	selected_whitelists.forEach(selectedRole => {
		const index = current_whitelists.indexOf(selectedRole);
		if (index > -1) {
			current_whitelists.splice(index, 1);
		}
	});

	global.createLog(`${interaction.user.id} removed whitelist [${player.ckey}], new whitelist_status: [${current_whitelists.join('|')}] : Initial(${player.whitelist_status.split('|')})`);

	await global.mysqlRequest(game_server.game_connection, "UPDATE players SET whitelist_status = ? WHERE id = ?", [current_whitelists.join('|'), selected_player]);
	await client.ephemeralEmbed({ title: 'Request', desc: 'Roles removed successfully!', color: '#669917' }, interaction);
}



/// MANAGE AUTOSTART

async function viewSchedule(interaction, client, game_server, server_schedule_data) {
	const schedule = await getSchedule(server_schedule_data);
	if (schedule) {
		await client.ephemeralEmbed({ title: 'Request', desc: schedule, color: '#669917' }, interaction);
	} else {
		await client.ephemeralEmbed({ title: 'Request', desc: 'An error occurred while retrieving the schedule.', color: '#c70058' }, interaction);
	}
};

async function setMode(interaction, client, game_server, server_schedule_data) {
	const selected_mode = await client.sendInteractionSelectMenu(interaction, 'select-mode', 'Select mode', [
		{ label: 'Daily', value: 'daily' },
		{ label: 'Specific Days', value: 'weekly' },
		{ label: 'OFF', value: 'off' }
	], 'Choose a mode for server auto-start:');
	server_schedule_data.mode = selected_mode;
	await client.ephemeralEmbed({ title: 'Request', desc: `Mode set to ${selected_mode} for server ${game_server.data.server_name}`, color: '#669917' }, interaction);
};

async function setDailyTimes(interaction, client, game_server, server_schedule_data) {
	const selected_day = await client.sendInteractionSelectMenu(interaction, 'select-day', 'Select day', [
		{ label: 'Monday', value: 'monday' },
		{ label: 'Tuesday', value: 'tuesday' },
		{ label: 'Wednesday', value: 'wednesday' },
		{ label: 'Thursday', value: 'thursday' },
		{ label: 'Friday', value: 'friday' },
		{ label: 'Saturday', value: 'saturday' },
		{ label: 'Sunday', value: 'sunday' }
	], 'Choose a day for setting up auto-start time:');
	await interaction.followUp({ content: 'Please enter the time for auto-start in hh:mm (UTC+0) format', ephemeral: true });
	const time_input = await client.collectUserInput(interaction);
	const time_regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
	if (!time_regex.test(time_input)) return await client.ephemeralEmbed({ title: 'Request', desc: 'Invalid time format. Please use hh:mm format', color: '#c70058' }, interaction);

	server_schedule_data.daily = server_schedule_data.daily || {};
	server_schedule_data.daily[selected_day] = time_input
	await client.ephemeralEmbed({ title: 'Request', desc: `Time set to ${time_input} for ${selected_day} on server ${game_server.data.server_name}`, color: '#669917' }, interaction);
};

async function removeDailyTimes(interaction, client, game_server, server_schedule_data) {
	if (!server_schedule_data.daily || !Object.keys(server_schedule_data.daily).length) return await client.ephemeralEmbed({ title: 'Request', desc: `No daily start times are set for server ${game_server.data.server_name}`, color: '#c70058' }, interaction);

	const dayOptions = Object.keys(server_schedule_data.daily).map(day => ({
		label: day,
		value: day
	}));
	if (!dayOptions.length) return await client.ephemeralEmbed({ title: 'Request', desc: `No days are available for removal from daily start schedule for server ${game_server.data.server_name}`, color: '#c70058' }, interaction);

	const selected_day = await client.sendInteractionSelectMenu(interaction, 'select-day', 'Select a day to remove from daily start schedule', dayOptions, 'Choose a day to remove:');
	delete server_schedule_data.daily[selected_day];
	await client.ephemeralEmbed({ title: 'Request', desc: `Removed daily start time for ${selected_day} on server ${game_server.data.server_name}`, color: '#669917' }, interaction);
};

async function setSpecificDays(interaction, client, game_server, server_schedule_data) {
	let moreDays = true;
	const specificTimes = {};
	while (moreDays) {
		await interaction.followUp({ content: 'Please enter a date for specific start in YYYY-MM-DD format (1984-01-01) or type "done" to finish', ephemeral: true });
		const date_input = await client.collectUserInput(interaction);
		if (date_input.toLowerCase() === 'done') {
			moreDays = false;
		} else {
			const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
			if (!dateRegex.test(date_input)) return await client.ephemeralEmbed({ title: 'Request', desc: 'Invalid date format. Please use YYYY-MM-DD format', color: '#c70058' }, interaction);

			await interaction.followUp({ content: 'Please enter the time for auto-start in hh:mm (UTC+0) format', ephemeral: true });
			const time_input = await client.collectUserInput(interaction);
			const time_regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
			if (!time_regex.test(time_input)) return await client.ephemeralEmbed({ title: 'Request', desc: 'Invalid time format. Please use hh:mm format', color: '#c70058' }, interaction);

			specificTimes[date_input] = time_input;
		}
	}
	server_schedule_data.spec = server_schedule_data.spec || {};
	Object.keys(specificTimes).forEach(date => {
		server_schedule_data.spec[date] = specificTimes[date];
	});
	await client.ephemeralEmbed({ title: 'Request', desc: `Specific start days set for server ${game_server.data.server_name}`, color: '#669917' }, interaction);
};

async function removeSpecificDays(interaction, client, game_server, server_schedule_data) {
	const now = new Date().toISOString().split('T')[0];
	if (!server_schedule_data.spec || !Object.keys(server_schedule_data.spec).length) return await client.ephemeralEmbed({ title: 'Request', desc: `No specific dates are set for server ${game_server.data.server_name}`, color: '#c70058' }, interaction);

	const specificDayOptions = Object.keys(server_schedule_data.spec)
		.filter(date => date >= now)
		.map(date => ({ label: date, value: date }));
	if (!specificDayOptions.length) return await client.ephemeralEmbed({ title: 'Request', desc: `All specific dates have passed for server ${game_server.data.server_name}`, color: '#c70058' }, interaction);

	const selectedDates = await client.sendInteractionSelectMenu(interaction, 'select-date', 'Select a date to remove', specificDayOptions, 'Choose a specific date to remove:', true);
	selectedDates.forEach(selectedDate => {
		delete server_schedule_data.spec[selectedDate];
	});
	await client.ephemeralEmbed({ title: 'Request', desc: `Removed specific start dates for server ${game_server.data.server_name}`, color: '#669917' }, interaction);
};



/// MINOR FUNCTIONAL

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

function isJsonString(str) {
	try {
		JSON.parse(str);
		return true;
	} catch (e) {
		return false;
	}
}
