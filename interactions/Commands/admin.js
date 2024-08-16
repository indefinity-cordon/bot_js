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

        const member = interaction.member;
        const roleCache = new Map();

        const availableCommands = [];
        for (const command of global.handling_commands) {
            if (command.role_req) {
                let roleId = roleCache.get(command.role_req);

                if (!roleId) {
                    const roleResult = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = ?", params: [command.role_req] });
                    roleId = roleResult[0]?.param;
                    roleCache.set(command.role_req, roleId);
                }

                if (roleId && member.roles.cache.has(roleId)) {
                    availableCommands.push(command);
                }
            } else {
                availableCommands.push(command);
            }
        }

        if (availableCommands.length === 0) {
            return interaction.reply({ content: "You don't have permission to use any admin commands.", ephemeral: true });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select-command')
            .setPlaceholder('Select command')
            .addOptions(availableCommands);

        const row = new ActionRowBuilder()
            .addComponents(selectMenu);

        if (client.activeCollectors && client.activeCollectors[interaction.user.id]) {
            client.activeCollectors[interaction.user.id].stop();
        }

        const filter = collected => collected.customId === 'select-command' && collected.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });
        client.activeCollectors = client.activeCollectors || {};
        client.activeCollectors[interaction.user.id] = collector;

        await interaction.reply({
            content: 'Please select a command:',
            components: [row],
            ephemeral: true
        });

        collector.on('collect', async collected => {
            const selectedCommand = collected.values[0];
            await collected.deferUpdate();

            if (global.handling_commands_actions[selectedCommand]) {
                await global.handling_commands_actions[selectedCommand](collected);
            }

            const errorEmbed = new EmbedBuilder()
                .setTitle('Status')
                .setDescription('Executed... probably.')
                .setColor('#6d472b');

            await collected.editReply({ content: '', embeds: [errorEmbed], components: [] });
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: 'Time ran out! Please try again.', components: [] });
            }
            delete client.activeCollectors[interaction.user.id];
        });
    }
}