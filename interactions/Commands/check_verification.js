const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('check-verify')
        .setDescription('Check verification of your discord account')
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
        const db_response = await new Promise((resolve, reject) => {
            global.database.query("SELECT player_id, discord_id, rank, stable_rank FROM discord_links WHERE discord_id = ?", [interaction.user.id], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        if (db_response[0]) {
            interaction.user.roles.add(interaction.options.getRole(client.config.verified_role))
            interaction.user.roles.remove(interaction.options.getRole(client.config.anti_verified_role))
            client.vereficationEmbed({
                desc: `You already verified`
            }, interaction);
        } else {
            client.vereficationEmbed({
                desc: `You need verify, you don't have linked game account`
            }, interaction);
        }
    },
};