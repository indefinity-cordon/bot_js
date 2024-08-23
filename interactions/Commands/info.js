const { Client, SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, InteractionType, CommandInteraction, EmbedBuilder } = require('discord.js');

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
        const collected = await client.sendInteractionSelectMenu(interaction, `select-server`, 'Select a game server', client.servers_options, 'Please select a game server:');
        if (collected) {
            const db_discord_link = await client.databaseRequest({ database: client.servers_link[collected].game_connection, query: "SELECT player_id, discord_id, role_rank, stable_rank FROM discord_links WHERE discord_id = ?", params: [target_user.id] });
            if (!db_discord_link[0] || !db_discord_link[0].discord_id) {
                const Embed = new EmbedBuilder()
                    .setTitle('Information Request')
                    .setDescription('This user does not have a linked game profile')
                    .setColor('#6d472b');
                await interaction.editReply({ content: '', embeds: [Embed], components: [] });
                return;
            }

            const Embed = new EmbedBuilder()
            .setTitle('Information Request')
            .setDescription('Retrieving')
            .setColor('#6d472b');
            await interaction.editReply({ content: '', embeds: [Embed], components: [] });
            await client.servers_link[collected].infoRequest({ request: db_discord_link }, interaction);
        }
    }
}
