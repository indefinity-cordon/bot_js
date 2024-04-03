const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verify your discord account')
        .addStringOption(option => option.setName('identifier').setDescription('Your byond account identifier').setRequired(true))
    ,

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        await interaction.deferReply({ ephemeral: true });
        await client.ephemeralEmbed({
            title: `Verification`,
            desc: `In progress...`
        }, interaction);
        const identifier = await interaction.options.getString('identifier');
        let db_response = await new Promise((resolve, reject) => {
            global.database.query("SELECT player_ckey, discord_id, role_rank, stable_rank FROM discord_links WHERE discord_id = ?", [interaction.user.id], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        if (db_response[0] && db_response[0].discord_id) {
            const interactionUser = await interaction.guild.members.fetch(interaction.user.id)
            interactionUser.roles.add(global.bot_config.verified_role)
            interactionUser.roles.remove(global.bot_config.anti_verified_role)
            client.ephemeralEmbed({
                title: `Verification`,
                desc: `You already verified`
            }, interaction);
            return;
        }
        let player_ckey = 0;
        if(identifier === 0) {
            client.ephemeralEmbed({
                title: `Verification`,
                desc: `Wrong identifier`
            }, interaction);
            return;
        }
        db_response = await new Promise((resolve, reject) => {
            global.database.query("SELECT player_ckey, realtime, used FROM discord_identifiers WHERE identifier = ?", [identifier], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        if (!db_response[0] || db_response[0].used) {
            client.ephemeralEmbed({
                title: `Verification`,
                desc: `Wrong identifier`
            }, interaction);
            return;
        } else if (db_response[0].realtime + 14400000 < new Date().toLocaleTimeString()) {
            client.ephemeralEmbed({
                title: `Verification`,
                desc: `Time out, order new in game`
            }, interaction);
            return;
        }
        player_ckey = db_response[0].player_ckey;
        db_response = await new Promise((resolve, reject) => {
            global.database.query("SELECT player_ckey, discord_id FROM discord_links WHERE player_ckey = ?", [player_ckey], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        if (db_response[0] && db_response[0].discord_id) {
            client.ephemeralEmbed({
                title: `Verification`,
                desc: `You already verified`
            }, interaction);
        } else {
            if (db_response[0]) {
                await new Promise((resolve, reject) => {
                    global.database.query("UPDATE discord_links SET discord_id = ? WHERE player_ckey = ?", [interaction.user.id, player_ckey], (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });
            } else {
                await new Promise((resolve, reject) => {
                    global.database.query("INSERT INTO discord_links (player_ckey, discord_id) VALUES (?, ?)", [player_ckey, interaction.user.id], (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });
            }
            await new Promise((resolve, reject) => {
                global.database.query("UPDATE discord_identifiers SET used = 1 WHERE identifier = ?", [identifier], (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
            const interactionUser = await interaction.guild.members.fetch(interaction.user.id)
            interactionUser.roles.add(global.bot_config.verified_role)
            interactionUser.roles.remove(global.bot_config.anti_verified_role)
            client.ephemeralEmbed({
                title: `Verification`,
                desc: `You successfully verified`
            }, interaction);
        }
    },
};