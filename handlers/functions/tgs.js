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

    client.tgs_auth = async function (tgs_address) {
        const authHeader = await client.tgs_makeToken(process.env.TGS_LOGIN, process.env.TGS_PASS);
        const headers = { ...defaultHeaders, ...authHeader };
        try {
            const response = await axios.post(`${tgs_address}/api`, null, { headers });
            bearer = { Authorization: `Bearer ${response.data.bearer}` };
            const now_date = new Date();
            bearerValidUntil = new Date(now_date.getTime() - now_date.getTimezoneOffset() * 60000);
        } catch (error) {
            console.log('TGS >> [ERROR] >> Auth Failed:', error);
        }
    };

    client.tgs_checkAuth = async function (tgs_address) {
        const now_date = new Date();
        if (new Date(now_date.getTime() - now_date.getTimezoneOffset() * 60000) >= bearerValidUntil) {
            await client.tgs_auth(tgs_address);
        }
    };

    client.tgs_getInstances = async function (tgs_address) {
        await client.tgs_checkAuth(tgs_address);
        const headers = { ...defaultHeaders, ...bearer };
        const response = await axios.get(`${tgs_address}/api/Instance/List`, { headers });
        const instances = response.data.content.map(instance => ({
            id: instance.id,
            name: instance.name,
            online: instance.online,
        }));
        return instances;
    };

    client.tgs_getInstance = async function (tgs_address, instId) {
        await client.tgs_checkAuth(tgs_address);
        const headers = { ...defaultHeaders, ...bearer };
        const response = await axios.get(`${tgs_address}/api/Instance/${instId}`, { headers });
        return response.data;
    };

    client.tgs_getActiveJobs = async function (tgs_address) {
        await client.tgs_checkAuth(tgs_address);
        const headers = { ...defaultHeaders, ...bearer };
        const response = await axios.get(`${tgs_address}/api/Job`, { headers });
        return response.data;
    };

    client.tgs_gitPullRepoForInst = async function (tgs_address, instId, ...commitSha) {
        await client.tgs_checkAuth(tgs_address);
        const headers = { ...defaultHeaders, ...bearer };
        let params = { accessUser: process.env.GITHUB_USER, accessToken: process.env.GITHUB_PAT };
        if (commitSha.length) {
            params = { ...params, checkoutSha: commitSha.join('') };
        } else {
            params = { ...params, updateFromOrigin: 'true' };
        }
        const response = await axios.post(`${tgs_address}/api/Repository/${instId}`, null, { headers, params });
        return response.data;
    };

    client.tgs_start = async function (tgs_address, instanceId, interaction) {
        await client.tgs_checkAuth(tgs_address);
        const headers = { ...defaultHeaders, ...bearer, Instance: instanceId };
        const response = await axios.put(`${tgs_address}/api/DreamDaemon`, null, { headers });

        if(!interaction) return global.createLog('Server used command [TGS Start]');

        global.createLog(`${interaction.user.id} used command [TGS Start]`);

        await client.ephemeralEmbed({ title: 'Action', desc: `${response.data}`, color: '#c70058' }, interaction);
    };

    client.tgs_stop = async function (tgs_address, instanceId, interaction) {
        await client.tgs_checkAuth(tgs_address);
        const headers = { ...defaultHeaders, ...bearer, Instance: instanceId };
        const response = await axios.delete(`${tgs_address}/api/DreamDaemon`, { headers });

        if(!interaction) return global.createLog('Server used command [TGS Stop]');

        global.createLog(`${interaction.user.id} used command [TGS Stop]`);

        await client.ephemeralEmbed({ title: 'Action', desc: `${response.data}`, color: '#c70058' }, interaction);
    };

    client.tgs_deploy = async function (tgs_address, instanceId, interaction) {
        await client.tgs_checkAuth(tgs_address);
        const headers = { ...defaultHeaders, ...bearer, Instance: instanceId };
        const response = await axios.put(`${tgs_address}/api/DreamMaker`, null, { headers });

        if(!interaction) return global.createLog('Server used command [TGS Deploy]');

        global.createLog(`${interaction.user.id} used command [TGS Deploy]`);

        await client.ephemeralEmbed({ title: 'Action', desc: `${response.data}`, color: '#c70058' }, interaction);
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
