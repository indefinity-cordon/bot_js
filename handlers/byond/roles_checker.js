const Discord = require('discord.js');

module.exports = async (client) => {
    client.on(Discord.Events.ClientReady, async () => {
        updateRoles(client);
        setInterval(
            updateRoles,
            3600000,
            client
        );
    });
};

async function updateRoles(client) {
    const db_roles = await new Promise((resolve, reject) => {
        global.database.query("SELECT role_id, role_rank FROM discord_ranks ORDER BY role_rank", [], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
    const bot_settings = await new Promise((resolve, reject) => {
        global.database.query("SELECT param FROM settings WHERE name = 'main_guild'", [], (err, result) => {
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
            global.database.query("SELECT player_ckey, stable_rank FROM discord_links WHERE discord_id = ?", [member.id], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        if (discord_link[0]) {
            let role_rank = discord_link[0].stable_rank;
            member.roles.cache.forEach(async (role) => {
                const matchingRole = db_roles.find(row => row.role_id === role.id);
                if (matchingRole && role_rank < matchingRole.role_rank) {
                    role_rank = matchingRole.role_rank;
                }
            });
            await new Promise((resolve, reject) => {
                global.database.query("UPDATE discord_links SET role_rank = ? WHERE discord_id = ?", [role_rank, member.id], (err, result) => {
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
