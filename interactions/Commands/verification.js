const { CommandInteraction, SlashCommandBuilder, Client } = require('discord.js');

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
            title: 'Verification',
            desc: 'In progress...'
        }, interaction);
        if (!global.discord_server) return client.ephemeralEmbed({ title: 'Verification', desc: 'No verification for this server', color: '#c70058' }, interaction);
        const identifier = await interaction.options.getString('identifier');
        let db_response;
        for (const server_name in global.servers_link) {
            if (global.servers_link[server_name].data.guild !== global.discord_server.id) return;
            db_response = await global.mysqlRequest(global.servers_link[server_name].game_connection, "SELECT * FROM discord_links WHERE discord_id = ?", [interaction.user.id]);
        }
        if (db_response && db_response[0] && db_response[0].discord_id) {
            const interactionUser = await interaction.guild.members.fetch(interaction.user.id)
            interactionUser.roles.add(global.discord_server.settings_data.verified_role)
            interactionUser.roles.remove(global.discord_server.settings_data.anti_verified_role)
            return client.ephemeralEmbed({
                title: 'Verification',
                desc: 'You already verified'
            }, interaction);
        }
        let player_id = 0;
        if (identifier === 0) {
            client.ephemeralEmbed({
                title: 'Verification',
                desc: 'Wrong identifier'
            }, interaction);
            return;
        }
        db_response = await global.mysqlRequest(game_database, "SELECT playerid, realtime, used FROM discord_identifiers WHERE identifier = ?", [identifier]);
        if (!db_response[0] || db_response[0].used) {
            client.ephemeralEmbed({
                title: 'Verification',
                desc: 'Wrong identifier'
            }, interaction);
            return;
        } else if (db_response[0].realtime + 240 * 60000 < new Date().toLocaleTimeString()) {
            client.ephemeralEmbed({
                title: 'Verification',
                desc: 'Time out, order new in game'
            }, interaction);
            return;
        }
        player_id = db_response[0].playerid;
        db_response = await global.mysqlRequest(game_database, "SELECT player_id, discord_id FROM discord_links WHERE player_id = ?", [player_id]);
        if (db_response[0] && db_response[0].discord_id) {
            client.ephemeralEmbed({
                title: 'Verification',
                desc: 'You already verified'
            }, interaction);
        } else {
            if (db_response[0]) {
                await global.mysqlRequest(game_database, "UPDATE discord_links SET discord_id = ? WHERE player_id = ?", [interaction.user.id, player_id]);
            } else {
                await global.mysqlRequest(game_database, "INSERT INTO discord_links (player_id, discord_id) VALUES (?, ?)", [player_id, interaction.user.id]);
            }
            await global.mysqlRequest(game_database, "UPDATE discord_identifiers SET used = 1 WHERE identifier = ?", [identifier]);
            const interactionUser = await interaction.guild.members.fetch(interaction.user.id);
            interactionUser.roles.add(global.discord_server.settings_data.verified_role)
            interactionUser.roles.remove(global.discord_server.settings_data.anti_verified_role)
            client.ephemeralEmbed({
                title: 'Verification',
                desc: 'You successfully verified'
            }, interaction);
        }
    },
};