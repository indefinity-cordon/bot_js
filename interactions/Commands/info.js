const { Client, SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, InteractionType, CommandInteraction, EmbedBuilder } = require('discord.js');

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
        )
    ,

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        if (interaction.type !== InteractionType.ApplicationCommand) return;

        const target_user = interaction.options.getUser('user');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select-server')
            .setPlaceholder('Select game server')
            .addOptions(servers_options);

        const row = new ActionRowBuilder()
            .addComponents(selectMenu);

        if (client.activeCollectors && client.activeCollectors[interaction.user.id]) {
            client.activeCollectors[interaction.user.id].stop();
        }

        const filter = collected => collected.customId === 'select-server' && collected.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });
        client.activeCollectors = client.activeCollectors || {};
        client.activeCollectors[interaction.user.id] = collector;

        await interaction.reply({
            content: 'Please select a game server:',
            components: [row],
            ephemeral: true
        }); 

        collector.on('collect', async collected => {
            const selectedServer = collected.values[0];

            await collected.deferUpdate();

            const game_server = global.servers_link[selectedServer];

            const db_discord_link = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT player_id, discord_id, role_rank, stable_rank FROM discord_links WHERE discord_id = ?", params: [target_user.id]})

            if (!db_discord_link[0] || !db_discord_link[0].discord_id) {
                const noLinkEmbed = new EmbedBuilder()
                    .setTitle('Information Request')
                    .setDescription('This user does not have a linked game profile')
                    .setColor('#6d472b');

                await collected.editReply({ content: '', embeds: [noLinkEmbed], components: [] });
                return;
            }

            const noLinkEmbed = new EmbedBuilder()
            .setTitle('Information Request')
            .setDescription('Retrieving')
            .setColor('#6d472b');
            await collected.editReply({ content: '', embeds: [noLinkEmbed], components: [] });
            await game_server.infoRequest({ request: db_discord_link }, collected);
        });

        collector.on('end', async collected => {
            if (collected.size === 0) {
                await interaction.editReply({ content: 'Time ran out! Please try again.', components: [] });
            }
            delete client.activeCollectors[interaction.user.id];
        });
    }
}
