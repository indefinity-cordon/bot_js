const { Client, SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, InteractionType, EmbedBuilder } = require('discord.js');

let servers_options = global.handling_game_servers.map(server => ({
    label: server.server_name,
    value: server.server_name
}));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Order information about yourself')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Select user to show info about')
                .setRequired(true)
        ),

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        if (interaction.type !== InteractionType.ApplicationCommand) return;

        const user = interaction.options.getUser('user');
        // Create the select menu
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select-server')
            .setPlaceholder('Select game server')
            .addOptions(servers_options);

        const row = new ActionRowBuilder()
            .addComponents(selectMenu);

        await interaction.reply({
            content: 'Please select a game server:',
            components: [row],
            ephemeral: true
        }); 

        // Handle the select menu interaction
        const filter = i => i.customId === 'select-server' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            const selectedServer = i.values[0];

            await i.deferUpdate();

            const game_server = global.servers_link[selectedServer];

            const db_discord_link = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT player_id, discord_id, role_rank, stable_rank FROM discord_links WHERE discord_id = ?", params: [i.user.id]})

            if (!db_discord_link[0] || !db_discord_link[0].discord_id) {
                const noLinkEmbed = new EmbedBuilder()
                    .setTitle('Information Request')
                    .setDescription('This user does not have a linked game profile')
                    .setColor('#6d472b');

                await i.editReply({ content: '', embeds: [noLinkEmbed], components: [] });
                return;
            }

            const noLinkEmbed = new EmbedBuilder()
            .setTitle('Information Request')
            .setDescription('Retrieving')
            .setColor('#6d472b');
            await i.editReply({ content: '', embeds: [noLinkEmbed], components: [] });
            game_server.infoRequest({ request: db_discord_link }, i);
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: 'Time ran out! Please try again.', components: [] });
            }
        });
    }
}
