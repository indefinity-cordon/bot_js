const { Client, SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, InteractionType, CommandInteraction, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Use admin command'),

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        if (interaction.type !== InteractionType.ApplicationCommand) return;

        const tgs_role_id = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_role_id'", params: []});
        const role_id = tgs_role_id[0].param;

        const member = interaction.member;
        let matchingRole = member.roles.cache.has(role_id);

        if (!matchingRole) {
            return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
        }

        if (client.activeCollectors && client.activeCollectors[interaction.user.id]) {
            client.activeCollectors[interaction.user.id].stop();
        }

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

        const filter = i => i.customId === 'select-command' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });
        client.activeCollectors = client.activeCollectors || {};
        client.activeCollectors[interaction.user.id] = collector;

        collector.on('collect', async i => {
            const selectedCommand = i.values[0];

            await i.deferUpdate();

            if (global.handling_commands_actions[selectedCommand]) {
                global.handling_commands_actions[selectedCommand]();
            }

            const errorEmbed = new EmbedBuilder()
                .setTitle('Status')
                .setDescription('Executed... probably.')
                .setColor('#6d472b');

            await i.editReply({ content: '', embeds: [errorEmbed], components: [] });
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: 'Time ran out! Please try again.', components: [] });
            }
            delete client.activeCollectors[interaction.user.id];
        });
    }
}