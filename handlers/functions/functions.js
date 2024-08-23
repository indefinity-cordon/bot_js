const Discord = require('discord.js');
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

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
    };
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
    };
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
    };

    client.generateEmbed = async function (start, end, lb, title, interaction) {
        const current = lb.slice(start, end + 10);
        const result = current.join("\n");

        let embed = client.templateEmbed()
            .setTitle(`${title}`)
            .setDescription(`${result.toString()}`);

        return embed;
    };


    client.onSelectMenu = async function (interaction, menu) {
        // Implementation that waits for the user's selection
        const filter = i => i.customId === menu.customId && i.user.id === interaction.user.id;
        const collected = await interaction.channel.awaitMessageComponent({ filter, componentType: 'SELECT_MENU', time: 60000 });
        return collected.values[0];
    }

    client.sendInteractionSelectMenu = async function (interaction, customId, customDesc, customOptions, customContent) {
        const menu = new StringSelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder(customDesc)
            .addOptions(customOptions);

        if (client.activeCollectors && client.activeCollectors[interaction.user.id]) {
            client.activeCollectors[interaction.user.id].stop();
        }

        const filter = collected => collected.customId === customId && collected.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });
        client.activeCollectors = client.activeCollectors || {};
        client.activeCollectors[interaction.user.id] = collector;

        await interaction.reply({
            content: customContent,
            components: [new ActionRowBuilder().addComponents(menu)],
            ephemeral: true
        });

        collector.on('end', async collected => {
            if (collected.size === 0) {
                await collected.deferUpdate();
                await collected.editReply({ content: 'Time ran out! Please try again.', components: [] });
            }
            delete client.activeCollectors[interaction.user.id];
        });

        return await onSelectMenu(interaction, menu);
    }

    client.sendInteractionConfirm = async function (interaction, message) {
        const buttons = new ActionRowBuilder()
            .addComponents(
                new MessageButton()
                    .setCustomId('confirm')
                    .setLabel('Confirm')
                    .setStyle('SUCCESS'),
                new MessageButton()
                    .setCustomId('cancel')
                    .setLabel('Cancel')
                    .setStyle('DANGER')
            );
    
        await interaction.reply({ content: message, components: [buttons], ephemeral: true });
    
        const filter = i => i.user.id === interaction.user.id;
        const collected = await interaction.channel.awaitMessageComponent({ filter, componentType: 'BUTTON', time: 60000 });
    
        if (collected.customId === 'confirm') {
            return true;
        } else {
            return false;
        }
    }

}
