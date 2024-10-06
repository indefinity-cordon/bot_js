const { Client, SlashCommandBuilder, InteractionType, CommandInteraction } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Use admin command')
    ,

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        if (interaction.type !== InteractionType.ApplicationCommand) return;

        let discord_server
        if (interaction.guildId) discord_server = global.guilds_link[`${interaction.guildId}`];
        if (!discord_server) return interaction.reply({ content: 'No support for admin commands in this guild, try in another.', ephemeral: true });

        const member = interaction.member;
        const role_сache = new Map();
        const available_сommands = [];
        for (const command of global.handling_commands) {
            if (command.role_req) {
                let roleId = role_сache.get(command.role_req);
                if (!roleId) {
                    roleId = discord_server.settings_data[command.role_req].data.setting;
                    role_сache.set(command.role_req, roleId);
                }
                if (roleId && member.roles.cache.has(roleId)) {
                    available_сommands.push(command);
                }
            } else {
                available_сommands.push(command);
            }
        }
        if (available_сommands.length === 0) {
            return interaction.reply({ content: 'You don\'t have permission to use any admin commands.', ephemeral: true });
        }
        await interaction.deferReply({ ephemeral: true });
        const collected = await client.sendInteractionSelectMenu(interaction, 'select-command', 'Select command', available_сommands, 'Please select command:');
        if (collected) {
            await global.handling_commands_actions[collected](interaction, discord_server);
        }
    }
}