const { Client, SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, InteractionType, CommandInteraction, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Use admin command'),

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        if (interaction.type !== InteractionType.ApplicationCommand) return;

        const member = interaction.member;
        const roleCache = new Map();

        const availableCommands = [];
        for (const command of client.handling_commands) {
            if (command.role_req) {
                let roleId = roleCache.get(command.role_req);

                if (!roleId) {
                    const roleResult = await client.databaseSettingsRequest(command.role_req);
                    roleId = roleResult[0]?.param;
                    roleCache.set(command.role_req, roleId);
                }

                if (roleId && member.roles.cache.has(roleId)) {
                    availableCommands.push(command);
                }
            } else {
                availableCommands.push(command);
            }
        }

        if (availableCommands.length === 0) {
            return interaction.reply({ content: "You don't have permission to use any admin commands.", ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        const collected = await client.sendInteractionSelectMenu(interaction, `select-command`, 'Select command', availableCommands, 'Please select command:');
        if (collected) {
            await client.handling_commands_actions[collected](interaction);
        }
    }
}