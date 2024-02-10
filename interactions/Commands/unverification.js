const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unverify')
        .setDescription('Unverify your discord account')
        .addStringOption(option =>option.setName('secret').setDescription('Your byond account secret').setRequired(true))
    ,

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        await interaction.deferReply({ ephemeral: true });
        client.simpleEmbed({
            title: `Verification`,
            desc: `In progress...`,
            type: 'ephemeraledit'
        }, interaction);
        const secret = await interaction.options.getString('secret');
        let existed = 2;
        if(secret === 0) {
            existed = 2;
        } else {
            const result = await new Promise((resolve, reject) => {
                global.database.query("SELECT ckey, discordid FROM discord_links WHERE randomid = ?", [secret], (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
            if (!result[0]) {
                existed = 2;
            } else if (!result[0].discordid) {
                existed = 1;
            } else if (result[0].discordid !== interaction.user.id) {
                existed = 2;
            }
        }
        switch (existed) {
            case 0:
                await new Promise((resolve, reject) => {
                    global.database.query("UPDATE discord_links SET discordid = ? WHERE randomid = ?", [0, secret], (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            client.simpleEmbed({
                                title: `Verification`,
                                desc: `You successfully unverified`,
                                type: 'ephemeraledit'
                            }, interaction);
                            resolve(result);
                        }
                    });
                });
                break;
            case 1:
                client.simpleEmbed({
                    title: `Verification`,
                    desc: `You already unverified`,
                    type: 'ephemeraledit'
                }, interaction);
                break;
            case 2:
                client.simpleEmbed({
                    title: `Verification`,
                    desc: `Wrong secret`,
                    type: 'ephemeraledit'
                }, interaction);
                break;
        }
    },
};