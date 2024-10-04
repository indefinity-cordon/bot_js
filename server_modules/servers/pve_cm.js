module.exports = async (client, game_server) => {
    game_server.tgsActions = async function (interaction) {
        const collected = await client.sendInteractionSelectMenu(interaction, 'select-action', 'Select action', client.handling_tgs, 'Please select action to perform:');
        if (collected) {
            await await client.handling_tgs_actions[collected](global.discord_server.settings_data.tgs_address, game_server.data.tgs_id, interaction);
        }
    };

    game_server.handling_actions = {
        'manage_tgs': game_server.tgsActions,
    };

    game_server.handling_commands = [
        { label: 'Manage TGS', value: 'manage_tgs' }
    ];

    game_server.serverCustomOperators = async function () {
    };
};