const Discord = require('discord.js');
const config = require("../../config/bot.js");

module.exports = async (client) => {
    client.on(Discord.Events.ClientReady, async () => {
        setInterval(
            updateRoles,
            3600000,
            client
        );
    });
};

async function updateRoles(client) {
    const dbroles = await new Promise((resolve, reject) => {
        global.database.query("SELECT discord_role_ids, rank FROM ranks ORDER BY rank", [], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
    const guild = client.guilds.cache.get(client.config.main_guild);
    const members = await guild.members.fetch();
    members.forEach(async (member) => {
        let discord_link = await new Promise((resolve, reject) => {
            global.database.query("SELECT player_id, stable_rank FROM discord_links WHERE discord_id = ?", [member.id], (err, result) => {
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
                const matchingRole = dbroles.find(row => row.discord_role_ids === role.id);
                if (matchingRole && rank < matchingRole.rank) {
                    rank = matchingRole.rank;
                }
            });
            await new Promise((resolve, reject) => {
                global.database.query("UPDATE discord_links SET rank = ? WHERE discord_id = ?", [rank, member.id], (err, result) => {
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
