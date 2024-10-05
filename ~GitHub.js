const axios = require('axios');
const simpleGit = require('simple-git');

module.exports = async (manager) => {
    manager.git = await simpleGit(process.cwd());

    manager.getLastCommit = async function (manager) {
        try {
            await manager.git.addConfig('credential.helper', 'store');

            await manager.git.remote(['set-url', 'origin', `https://${process.env.GITHUB_PAT}@github.com/${process.env.GITHUB_LINK}.git`]);
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

    manager.getLastLocalCommit = async function (manager) {
        try {
            const log = await manager.git.log([process.env.GITHUB_BRANCH]);
            return log.latest.hash;
        } catch (error) {
            console.log('GitHub >> [ERROR] >> Failed (local):', error);
        }
    };

    manager.pullChanges = async function (manager) {
        try {
            await manager.git.pull('origin', process.env.GITHUB_BRANCH);
            console.log('GitHub >> Pulled latest changes');
        } catch (error) {
            console.log('GitHub >> [ERROR] >>', error);
        }
    };

    manager.tryForUpdate = async function (manager) {
        const remote_commit = await manager.getLastCommit(manager);
        const local_commit = await manager.getLastLocalCommit(manager);
        if (!remote_commit || !local_commit) {
            console.log('GitHub >> [WARNING] >> Failed version check, make sure all setted up right: remote, local and github pat');
            global._LogsHandler.sendSimplyLog('Git', null, [{ name: 'Warning', value: `Failed version check, make sure all setted up right: remote, local and github pat` }]);
        } else if (remote_commit !== local_commit) {
            console.log('GitHub >> New commit found, checking changes...');

            await manager.pullChanges(manager);
            manager.restartApp('Pulled new changes from GIT');
        }
    };

    manager.git_commit = await manager.getLastLocalCommit();
    console.log('GitHub >> Current commit:', manager.git_commit);
    global._LogsHandler.sendSimplyLog('System', null, [{ name: 'Start', value: `Commit SHA: ${manager.git_commit}` }]);

    setInterval(
        manager.tryForUpdate,
        1 * 60000, // Каждые N минут (первое число)
        manager
    );
};
