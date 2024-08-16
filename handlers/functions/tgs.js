const base64 = require('base-64');
const axios = require('axios');
const { DateTime } = require('luxon');
const chalk = require('chalk');

const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

let bearerValidUntil = DateTime.utc();
let bearer = { Authorization: 'fixme' };
const defaultHeaders = {
    accept: 'application/json',
    'User-Agent': 'Amogus/1.0.0.0',
    Api: 'Tgstation.Server.Api/10.0.0',
};

module.exports = async (client) => {
    client.tgs_makeToken = async function (tgsLogin, tgsPass) {
        const authString = `${tgsLogin}:${tgsPass}`;
        const authHeader = base64.encode(authString);
        return { 'Authorization': `Basic ${authHeader}` };
    };

    client.tgs_auth = async function () {
        const authHeader = await client.tgs_makeToken(process.env.TGS_LOGIN, process.env.TGS_PASS);
        const headers = { ...defaultHeaders, ...authHeader };
        const tgs_address = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_address'", params: [] });
        try {
            const response = await axios.post(`${tgs_address[0].param}/api`, null, { headers });
            bearer = { Authorization: `Bearer ${response.data.bearer}` };
            bearerValidUntil = DateTime.utc();
        } catch (error) {
            console.log(chalk.blue(chalk.bold(`TGS`)), (chalk.white(`>>`)), chalk.red(`[ERROR]`), (chalk.white(`>>`)), chalk.red(`Auth`), chalk.red(`Failed: ${error}`));
        }
    };

    client.tgs_checkAuth = async function () {
        if (DateTime.utc() >= bearerValidUntil) {
            await client.tgs_auth();
        }
    };

    client.tgs_getInstances = async function () {
        await client.tgs_checkAuth();
        const headers = { ...defaultHeaders, ...bearer };
        const tgs_address = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_address'", params: [] });
        const response = await axios.get(`${tgs_address[0].param}/api/Instance/List`, { headers });
        const instances = response.data.content.map(instance => ({
            id: instance.id,
            name: instance.name,
            online: instance.online,
        }));
        return instances;
    };

    client.tgs_getInstance = async function (instId) {
        await client.tgs_checkAuth();
        const headers = { ...defaultHeaders, ...bearer };
        const tgs_address = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_address'", params: [] });
        const response = await axios.get(`${tgs_address[0].param}/api/Instance/${instId}`, { headers });
        return response.data;
    };

    client.tgs_getActiveJobs = async function () {
        await client.tgs_checkAuth();
        const headers = { ...defaultHeaders, ...bearer };
        const tgs_address = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_address'", params: [] });
        const response = await axios.get(`${tgs_address[0].param}/api/Job`, { headers });
        return response.data;
    };

    client.tgs_gitPullRepoForInst = async function (instId, ...commitSha) {
        await client.tgs_checkAuth();
        const headers = { ...defaultHeaders, ...bearer };
        let params = { accessUser: process.env.GITHUB_USER, accessToken: process.env.GITHUB_PAT };
        if (commitSha.length) {
            params = { ...params, checkoutSha: commitSha.join('') };
        } else {
            params = { ...params, updateFromOrigin: 'true' };
        }
        const tgs_address = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_address'", params: [] });
        const response = await axios.post(`${tgs_address[0].param}/api/Repository/${instId}`, null, { headers, params });
        return response.data;
    };

    client.handleServerSelection = async function (interaction) {
        const instances = await client.tgs_getInstances();
        const options = instances.map(instance => ({
            label: instance.name,
            value: `${instance.id}`
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`select-server`)
            .setPlaceholder('Select a server instance')
            .addOptions(options);

        const row = new ActionRowBuilder()
            .addComponents(selectMenu);

        if (client.activeCollectors && client.activeCollectors[interaction.user.id]) {
            client.activeCollectors[interaction.user.id].stop();
        }

        const filter = collected => collected.customId === `select-server` && collected.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });
        client.activeCollectors = client.activeCollectors || {};
        client.activeCollectors[interaction.user.id] = collector;

        await interaction.editReply({
            content: 'Please select a server instance:',
            components: [row],
            ephemeral: true
        });

        collector.on('collect', async collected => {
            const instanceId = collected.values[0];
            await collected.deferUpdate();
            return await handleCommandSelection(collected, instanceId);
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: 'Time ran out! Please try again.', components: [] });
            }
            delete client.activeCollectors[interaction.user.id];
            return 'No actions done';
        });
    }

    global.handling_commands_actions["tgs"] = client.handleServerSelection;
    global.handling_commands.push({ label: "Manage TGS", value: "tgs", role_req: "tgs_role_id" });

    client.tgs_start = async function (instanceId) {
        await client.tgs_checkAuth();
        const headers = { ...defaultHeaders, ...bearer, Instance: instanceId };
        const tgs_address = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_address'", params: [] });
        const response = await axios.put(`${tgs_address[0].param}/api/DreamDaemon`, null, { headers });
        return response.data;
    };

    client.tgs_stop = async function (instanceId) {
        await client.tgs_checkAuth();
        const headers = { ...defaultHeaders, ...bearer, Instance: instanceId };
        const tgs_address = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_address'", params: [] });
        const response = await axios.delete(`${tgs_address[0].param}/api/DreamDaemon`, { headers });
        return response.data;
    };

    client.tgs_deploy = async function (instanceId) {
        await client.tgs_checkAuth();
        const headers = { ...defaultHeaders, ...bearer, Instance: instanceId };
        const tgs_address = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_address'", params: [] });
        const response = await axios.put(`${tgs_address[0].param}/api/DreamMaker`, null, { headers });
        return response.data;
    };

    global.handling_tgs_actions = {
        "stop": client.tgs_stop,
        "start": client.tgs_start,
        "deploy": client.tgs_deploy
    };

    global.handling_tgs = [
        { label: "Stop", value: "stop" },
        { label: "Start", value: "start" },
        { label: "Deploy", value: "deploy" }
    ];

    client.on('messageCreate', async (message) => {
        const tgs_bot_id = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_bot_id'", params: [] });
        const tgs_bot_message = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_bot_message'", params: [] });
        if (message.author.id === tgs_bot_id[0].param && message.content === tgs_bot_message[0].param) {
            const related_feed_channel = await client.databaseRequest({ database: global.database, query: "SELECT channel_id, message_id FROM server_channels WHERE name = 'round'", params: [] });
            if (!related_feed_channel[0] || !related_feed_channel[0].message_id) return;
            const channel = client.channels.cache.get(related_feed_channel[0].channel_id);
            if (channel) {
                const new_round_message = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'new_round_message'", params: [] });
                await channel.send(new_round_message[0].param);
            }
        }
    });
};

async function handleCommandSelection(interaction, instanceId) {
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`select-action`)
        .setPlaceholder('Select action')
        .addOptions(global.handling_tgs);

    const row = new ActionRowBuilder()
        .addComponents(selectMenu);

    if (client.activeCollectors && client.activeCollectors[interaction.user.id]) {
        client.activeCollectors[interaction.user.id].stop();
    }

    const filter = collected => collected.customId === `select-action` && collected.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });
    client.activeCollectors = client.activeCollectors || {};
    client.activeCollectors[interaction.user.id] = collector;

    await interaction.editReply({
        content: 'Please select action to perform:',
        components: [row],
        ephemeral: true
    });

    collector.on('collect', async collected => {
        const selectedCommand = collected.values[0];
        await collected.deferUpdate();
        if (global.handling_tgs_actions[selectedCommand]) {
            return await global.handling_tgs_actions[selectedCommand](instanceId);
        }
        return 'No actions done';
    });

    collector.on('end', collected => {
        if (collected.size === 0) {
            interaction.editReply({ content: 'Time ran out! Please try again.', components: [] });
        }
        delete client.activeCollectors[interaction.user.id];
        return 'No actions done';
    });
}
