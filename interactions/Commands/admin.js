const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Use admin command')
    ,

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        if (interaction.type !== InteractionType.ApplicationCommand) return;

        const user = interaction.options.getUser('user');
        const tgs_role_id = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_role_id'", params: []})
        let matchingRole = 0
        member.roles.cache.forEach(async (role) => {
            if (role.id === tgs_role_id[0].param) {
                matchingRole = 1
            }
        });
        if (!matchingRole) return;

        // Create the select menu
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select-command')
            .setPlaceholder('Select command')
            .addOptions(global.handling_commands);

        const row = new ActionRowBuilder()
            .addComponents(selectMenu);

        await interaction.reply({
            content: 'Please select a command:',
            components: [row],
            ephemeral: true
        }); 

        // Handle the select menu interaction
        const filter = i => i.customId === 'select-command' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            const selectedCommand = i.values[0];

            await i.deferUpdate();

            const db_discord_link = await client.databaseRequest({ database: global.database, query: "SELECT player_id, discord_id, role_rank, stable_rank FROM discord_links WHERE discord_id = ?", params: [user.id]})

            if (!db_discord_link[0] || !db_discord_link[0].discord_id) {
                const noLinkEmbed = new EmbedBuilder()
                    .setTitle('Information Request')
                    .setDescription('This user does not have a linked game profile')
                    .setColor('#6d472b');

                await i.editReply({ embeds: [noLinkEmbed], components: [] });
                return;
            }

            if (selectedCommand in global.handling_commands) {
                global.handling_commands_actions[selectedCommand]();
            } else {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('Information Request')
                    .setDescription('Warning, server selection error. Try again later, and if the problem persists, report it to the developers.')
                    .setColor('#6d472b');

                await i.editReply({ embeds: [errorEmbed], components: [] });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: 'Time ran out! Please try again.', components: [] });
            }
        });
    }
}
