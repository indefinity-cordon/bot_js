module.exports = async (client) => {
    client.handling_commands_actions.push({ 'manage_servers': handleServerManagement });
    client.handling_commands.push({ label: 'Manage Servers', value: 'manage_servers', role_req: 'admin_role_id' });

    async function handleServerManagement(interaction) {
        let options = []
        const server = await client.sendInteractionSelectMenu(interaction, 'select-server', 'Select a game server', options, 'Please select a server:');
        if (server) {
            if(!global.servers_link[server].handling_commands || !global.servers_link[server].handling_commands.length) {
                interaction.editReply({ content: 'No commands found for this server.', components: [] });
                return;
            }
            const collected = await client.sendInteractionSelectMenu(interaction, 'select-action', 'Select action', global.servers_link[server].handling_commands, 'Please select action to perform:');
            if (collected) {
                await global.servers_link[server].handling_actions[collected](interaction);
            }
        }
    };
};
