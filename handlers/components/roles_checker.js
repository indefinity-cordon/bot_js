module.exports = async (client) => {
    client.serverRoles = async function (game_server) {
        clearInterval(game_server.update_roles_interval);
        game_server.update_roles_interval = setInterval(
            updateRoles,
            60 * 60000, // Каждые N минут (первое число)
            client,
            game_server
        );
    };
}

async function updateRoles(client, game_server) {
    try {
        let db_roles, db_links, guild;
        try {
            db_roles = await client.mysqlRequest(game_server.game_connection, "SELECT role_id, rank_id FROM discord_ranks", []);
            if (!db_roles.length) throw 'No discord ranks';
            guild = await client.guilds.cache.get(game_server.guild);
            if (!guild) throw 'No guild';
            db_links = await client.mysqlRequest(game_server.game_connection, "SELECT discord_id, stable_rank FROM discord_links", []);
            if (!db_links.length) throw 'No discord links';
        } catch (cancel_reason) {
            console.log('Roles >> [ERROR] >>', cancel_reason);
            return;
        }

        const rolesMap = new Map();
        db_roles.forEach(row => {
            rolesMap.set(row.role_id, row.rank_id);
        });
        const discordLinksMap = new Map();
        db_links.forEach(link => {
            discordLinksMap.set(link.discord_id, link.stable_rank);
        });

        const totalMembers = guild.memberCount;
        let processedMembers = 0;
        async function processBatch(membersBatch) {
            const updates = [];
            for (const member of membersBatch.values()) {
                const stable_rank = discordLinksMap.get(member.id);
                if (stable_rank !== undefined) {
                    let rank_id = stable_rank;
                    member.roles.cache.forEach(role => {
                        const roleRankId = rolesMap.get(role.id);
                        if (roleRankId && rank_id < roleRankId) {
                            rank_id = roleRankId;
                        }
                    });
                    if (rank_id !== stable_rank) {
                        updates.push([rank_id, member.id]);
                    }
                }
            }
            if (updates.length) {
                for (const [rank_id, discord_id] of updates) {
                    client.mysqlRequest(game_server.game_connection, "UPDATE discord_links SET role_rank = ? WHERE discord_id = ?", [rank_id, discord_id]);
                }
            }
        }
        async function fetchAndProcessMembers() {
            let after = null;
            do {
                const members = await guild.members.list({ limit: 1000, time: 5 * 60000, after });
                if (members.size === 0) break;
                await processBatch(members);
                processedMembers += members.size;
                after = members.last().id;
            } while (processedMembers < totalMembers);
        }
        await fetchAndProcessMembers();
    } catch (error) {
        console.log('Roles >> [ERROR] >>', error);
    }
};