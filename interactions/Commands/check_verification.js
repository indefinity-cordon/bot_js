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
        await client.vereficationEmbed({
            desc: `In progress...`
        }, interaction);
        const db_response = await new Promise((resolve, reject) => {
            global.database.query("SELECT player_id, discord_id, role_rank, stable_rank FROM discord_links WHERE discord_id = ?", [interaction.user.id], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        if (db_response[0]) {
            const interactionUser = await interaction.guild.members.fetch(interaction.user.id)
            interactionUser.roles.add(client.config.verified_role)
            interactionUser.roles.remove(client.config.anti_verified_role)
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