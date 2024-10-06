module.exports = async (client) => {
    global.handling_commands_actions['manage_servers'] = handleServerManagement;
    global.handling_commands.push({ label: 'Manage Servers', value: 'manage_servers', role_req: 'admin_role_id' });

    async function handleServerManagement(interaction, discord_server) {
        let options = [];
        for (const server_name in global.servers_link) {
            if (global.servers_link[server_name].data.guild !== discord_server.id) continue;
            options.push({ label: server_name, value: server_name});
        }
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
