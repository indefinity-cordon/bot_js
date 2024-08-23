const Discord = require('discord.js');
const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = async (client) => {
    //----------------------------------------------------------------//
    //                         Permissions                            //
    //----------------------------------------------------------------//
    // All bitfields to name
    client.bitfieldToName = function (bitfield) {
        const permissions = new Discord.PermissionsBitField(bitfield);
        return permissions.toArray();
    };

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

    //----------------------------------------------------------------//
    //                         Selection Menu                         //
    //----------------------------------------------------------------//
    client.sendInteractionSelectMenu = async function (interaction, customId, customDesc, customOptions, customContent, allowMultiple = false) {
        const menu = new StringSelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder(customDesc)
            .addOptions(customOptions);
        if (allowMultiple) {
            menu.setMinValues(1);
            menu.setMaxValues(customOptions.length);
        }
        if (client.activeCollectors && client.activeCollectors[interaction.user.id]) {
            client.activeCollectors[interaction.user.id].stop();
        }
        const filter = collected => collected.customId === customId && collected.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });
        client.activeCollectors = client.activeCollectors || {};
        client.activeCollectors[interaction.user.id] = collector;
        await interaction.editReply({
            content: customContent,
            components: [new ActionRowBuilder().addComponents(menu)],
            ephemeral: true
        });
        return new Promise((resolve) => {
            collector.on('collect', async collected => {
                await collected.deferUpdate();
                if(allowMultiple) {
                    resolve(collected.values);
                } else {
                    resolve(collected.values[0]);
                }
            });
            collector.on('end', async collected => {
                if (collected.size === 0) {
                    await client.ephemeralEmbed({
                        title: `Request`,
                        desc: `Time ran out! Please try again.`,
                        color: `#c70058`
                    }, interaction);
                    await interaction.editReply({ components: [] });
                }
                resolve();
            });
        });
    };

    client.sendPaginatedSelectMenu = async function (interaction, customId, customDesc, customOptions, customContent, perPage = 25) {
        const totalPages = Math.ceil(customOptions.length / perPage);
        const sendPage = async (page) => {
            const start = page * perPage;
            const end = start + perPage;
            const currentOptions = customOptions.slice(start, end);
            const menu = new StringSelectMenuBuilder()
                .setCustomId(customId)
                .setPlaceholder(customDesc)
                .addOptions(currentOptions);
            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('button_prev')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === 0),
                    new ButtonBuilder()
                        .setCustomId('button_next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === totalPages - 1)
                );
            await interaction.editReply({
                content: `Page ${page + 1}/${totalPages}: ${customContent}`,
                components: [new ActionRowBuilder().addComponents(menu), buttons],
                ephemeral: true
            });
        };
        if (client.activeCollectors && client.activeCollectors[interaction.user.id]) {
            client.activeCollectors[interaction.user.id].stop();
        }
        let currentPage = 0;
        await sendPage(currentPage);
        const filter = (collected) => ['button_prev', 'button_next', customId].includes(collected.customId) && collected.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });
        client.activeCollectors = client.activeCollectors || {};
        client.activeCollectors[interaction.user.id] = collector;
        return new Promise((resolve) => {
            collector.on('collect', async collected => {
                await collected.deferUpdate();
                if (collected.customId === 'button_prev' && currentPage > 0) {
                    currentPage--;
                    await sendPage(currentPage);
                } else if (collected.customId === 'button_next' && currentPage < totalPages - 1) {
                    currentPage++;
                    await sendPage(currentPage);
                } else {
                    resolve(collected.values[0]);
                }
            });
            collector.on('end', async collected => {
                if (collected.size === 0) {
                    await client.ephemeralEmbed({
                        title: `Request`,
                        desc: `Time ran out! Please try again.`,
                        color: `#c70058`
                    }, interaction);
                    await interaction.editReply({ components: [] });
                }
                resolve();
            });
        });
    };

    client.collectUserInput = async function (interaction) {
        const filter = i => i.author.id === interaction.user.id;
        const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
    
        if (collected.size === 0) {
            await interaction.followUp({ content: 'Time ran out! Please try again.', components: [], ephemeral: true });
            return null;
        }
    
        return collected.first().content;
    }
}
