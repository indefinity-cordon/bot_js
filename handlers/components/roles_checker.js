const Discord = require('discord.js');

module.exports = async (client) => {
    client.serverRoles = async function ({
        game_server: game_server
    }) {
        clearInterval(game_server.update_roles_interval);
        await updateRoles(client, game_server)
        game_server.update_roles_interval = setInterval(
            updateRoles,
            3600000,
            client,
            game_server
        );
    };
}

async function updateRoles(client, game_server) {
    const db_roles = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT role_id, rank_id FROM discord_ranks ORDER BY rank_id", params: []})
    const guild = client.guilds.cache.get(game_server.guild);
    const members = await guild.members.fetch();
    members.forEach(async (member) => {
        let discord_link = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT stable_rank FROM discord_links WHERE discord_id = ?", params: [member.id]})
        if (discord_link[0]) {
            let rank_id = discord_link[0].stable_rank;
            member.roles.cache.forEach(async (role) => {
                const matchingRole = db_roles.find(row => row.role_id === role.id);
                if (matchingRole && rank_id < matchingRole.rank_id) {
                    rank_id = matchingRole.rank_id;
                }
            });
            await new client.databaseRequest({ database: game_server.game_connection, query: "UPDATE discord_links SET role_rank = ? WHERE discord_id = ?", params: [rank_id, member.id]})
        }
    });
};    