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
        let bot_settings = await client.databaseSettingsRequest("main_server");
        const game_database = client.servers_link[bot_settings[0].param].game_connection;
        const identifier = await interaction.options.getString('identifier');
        let db_response = await client.databaseRequest(game_database, "SELECT player_id, discord_id, role_rank, stable_rank FROM discord_links WHERE discord_id = ?", [interaction.user.id]);
        if (db_response[0] && db_response[0].discord_id) {
            const interactionUser = await interaction.guild.members.fetch(interaction.user.id)
            bot_settings = await client.databaseSettingsRequest("verified_role");
            interactionUser.roles.add(bot_settings[0].param)
            bot_settings = await client.databaseSettingsRequest("anti_verified_role");
            interactionUser.roles.remove(bot_settings[0].param)
            client.ephemeralEmbed({
                title: `Verification`,
                desc: `You already verified`
            }, interaction);
            return;
        }
        let player_id = 0;
        if (identifier === 0) {
            client.ephemeralEmbed({
                title: `Verification`,
                desc: `Wrong identifier`
            }, interaction);
            return;
        }
        db_response = await client.databaseRequest(game_database, "SELECT playerid, realtime, used FROM discord_identifiers WHERE identifier = ?", [identifier]);
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
        player_id = db_response[0].playerid;
        db_response = await client.databaseRequest(game_database, "SELECT player_id, discord_id FROM discord_links WHERE player_id = ?", [player_id]);
        if (db_response[0] && db_response[0].discord_id) {
            client.ephemeralEmbed({
                title: `Verification`,
                desc: `You already verified`
            }, interaction);
        } else {
            if (db_response[0]) {
                await client.databaseRequest(game_database, "UPDATE discord_links SET discord_id = ? WHERE player_id = ?", [interaction.user.id, player_id]);
            } else {
                await client.databaseRequest(game_database, "INSERT INTO discord_links (player_id, discord_id) VALUES (?, ?)", [player_id, interaction.user.id]);
            }
            await client.databaseRequest(game_database, "UPDATE discord_identifiers SET used = 1 WHERE identifier = ?", [identifier]);
            const interactionUser = await interaction.guild.members.fetch(interaction.user.id);
            bot_settings = await client.databaseSettingsRequest("verified_role");
            interactionUser.roles.add(bot_settings[0].param);
            bot_settings = await client.databaseSettingsRequest("anti_verified_role");
            interactionUser.roles.remove(bot_settings[0].param);
            client.ephemeralEmbed({
                title: `Verification`,
                desc: `You successfully verified`
            }, interaction);
        }
    },
};