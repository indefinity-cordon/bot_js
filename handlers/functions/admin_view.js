const Discord = require('discord.js');

module.exports = async (client) => {
    client.handleServerDataSelection = async function (interaction) {
        const options = client.servers_link.map(server => ({
            label: server.server_name,
            value: server.server_name
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`select-server`)
            .setPlaceholder('Select a server')
            .addOptions(options);

        const row = new ActionRowBuilder()
            .addComponents(selectMenu);

        if (client.activeCollectors && client.activeCollectors[interaction.user.id]) {
            client.activeCollectors[interaction.user.id].stop();
        }

        const filter = collected => collected.customId === `select-server` && collected.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });
        client.activeCollectors = client.activeCollectors || {};
        client.activeCollectors[interaction.user.id] = collector;

        await interaction.editReply({
            content: 'Please select a server:',
            components: [row],
            ephemeral: true
        });

        return new Promise((resolve, reject) => {
            collector.on('collect', async collected => {
                await collected.deferUpdate();
                resolve(await handleCommandSelection(client, collected, client.servers_link[collected.values[0]]));
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({ content: 'Time ran out! Please try again.', components: [] });
                }
                delete client.activeCollectors[interaction.user.id];
                reject('No actions done');
            });
        });
    };
    client.handling_commands_actions["admin_data"] = client.handleServerDataSelection;
    client.handling_commands.push({ label: "View Admin Data", value: "admin_data", role_req: "admin_role_id" });
}

async function handleCommandSelection(client, interaction, game_server) {
    if(!game_server.handling_view_commands || !game_server.handling_view_commands.length) {
        interaction.editReply({ content: 'No commands found for this server.', components: [] });
        return;
    }
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`select-action`)
        .setPlaceholder('Select action')
        .addOptions(game_server.handling_view_commands);

    const row = new ActionRowBuilder()
        .addComponents(selectMenu);

    if (client.activeCollectors && client.activeCollectors[interaction.user.id]) {
        client.activeCollectors[interaction.user.id].stop();
    }

    const filter = collected => collected.customId === `select-action` && collected.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });
    client.activeCollectors = client.activeCollectors || {};
    client.activeCollectors[interaction.user.id] = collector;

    await interaction.editReply({
        content: 'Please select action to perform:',
        components: [row],
        ephemeral: true
    });

    return new Promise((resolve, reject) => {
        collector.on('collect', async collected => {
            await collected.deferUpdate();
            if (game_server.handling_view_actions[collected.values[0]]) {
                interaction.editReply({ content: 'Action performed.', components: [] });
                resolve(await game_server.handling_view_actions[collected.values[0]](client, interaction));
            }
            reject('No actions done');
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: 'Time ran out! Please try again.', components: [] });
            }
            delete client.activeCollectors[interaction.user.id];
            reject('No actions done');
        });
    });
};
