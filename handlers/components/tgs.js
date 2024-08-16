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
        console.log('Auth Header:', authHeader);
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

    async function handleServerSelection(interaction, command) {
        const instances = await client.tgs_getInstances();
        const options = instances.map(instance => ({
            label: instance.name,
            value: instance.id
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`select-server-${command}`)
            .setPlaceholder('Select a server instance')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            content: 'Please select a server instance:',
            components: [row],
            ephemeral: true
        });

        if (client.activeCollectors && client.activeCollectors[interaction.user.id]) {
            client.activeCollectors[interaction.user.id].stop();
        }

        const filter = collected => collected.customId === `select-server-${command}` && collected.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });
        client.activeCollectors = client.activeCollectors || {};
        client.activeCollectors[interaction.user.id] = collector;

        return new Promise((resolve, reject) => {
            collector.on('collect', async collected => {
                await collected.deferUpdate();
                resolve({ instanceId: collected.values[0] });
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({ content: 'Time ran out! Please try again.', components: [] });
                    reject(new Error('Timeout during server selection.'));
                }
            });
        });
    }

    client.tgs_start = async function (interaction) {
        const { instanceId } = await handleServerSelection(interaction, 'start');
        await client.tgs_checkAuth();
        const headers = { ...defaultHeaders, ...bearer, Instance: instanceId };
        const tgs_address = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_address'", params: [] });
        const response = await axios.put(`${tgs_address[0].param}/api/DreamDaemon`, null, { headers });
        return response.data;
    };

    client.tgs_stop = async function (interaction) {
        const { instanceId } = await handleServerSelection(interaction, 'stop');
        await client.tgs_checkAuth();
        const headers = { ...defaultHeaders, ...bearer, Instance: instanceId };
        const tgs_address = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_address'", params: [] });
        const response = await axios.delete(`${tgs_address[0].param}/api/DreamDaemon`, { headers });
        return response.data;
    };

    client.tgs_deploy = async function (interaction) {
        const { instanceId } = await handleServerSelection(interaction, 'deploy');
        await client.tgs_checkAuth();
        const headers = { ...defaultHeaders, ...bearer, Instance: instanceId };
        const tgs_address = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_address'", params: [] });
        const response = await axios.put(`${tgs_address[0].param}/api/DreamMaker`, null, { headers });
        return response.data;
    };

    global.handling_commands_actions["stop"] = client.tgs_stop;
    global.handling_commands_actions["start"] = client.tgs_start;
    global.handling_commands_actions["deploy"] = client.tgs_deploy;

    global.handling_commands.push({ label: "Stop", value: "stop", role_req: "tgs_role_id" });
    global.handling_commands.push({ label: "Start", value: "start", role_req: "tgs_role_id" });
    global.handling_commands.push({ label: "Deploy", value: "deploy", role_req: "tgs_role_id" });

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