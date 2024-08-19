module.exports = async (client) => {
    client.serverRoles = async function ({
        game_server: game_server
    }) {
        clearInterval(game_server.update_roles_interval);
        await updateRoles(client, game_server)
        game_server.update_roles_interval = setInterval(
            updateRoles,
            60 * 60 * 1000, // Каждые N минут (первое число)
            client,
            game_server
        );
    };
}

async function updateRoles(client, game_server) {
    const db_roles = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT role_id, rank_id FROM discord_ranks ORDER BY rank_id", params: []});
    if ( !db_roles[0] ) return;
    const guild = await client.guilds.cache.get(game_server.guild);
    if ( !guild ) return;
    const members = await guild.members.fetch({ time: 5 * 60 * 1000 }); // Ждем N минут (первое число)
    if ( !members ) return;
    const roleMap = new Map();
    db_roles.forEach(row => {
        roleMap.set(row.role_id, row.rank_id);
    });
    for (const [memberId, member] of members) {
        let discord_link = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT stable_rank FROM discord_links WHERE discord_id = ?", params: [memberId]});
        if (discord_link[0]) {
            let rank_id = discord_link[0].stable_rank;
            member.roles.cache.forEach(role => {
                const matchingRankId = roleMap.get(role.id);
                if (matchingRankId && rank_id < matchingRankId) {
                    rank_id = matchingRankId;
                }
            });
            client.databaseRequest({ database: game_server.game_connection, query: "UPDATE discord_links SET role_rank = ? WHERE discord_id = ?", params: [rank_id, memberId]});
        }
    });
};