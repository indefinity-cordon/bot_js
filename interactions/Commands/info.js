const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Order information about yourself')
    ,

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        await interaction.deferReply({ ephemeral: true });
        client.simpleEmbed({
            title: `Info`,
            desc: `Lolllll`,
            type: 'ephemeraledit'
        }, interaction);
        //put here req in db and set cool message
    },
};
