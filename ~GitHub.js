const axios = require('axios');
const simpleGit = require('simple-git');

module.exports = async () => {
	const git = simpleGit(process.cwd());

	async function getLastCommit() {
		try {
			await git.addConfig('credential.helper', 'store');

			await git.remote(['set-url', 'origin', `https://${process.env.GITHUB_PAT}@github.com/${process.env.GITHUB_LINK}.git`]);
			const response = await axios.get(
				`https://api.github.com/repos/${process.env.GITHUB_LINK}/commits/${process.env.GITHUB_BRANCH}`,
				{
					headers: {
						Authorization: `token ${process.env.GITHUB_PAT}`,
					},
				}
			);
			return response.data.sha;
		} catch (error) {
			console.log('GitHub >> [ERROR] >> Failed (remote):', error);
		}
	};

	async function getLastLocalCommit() {
		try {
			const log = await git.log([process.env.GITHUB_BRANCH]);
			return log.latest.hash;
		} catch (error) {
			console.log('GitHub >> [ERROR] >> Failed (local):', error);
		}
	};

	async function pullChanges() {
		try {
			await git.pull('origin', process.env.GITHUB_BRANCH);
			console.log('GitHub >> Pulled latest changes');
		} catch (error) {
			console.log('GitHub >> [ERROR] >>', error);
		}
	};

	async function tryForUpdate() {
		const remote_commit = await getLastCommit();
		const local_commit = await getLastLocalCommit();
		if (!remote_commit || !local_commit) {
			console.log('GitHub >> [WARNING] >> Failed version check, make sure all setted up right: remote, local and github pat');
			global._LogsHandler.sendSimplyLog('Git', null, [{ name: 'Warning', value: `Failed version check, make sure all setted up right: remote, local and github pat` }]);
		} else if (remote_commit !== local_commit) {
			console.log('GitHub >> New commit found, checking changes...');

			await pullChanges();
			global.restartApp('Pulled new changes from GIT');
		}
	};

	const git_commit = await getLastLocalCommit();
	console.log('GitHub >> Current commit:', git_commit);
	global._LogsHandler.sendSimplyLog('System', null, [{ name: 'Start', value: `Commit SHA: ${git_commit}` }]);

	setInterval(
		tryForUpdate,
		1 * 60000 // Каждые N минут (первое число)
	);
};
