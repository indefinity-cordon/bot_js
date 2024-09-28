module.exports = async (client) => {
    client.handleServerAdminSelection = async function (interaction) {
        let options = []
        for (const server_name in client.servers_link) {
            options.push({ label: server_name, value: server_name});
        }
        const server = await client.sendInteractionSelectMenu(interaction, 'select-server', 'Select a game server', options, 'Please select a server:');
        if (server) {
            if(!client.servers_link[server].handling_commands || !client.servers_link[server].handling_commands.length) {
                interaction.editReply({ content: 'No commands found for this server.', components: [] });
                return;
            }
        
            const collected = await client.sendInteractionSelectMenu(interaction, 'select-action', 'Select action', client.servers_link[server].handling_commands, 'Please select action to perform:');
            if (collected) {
                await client.servers_link[server].handling_actions[collected](interaction);
            }
        }
    };
    client.handling_commands_actions['admin_actions'] = client.handleServerAdminSelection;
    client.handling_commands.push({ label: 'Admin Actions', value: 'admin_actions', role_req: 'admin_role_id' });
};
