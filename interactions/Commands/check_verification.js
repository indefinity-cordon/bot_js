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
        await client.ephemeralEmbed({
            title: 'Verification',
            desc: 'In progress...'
        }, interaction);
        const bot_settings = await client.databaseSettingsRequest('main_server');
        const db_response = await client.databaseRequest(client.servers_link[bot_settings[0].param].game_connection, "SELECT player_id, discord_id, role_rank, stable_rank FROM discord_links WHERE discord_id = ?", [interaction.user.id]);
        if (db_response[0] && db_response[0].discord_id) {
            const interactionUser = await interaction.guild.members.fetch(interaction.user.id);
            let bot_settings = await client.databaseSettingsRequest('verified_role');
            interactionUser.roles.add(bot_settings[0].param);
            bot_settings = await client.databaseSettingsRequest('anti_verified_role');
            interactionUser.roles.remove(bot_settings[0].param);
            client.ephemeralEmbed({
                title: 'Verification',
                desc: 'You already verified'
            }, interaction);
            return;
        }
        client.ephemeralEmbed({
            title: 'Verification',
            desc: 'You need verify, you don\'t have linked game account'
        }, interaction);
    },
};