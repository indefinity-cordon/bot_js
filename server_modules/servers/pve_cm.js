module.exports = async (client, game_server) => {
	game_server.tgsActions = async function (interaction) {
		const collected = await client.sendInteractionSelectMenu(interaction, 'select-action', 'Select action', client.handling_tgs, 'Please select action to perform:');
		if (collected) {
			global.createLog(`${interaction.user.id} used command [TGS ${client.handling_tgs[collected]}]`);
			const response_data = await client.handling_tgs_actions[collected](game_server.discord_server.settings_data.tgs_address.data.setting, game_server.data.tgs_id, interaction);
			await client.ephemeralEmbed({ title: 'Action', desc: `${response_data.status}: ${response_data.statusText}`, color: '#c70058' }, interaction);
		}
	};

	game_server.handling_actions = {
		'manage_tgs': game_server.tgsActions,
	};

	game_server.handling_commands = [
		{ label: 'Manage TGS', value: 'manage_tgs' }
	];

	game_server.serverCustomOperators = async function () {
	};
};
