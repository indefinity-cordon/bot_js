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
        let bot_settings = await client.databaseRequest({ database: client.database, query: "SELECT param FROM settings WHERE name = 'main_server'", params: [] });
        const game_database = client.servers_link[bot_settings[0].param].game_connection;
        const identifier = await interaction.options.getString('identifier');
        let db_response = await client.databaseRequest({ database: game_database, query: "SELECT player_id, discord_id, role_rank, stable_rank FROM discord_links WHERE discord_id = ?", params: [interaction.user.id] });
        if (db_response[0] && db_response[0].discord_id) {
            const interactionUser = await interaction.guild.members.fetch(interaction.user.id)
            bot_settings = await client.databaseRequest({ database: client.database, query: "SELECT param FROM settings WHERE name = 'verified_role'", params: [] });
            interactionUser.roles.add(bot_settings[0].param)
            bot_settings = await client.databaseRequest({ database: client.database, query: "SELECT param FROM settings WHERE name = 'anti_verified_role'", params: [] });
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
        db_response = await client.databaseRequest({ database: game_database, query: "SELECT playerid, realtime, used FROM discord_identifiers WHERE identifier = ?", params: [identifier] });
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
        db_response = await client.databaseRequest({ database: game_database, query: "SELECT player_id, discord_id FROM discord_links WHERE player_id = ?", params: [player_id] });
        if (db_response[0] && db_response[0].discord_id) {
            client.ephemeralEmbed({
                title: `Verification`,
                desc: `You already verified`
            }, interaction);
        } else {
            if (db_response[0]) {
                await client.databaseRequest({ database: game_database, query: "UPDATE discord_links SET discord_id = ? WHERE player_id = ?", params: [interaction.user.id, player_id] });
            } else {
                await client.databaseRequest({ database: game_database, query: "INSERT INTO discord_links (player_id, discord_id) VALUES (?, ?)", params: [player_id, interaction.user.id] });
            }
            await client.databaseRequest({ database: game_database, query: "UPDATE discord_identifiers SET used = 1 WHERE identifier = ?", params: [identifier] });
            const interactionUser = await interaction.guild.members.fetch(interaction.user.id);
            bot_settings = await client.databaseRequest({ database: client.database, query: "SELECT param FROM settings WHERE name = 'verified_role'", params: [] });
            interactionUser.roles.add(bot_settings[0].param);
            bot_settings = await client.databaseRequest({ database: client.database, query: "SELECT param FROM settings WHERE name = 'anti_verified_role'", params: [] });
            interactionUser.roles.remove(bot_settings[0].param);
            client.ephemeralEmbed({
                title: `Verification`,
                desc: `You successfully verified`
            }, interaction);
        }
    },
};