const { CommandInteraction, SlashCommandBuilder, Client } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('check-verify')
		.setDescription('Check verification of your discord account')
	,

	/** 
	 * @param {Client} client
	 * @param {CommandInteraction} interaction
	 * @param {String[]} args
	 */

	run: async (client, interaction, args) => {
		if (interaction.type !== InteractionType.ApplicationCommand) return;

		let discord_server
		if (interaction.guildId) discord_server = global.guilds_link[`${interaction.guildId}`];
		if (!discord_server) return client.ephemeralEmbed({ title: 'Verification', desc: 'No verification for this server', color: '#c70058' }, interaction);

		await interaction.deferReply({ ephemeral: true });
		await client.ephemeralEmbed({ title: 'Verification', desc: 'In progress...' }, interaction);

		let db_response;
		for (const server_name in global.servers_link) {
			if (global.servers_link[server_name].data.guild !== discord_server.id) continue;
			db_response = await global.mysqlRequest(global.servers_link[server_name].game_connection, "SELECT * FROM discord_links WHERE discord_id = ?", [interaction.user.id]);
			break;
		}
		if (!db_response || !db_response[0] || !db_response[0].discord_id) return await client.ephemeralEmbed({ title: 'Verification', desc: 'You need to verify, you don\'t have linked game account' }, interaction);

		const interactionUser = await interaction.guild.members.fetch(interaction.user.id);
		interactionUser.roles.add(discord_server.settings_data.verified_role.data.setting);
		interactionUser.roles.remove(discord_server.settings_data.anti_verified_role.data.setting);
		return await client.ephemeralEmbed({ title: 'Verification', desc: 'You already verified' }, interaction);
	},
};