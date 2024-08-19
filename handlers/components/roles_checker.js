const Discord = require('discord.js');
const chalk = require('chalk');

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
    try {
        console.log(chalk.blue(chalk.bold(`Roles Sync`)), (chalk.white(`>>`)), chalk.blue(`[STARTING]`), (chalk.white(`>>`)), chalk.red(`Prepairing for roles update`));
        const db_roles = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT role_id, rank_id FROM discord_ranks ORDER BY rank_id", params: [] });
        if ( !db_roles[0] ) return;
        const guild = await client.guilds.cache.get(game_server.guild);
        if ( !guild ) return;

        const roleMap = new Map();
        db_roles.forEach(row => {
            roleMap.set(row.role_id, row.rank_id);
        });

        const discordLinks = await client.databaseRequest({ database: game_server.game_connection, query: "SELECT discord_id, stable_rank FROM discord_links", params: [] });
        const discordLinksMap = new Map();
        discordLinks.forEach(link => {
            discordLinksMap.set(link.discord_id, link.stable_rank);
        });

        const totalMembers = await guild.memberCount;
        let processedMembers = 0;

        async function processBatch(membersBatch) {
            console.log(chalk.blue(chalk.bold(`Roles Sync`)), (chalk.white(`>>`)), chalk.blue(`[PROCESSING]`), (chalk.white(`>>`)), chalk.red(`Members length ${membersBatch.size}`));

            const updates = [];
            for (const member of membersBatch.values()) {
                const stable_rank = discordLinksMap.get(member.id);
                if (stable_rank !== undefined) {
                    let rank_id = stable_rank;

                    member.roles.cache.forEach(role => {
                        const roleRankId = roleMap.get(role.id);
                        if (roleRankId && rank_id < roleRankId) {
                            rank_id = roleRankId;
                        }
                    });

                    if (rank_id !== stable_rank) {
                        updates.push([{ params: [rank_id, member.id] }]);
                    }
                }
            }

            if (updates.length) {
                for (const update of updates) {
                    await client.databaseRequest({ database: game_server.game_connection, query: "UPDATE discord_links SET role_rank = ? WHERE discord_id = ?", params: update.params });
                }
            }
        }

        async function fetchAndProcessMembers() {
            let after = null;
            do {
                const members = await guild.members.list({ limit: 100, time: 5 * 60 * 1000, after });
                if (members.size === 0) break;

                await processBatch(members);

                processedMembers += members.size;
                console.log(chalk.blue(chalk.bold(`Roles Sync`)), (chalk.white(`>>`)), chalk.blue(`[PROCESSING]`), (chalk.white(`>>`)), chalk.red(`Finished processing: ${processedMembers}/${totalMembers} players batch`));

                after = members.last().id;
            } while (processedMembers < totalMembers);
        }

        await fetchAndProcessMembers();

        console.log(chalk.blue(chalk.bold(`Roles Sync`)), (chalk.white(`>>`)), chalk.blue(`[DONE]`), (chalk.white(`>>`)), chalk.red(`Processed total of ${totalMembers} members`));
    } catch (error) {
        console.log(chalk.blue(chalk.bold(`Roles Sync`)), (chalk.white(`>>`)), chalk.blue(`[ERROR]`), (chalk.white(`>>`)), chalk.red(`Something went wrong`));
    }
};