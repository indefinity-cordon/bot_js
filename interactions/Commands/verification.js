const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verify your discord account')
        .addStringOption(option =>option.setName('identifier').setDescription('Your byond account identifier').setRequired(true))
    ,

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        await interaction.deferReply({ ephemeral: true });
        client.vereficationEmbed({
            desc: `In progress...`
        }, interaction);
        const identifier = await interaction.options.getString('identifier');
        let db_response;
        let player_id = 0;
        let existed = 0;
        if(identifier === 0) {
            existed = 2;
        } else {
            db_response = await new Promise((resolve, reject) => {
                global.database.query("SELECT playerid, realtime, used FROM discord_identifiers WHERE identifier = ?", [identifier], (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
            if (!db_response[0] || db_response[0].used) {
                existed = 2;
            } else if (db_response[0].realtime + 14400000 < new Date().toLocaleTimeString()) {
                existed = 1;
            } else {
                player_id = db_response.playerid;
            }
        }
        switch (existed) {
            case 0:
                db_response = await new Promise((resolve, reject) => {
                    global.database.query("SELECT player_id, discord_id, rank, stable_rank FROM discord_links WHERE player_id = ?", [player_id], (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });
                if (db_response[0]) {
                    client.vereficationEmbed({
                        desc: `You already verified`
                    }, interaction);
                } else {
                    await new Promise((resolve, reject) => {
                        global.database.query("INSERT INTO discord_links SET player_id = ?, discordid = ?", [player_id, interaction.user.id], (err, result) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(result);
                            }
                        });
                    });
                    await new Promise((resolve, reject) => {
                        global.database.query("UPDATE discord_identifiers SET used = 1 WHERE playerid = ?", [playerid], (err, result) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(result);
                            }
                        });
                    });
                    interaction.user.roles.add(interaction.options.getRole(client.config.verified_role))
                    interaction.user.roles.remove(interaction.options.getRole(client.config.anti_verified_role))
                    client.vereficationEmbed({
                        desc: `You successfully verified`
                    }, interaction);
                }
                break;
            case 1:
                client.vereficationEmbed({
                    desc: `Time out, order new in game`
                }, interaction);
                break;
            case 2:
                client.vereficationEmbed({
                    desc: `Wrong identifier`
                }, interaction);
                break;
        }
    },
};