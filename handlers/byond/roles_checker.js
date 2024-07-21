const Discord = require('discord.js');

module.exports = async (client) => {
    client.on(Discord.Events.ClientReady, async () => {
        setTimeout(updateRoles, 10000, client);
        setInterval(
            updateRoles,
            3600000,
            client
        );
    });
};

async function updateRoles(client) {
    let bot_settings = await new Promise((resolve, reject) => {
        global.database.query("SELECT param FROM settings WHERE name = 'main_server'", [], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
    const db_status = await new Promise((resolve, reject) => {
        global.game_database.changeUser({database : global.servers_link[bot_settings[0].param].database}, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
    if (!db_status) {
        client.ephemeralEmbed({
            title: `Information Request`,
            desc: `Cannot connect to database...`,
            color: `#8f0c0c`
        }, interaction);
        return;
    }
    const db_roles = await new Promise((resolve, reject) => {
        global.game_database.query("SELECT role_id, rank FROM discord_ranks ORDER BY rank", [], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
    bot_settings = await new Promise((resolve, reject) => {
        global.game_database.query("SELECT param FROM settings WHERE name = 'main_guild'", [], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
    const guild = client.guilds.cache.get(bot_settings[0].param);
    const members = await guild.members.fetch();
    members.forEach(async (member) => {
        let discord_link = await new Promise((resolve, reject) => {
            global.game_database.query("SELECT stable_rank FROM discord_links WHERE discord_id = ?", [member.id], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        if (discord_link[0]) {
            let rank = discord_link[0].stable_rank;
            member.roles.cache.forEach(async (role) => {
                const matchingRole = db_roles.find(row => row.role_id === role.id);
                if (matchingRole && rank < matchingRole.rank) {
                    rank = matchingRole.rank;
                }
            });
            await new Promise((resolve, reject) => {
                global.game_database.query("UPDATE discord_links SET role_rank = ? WHERE discord_id = ?", [rank, member.id], (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        }
    });
};
