const { Client, SlashCommandBuilder, InteractionType, CommandInteraction } = require('discord.js');

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
    ,

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        if (interaction.type !== InteractionType.ApplicationCommand) return;
        await interaction.deferReply({ ephemeral: true });
        const target_user = interaction.options.getUser('user');
        const collected = await client.sendInteractionSelectMenu(interaction, 'select-server', 'Select a game server', client.servers_options, 'Please select a game server:');
        if (collected) {
            const db_discord_link = await client.databaseRequest(client.servers_link[collected].game_connection, "SELECT player_id, discord_id, role_rank, stable_rank FROM discord_links WHERE discord_id = ?", [target_user.id]);
            if (!db_discord_link[0] || !db_discord_link[0].discord_id) {
                await client.ephemeralEmbed({
                    title: 'Request',
                    desc: 'This user does not have a linked game profile',
                    color: '#c70058'
                }, interaction);
                return;
            }

            await client.ephemeralEmbed({
                title: 'Request',
                desc: 'Retrieving data...',
                color: '#c70058'
            }, interaction);
            await client.servers_link[collected].infoRequest({ request: db_discord_link }, interaction);
        }
    }
}
