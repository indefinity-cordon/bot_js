const base64 = require('base-64');
const axios = require('axios');
const { DateTime } = require('luxon');

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
        const authBytes = Buffer.from(authString, 'utf-8');
        return { Authorization: `Basic ${base64.encode(authBytes)}` };
    }

    client.tgs_auth = async function () {
        bearerValidUntil = DateTime.utc();
        const authHeader = client.tgs_makeToken(process.env.TGS_LOGIN, process.env.TGS_PASS);
        const headers = { ...defaultHeaders, ...authHeader };
        const tgs_address = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_address'", params: []})
        const response = await axios.post(`${tgs_address[0].param}/api`, null, { headers });
        bearer = { Authorization: `Bearer ${response.data.bearer}` };
        return bearer;
    }

    client.tgs_checkAuth = async function () {
        await client.tgs_auth();
        return bearer;
    }

    client.tgs_getInstances = async function () {
        await client.checkAuth();
        const headers = { ...defaultHeaders, ...bearer };
        const tgs_address = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_address'", params: []})
        const response = await axios.get(`${tgs_address[0].param}/api/Instance/List`, { headers });
        const instances = response.data.content.map(instance => ({
            id: instance.id,
            name: instance.name,
            online: instance.online,
        }));
        return instances;
    }

    client.tgs_getInstance = async function (instId) {
        await client.checkAuth();
        const headers = { ...defaultHeaders, ...bearer };
        const tgs_address = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_address'", params: []})
        const response = await axios.get(`${tgs_address[0].param}/api/Instance/${instId}`, { headers });
        return response.data;
    }

    client.tgs_getActiveJobs = async function () {
        await client.tgs_checkAuth();
        const headers = { ...defaultHeaders, ...bearer };
        const tgs_address = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_address'", params: []})
        const response = await axios.get(`${tgs_address[0].param}/api/Job`, { headers });
        return response.data;
    }

    client.tgs_gitPullRepoForInst = async function (instId, ...commitSha) {
        await client.tgs_checkAuth();
        const headers = { ...defaultHeaders, ...bearer };
        let params = { accessUser: process.env.GITHUB_USER, accessToken: process.env.GITHUB_PAT };
        if (commitSha.length) {
            params = { ...params, checkoutSha: commitSha.join('') };
        } else {
            params = { ...params, updateFromOrigin: 'true' };
        }
        const tgs_address = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_address'", params: []})
        const response = await axios.post(`${tgs_address[0].param}/api/Repository/${instId}`, null, { headers, params });
        return response.data;
    }

    client.tgs_start = async function (instId) {
        await client.tgs_checkAuth();
        const headers = { ...defaultHeaders, ...bearer, Instance: instId };
        const tgs_address = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_address'", params: []})
        const response = await axios.put(`${tgs_address[0].param}/api/DreamDaemon`, null, { headers });
        return response.data;
    }

    client.tgs_stop = async function (instId) {
        await client.tgs_checkAuth();
        const headers = { ...defaultHeaders, ...bearer, Instance: instId };
        const tgs_address = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_address'", params: []})
        const response = await axios.delete(`${tgs_address[0].param}/api/DreamDaemon`, { headers });
        return response.data;
    }

    client.tgs_deploy = async function (instId) {
        await client.tgs_checkAuth();
        const headers = { ...defaultHeaders, ...bearer, Instance: instId };
        const tgs_address = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_address'", params: []})
        const response = await axios.put(`${tgs_address[0].param}/api/DreamMaker`, null, { headers });
        return response.data;
    }

    global.handling_commands_actions = [
        { "stop": [ client.tgs_stop ] },
        { "start": [ client.tgs_start ] },
        { "deploy": [ client.tgs_deploy ] }
    ]

    global.handling_commands = [
        { label: "stop", value: "stop" },
        { label: "start", value: "start" },
        { label:  "deploy", value:  "deploy" }
    ]

    client.on('messageCreate', async (message) => {
        const tgs_bot_id = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_bot_id'", params: []})
        const tgs_bot_message = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'tgs_bot_message'", params: []})
        if (message.author.id === tgs_bot_id[0].param && message.content === tgs_bot_message[0].param) {
            const related_feed_channel = await client.databaseRequest({ database: global.database, query: "SELECT channel_id, message_id FROM server_channels WHERE name = 'round'", params: []})
            if (!related_feed_channel[0] || !related_feed_channel[0].message_id) return;
            const channel = client.channels.cache.get(related_feed_channel[0].channel_id);
            if (channel) {
                const new_round_message = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'new_round_message'", params: []})
                await channel.send(new_round_message[0].param);
            }
        }
    });
}
