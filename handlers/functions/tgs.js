const base64 = require('base-64');
const axios = require('axios');

let bearerValidUntil = 0;
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

	client.tgs_getInstance = async function (tgs_address, instanceId) {
		await client.tgs_checkAuth(tgs_address);
		const headers = { ...defaultHeaders, ...bearer };
		const response = await axios.get(`${tgs_address}/api/Instance/${instanceId}`, { headers });
		return response.data;
	};

	client.tgs_getActiveJobs = async function (tgs_address) {
		await client.tgs_checkAuth(tgs_address);
		const headers = { ...defaultHeaders, ...bearer };
		const response = await axios.get(`${tgs_address}/api/Job`, { headers });
		return response.data;
	};

	client.tgs_getRepository = async function (tgs_address, instanceId) {
		await client.tgs_checkAuth(tgs_address);
		const headers = { ...defaultHeaders, ...bearer, Instance: instanceId };
		const response = await axios.get(`${tgs_address}/api/Repository`, { headers });
		return response.data;
	};

	client.tgs_start = async function (tgs_address, instanceId, interaction) {
		await client.tgs_checkAuth(tgs_address);
		const headers = { ...defaultHeaders, ...bearer, Instance: instanceId };
		const response = await axios.put(`${tgs_address}/api/DreamDaemon`, null, { headers });

		if(!interaction) {
			global.createLog('Server used command [TGS Start]');
			return response.data;
		}

		global.createLog(`${interaction.user.id} used command [TGS Start]`);

		await client.ephemeralEmbed({ title: 'Action', desc: `${response.data}`, color: '#c70058' }, interaction);

		return response.data;
	};

	client.tgs_stop = async function (tgs_address, instanceId, interaction) {
		await client.tgs_checkAuth(tgs_address);
		const headers = { ...defaultHeaders, ...bearer, Instance: instanceId };
		const response = await axios.delete(`${tgs_address}/api/DreamDaemon`, { headers });

		if(!interaction) {
			global.createLog('Server used command [TGS Stop]');
			return response.data;
		}

		global.createLog(`${interaction.user.id} used command [TGS Stop]`);

		await client.ephemeralEmbed({ title: 'Action', desc: `${response.data}`, color: '#c70058' }, interaction);

		return response.data;
	};

	client.tgs_deploy = async function (tgs_address, instanceId, interaction) {
		await client.tgs_checkAuth(tgs_address);
		const headers = { ...defaultHeaders, ...bearer, Instance: instanceId };
		const response = await axios.put(`${tgs_address}/api/DreamMaker`, null, { headers });

		if(!interaction) {
			global.createLog('Server used command [TGS Deploy]');
			return response.data;
		}

		global.createLog(`${interaction.user.id} used command [TGS Deploy]`);

		await client.ephemeralEmbed({ title: 'Action', desc: `${response.data}`, color: '#c70058' }, interaction);

		return response.data;
	};

	client.tgs_testMerge = async function (tgs_address, instanceId, interaction, repository_data) {
		await client.tgs_checkAuth(tgs_address);
		const headers = { ...defaultHeaders, ...bearer, Instance: instanceId };
		const response = await axios.post(`${tgs_address}/api/Repository`, repository_data, { headers });

		if(!interaction) {
			global.createLog('Server used command [TGS Deploy]');
			return response.data;
		}

		global.createLog(`${interaction.user.id} used command [TGS Deploy]`);

		return response.data;
	};

	client.tgs_handleTestMerge = async function (tgs_address, instanceId, interaction) {
		const repository = await client.tgs_getRepository(tgs_address, instanceId);
		if (!repository.origin || !repository.reference) return await client.ephemeralEmbed({ title: 'Request', desc: 'Repository or branch not found.', color: '#c70058' }, interaction);

		const response = await axios.get(
			`https://api.github.com/repos/${repository.origin.replace('https://github.com/', '').replace('.git', '')}/pulls`,
			{
				headers: {
						Authorization: `token ${process.env.GITHUB_PAT}`
				},
				params: {
						base: repository.reference,
						state: 'open',
            per_page: 500
				}
			}
		);
		const prs = response.data;
		if (!prs.length) return await client.ephemeralEmbed({ title: 'Request', desc: 'Not found any PRs.', color: '#c70058' }, interaction);

		const all_prs = prs.map(pr => ({
			label: `PR #${pr.number}`,
			value: pr.number.toString()
		}));

		const selected_prs = await client.sendInteractionSelectMenu(interaction, 'select-prs', 'Select PRs', all_prs, 'Select PRs to be set for TM:', true);
		if (!selected_prs) return;

		const new_test_merges = selected_prs.map(pr => ({
			number: parseInt(pr)
		}));

		const repository_data = {
			updateFromOrigin: true,
			reference: repository.reference,
			newTestMerges: new_test_merges
		};

		return await client.tgs_testMerge(tgs_address, instanceId, interaction, repository_data);
	};

	client.handling_tgs_actions = {
		'stop': client.tgs_stop,
		'start': client.tgs_start,
		'deploy': client.tgs_deploy,
		'testmerge': client.tgs_handleTestMerge
	};

	client.handling_tgs = [
		{ label: 'Stop', value: 'stop' },
		{ label: 'Start', value: 'start' },
		{ label: 'Deploy', value: 'deploy' },
		{ label: 'Test Merges', value: 'testmerge' }
	];
};
