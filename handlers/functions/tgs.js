const base64 = require('base-64');
const axios = require('axios');

let bearerValidUntil = 0;
let bearer = { Authorization: 'fixme' };
const defaultHeaders = {
    accept: 'application/json',
    'User-Agent': 'Amogus/1.0.0.0',
    Api: 'Tgstation.Server.Api/10.0.0',
};

//TODO PORT mysqlSettingsRequest TO NEW SYSTEM

module.exports = async (client) => {
    client.tgs_makeToken = async function (tgsLogin, tgsPass) {
        const authString = `${tgsLogin}:${tgsPass}`;
        const authHeader = base64.encode(authString);
        return { 'Authorization': `Basic ${authHeader}` };
    };

    client.tgs_auth = async function () {
        const authHeader = await client.tgs_makeToken(process.env.TGS_LOGIN, process.env.TGS_PASS);
        const headers = { ...defaultHeaders, ...authHeader };
        const tgs_address = await global.mysqlSettingsRequest('tgs_address');
        try {
            const response = await axios.post(`${tgs_address[0].param}/api`, null, { headers });
            bearer = { Authorization: `Bearer ${response.data.bearer}` };
            const now_date = new Date();
            bearerValidUntil = new Date(now_date.getTime() - now_date.getTimezoneOffset() * 60000);
        } catch (error) {
            console.log('TGS >> [ERROR] >> Auth Failed:', error);
        }
    };

    client.tgs_checkAuth = async function () {
        const now_date = new Date();
        if (new Date(now_date.getTime() - now_date.getTimezoneOffset() * 60000) >= bearerValidUntil) {
            await client.tgs_auth();
        }
    };

    client.tgs_getInstances = async function () {
        await client.tgs_checkAuth();
        const headers = { ...defaultHeaders, ...bearer };
        const tgs_address = await global.mysqlSettingsRequest('tgs_address');
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
        const tgs_address = await global.mysqlSettingsRequest('tgs_address');
        const response = await axios.get(`${tgs_address[0].param}/api/Instance/${instId}`, { headers });
        return response.data;
    };

    client.tgs_getActiveJobs = async function () {
        await client.tgs_checkAuth();
        const headers = { ...defaultHeaders, ...bearer };
        const tgs_address = await global.mysqlSettingsRequest('tgs_address');
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
        const tgs_address = await global.mysqlSettingsRequest('tgs_address');
        const response = await axios.post(`${tgs_address[0].param}/api/Repository/${instId}`, null, { headers, params });
        return response.data;
    };

    client.tgs_start = async function (interaction, instanceId) {
        await client.tgs_checkAuth();
        const headers = { ...defaultHeaders, ...bearer, Instance: instanceId };
        const tgs_address = await global.mysqlSettingsRequest('tgs_address');
        const response = await axios.put(`${tgs_address[0].param}/api/DreamDaemon`, null, { headers });
        if(!interaction) return;
        await client.ephemeralEmbed({
            title: 'Action',
            desc: `${response.data}`,
            color: '#c70058'
        }, interaction);
    };

    client.tgs_stop = async function (interaction, instanceId) {
        await client.tgs_checkAuth();
        const headers = { ...defaultHeaders, ...bearer, Instance: instanceId };
        const tgs_address = await global.mysqlSettingsRequest('tgs_address');
        const response = await axios.delete(`${tgs_address[0].param}/api/DreamDaemon`, { headers });
        if(!interaction) return;
        await client.ephemeralEmbed({
            title: 'Action',
            desc: `${response.data}`,
            color: '#c70058'
        }, interaction);
    };

    client.tgs_deploy = async function (interaction, instanceId) {
        await client.tgs_checkAuth();
        const headers = { ...defaultHeaders, ...bearer, Instance: instanceId };
        const tgs_address = await global.mysqlSettingsRequest('tgs_address');
        const response = await axios.put(`${tgs_address[0].param}/api/DreamMaker`, null, { headers });
        if(!interaction) return;
        await client.ephemeralEmbed({
            title: 'Action',
            desc: `${response.data}`,
            color: '#c70058'
        }, interaction);
    };

    client.handling_tgs_actions = {
        'stop': client.tgs_stop,
        'start': client.tgs_start,
        'deploy': client.tgs_deploy
    };

    client.handling_tgs = [
        { label: 'Stop', value: 'stop' },
        { label: 'Start', value: 'start' },
        { label: 'Deploy', value: 'deploy' }
    ];
};
