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
        global.database.query("SELECT discordroleid, level FROM sublevels ORDER BY level", [], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
/*
Return it back, when you need handle multiguilds donation statuses... why? idk.
    var members_sublevel = [];
    client.guilds.cache.forEach(async (guild) => {
*/
    const guild = client.guilds.cache.get(client.config.main_guild);
    const members = await guild.members.fetch();
    members.forEach(async (member) => {
        const discord_link = await new Promise((resolve, reject) => {
            global.database.query("SELECT ckey, stablelevel FROM discord_links WHERE discordid = ?", [member.id], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        if (discord_link[0] && discord_link[0].stablelevel === 0) {
            var sublevel = 0;
            member.roles.cache.forEach(async (role) => {
                const matchingRole = dbroles.find(row => row.discordroleid === role.id);
                if (matchingRole && sublevel < matchingRole.level) {
                    sublevel = matchingRole.level;
                }
            });
/*
            if(members_sublevel[member.id]) {
                if(members_sublevel[member.id] < sublevel) {
                    members_sublevel[member.id] = sublevel;
                }
            } else {
                members_sublevel[member.id] = sublevel;
            }
*/
            await new Promise((resolve, reject) => {
                global.database.query("UPDATE discord_links SET sublevel = ? WHERE discordid = ?", [sublevel, member.id], (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        }
    });
//    });
};
