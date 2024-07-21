const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');

let servers_options = [];
let servers_reverse_options = [];
for (const server of global.handling_game_servers) {
    servers_options.push({
        name: `${server.server_name}`,
        value: `${server.db_name}`
    });
    servers_reverse_options[`${server.server_name}`] = `${server.db_name}`; // Fix for discord.js issue, it's not returning right value
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Order information about yourself')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Select user to show info about')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('server')
                .setDescription('Select game server')
                .setRequired(true)
                .addChoices(...servers_options)
        )
    ,

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        await interaction.deferReply({ ephemeral: true });
        await client.ephemeralEmbed({
            title: `Information Request`,
            desc: `In progress...`,
            color: `#6d472b`
        }, interaction);
        const user = await interaction.options.getUser('user');
        let server = await interaction.options.getString('server');
        if (server in servers_reverse_options) {
            server = servers_reverse_options[server];
        }
        const db_discord_link = await new Promise((resolve, reject) => {
            global.database.query("SELECT player_id, discord_id, role_rank, stable_rank FROM discord_links WHERE discord_id = ?", [user.id], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        if (!db_discord_link[0] || !db_discord_link[0].discord_id) {
            client.ephemeralEmbed({
                title: `Information Request`,
                desc: `This is user don't have linked game profile`,
                color: `#6d472b`
            }, interaction);
            return;
        }
        client.ephemeralEmbed({
            title: `Information Request`,
            desc: `Connecting to database...`,
            color: `#8f0c0c`
        }, interaction);
        const db_status = await new Promise((resolve, reject) => {
            global.game_database.changeUser({database : server}, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        if (!db_status) {
            client.ephemeralEmbed({
                title: `Information Request`,
                desc: `Cannot connect to database...`,
                color: `#8f0c0c`
            }, interaction);
            return;
        }
        if (server in global.servers_link) {
            global.servers_link[server].infoRequest({request: db_discord_link}, interaction)
        } else {
            client.ephemeralEmbed({
                title: `Information Request`,
                desc: `Warning, server selection error, try again later if problem persist report it to devs`,
                color: `#6d472b`
            }, interaction);
        }
    }
}
