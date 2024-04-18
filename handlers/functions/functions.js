const Discord = require('discord.js');
//const fetch = require("node-fetch");

module.exports = async (client) => {
    //----------------------------------------------------------------//
    //                         Permissions                            //
    //----------------------------------------------------------------//
    // All bitfields to name
    client.bitfieldToName = function (bitfield) {
        const permissions = new Discord.PermissionsBitField(bitfield);
        return permissions.toArray();
    }
    client.checkPerms = async function ({
        flags: flags,
        perms: perms
    }, interaction) {
        for (let i = 0; i < flags.length; i++) {
            if (!interaction.member.permissions.has(flags[i])) {
                client.errMissingPerms({
                    perms: client.bitfieldToName(flags[i]) || flags[i],
                    type: 'editreply'
                }, interaction);

                return false
            }
            if (!interaction.guild.members.me.permissions.has(flags[i])) {
                client.errNoPerms({
                    perms: client.bitfieldToName(flags[i]) || flags[i],
                    type: 'editreply'
                }, interaction);

                return false
            }
        }
    }
    client.checkBotPerms = async function ({
        flags: flags,
        perms: perms
    }, interaction) {
        for (let i = 0; i < flags.length; i++) {
            if (!interaction.guild.members.me.permissions.has(flags[i])) {
                client.errNoPerms({
                    perms: client.bitfieldToName(flags[i]) || flags[i],
                    type: 'editreply'
                }, interaction);

                return false
            }
        }
    }
    client.checkUserPerms = async function ({
        flags: flags,
        perms: perms
    }, interaction) {
        for (let i = 0; i < flags.length; i++) {
            if (!interaction.member.permissions.has(flags[i])) {
                client.errMissingPerms({
                    perms: client.bitfieldToName(flags[i]) || flags[i],
                    type: 'editreply'
                }, interaction);

                return false
            }
        }
    }

    client.loadSubcommands = async function (client, interaction, args) {
        try {
            return require(`${process.cwd()}/commands/${interaction.commandName}/${interaction.options.getSubcommand()}`)(client, interaction, args).catch(err => {
                client.emit("errorCreate", err, interaction.commandName, interaction);
            });
        }
        catch {
            return require(`${process.cwd()}/commands/${interaction.commandName}/${interaction.options.getSubcommand()}`)(client, interaction, args).catch(err => {
                client.emit("errorCreate", err, interaction.commandName, interaction);
            });
        }
    }

    client.generateEmbed = async function (start, end, lb, title, interaction) {
        const current = lb.slice(start, end + 10);
        const result = current.join("\n");

        let embed = client.templateEmbed()
            .setTitle(`${title}`)
            .setDescription(`${result.toString()}`);

        return embed;
    }
}
