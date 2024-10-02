module.exports = async (client, game_server) => {
    game_server.tgsActions = async function (interaction) {
        const collected = await client.sendInteractionSelectMenu(interaction, 'select-action', 'Select action', client.handling_tgs, 'Please select action to perform:');
        if (collected) {
            await await client.handling_tgs_actions[collected](interaction, game_server.data.tgs_id);
        }
    };

    game_server.handling_actions = {
        'manage_tgs': game_server.tgsActions,
    };

    game_server.handling_commands = [
        { label: 'Manage TGS', value: 'manage_tgs' }
    ];
};