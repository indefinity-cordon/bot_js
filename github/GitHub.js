const Discord = require('discord.js');
const chalk = require('chalk');
const axios = require('axios');

module.exports = async (client) => {
    client.getLastCommit = async function (client) {
        try {
            await client.git.addConfig('credential.helper', 'store');

            await client.git.remote(['set-url', 'origin', `https://${process.env.GITHUB_PAT}@github.com/${process.env.GITHUB_LINK}.git`]);
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
            console.log(chalk.blue(chalk.bold('GitHub')), chalk.white('>>'), chalk.red('[ERROR]'), chalk.white('>>'), chalk.red(`Failed remote: ${error}`));
        }
    };

    client.getLastLocalCommit = async function (client) {
        try {
            let github_branch = await client.mysqlSettingsRequest('github_branch');
            const log = await client.git.log([github_branch[0].param]);
            return log.latest.hash;
        } catch (error) {
            console.log(chalk.blue(chalk.bold('GitHub')), chalk.white('>>'), chalk.red('[ERROR]'), chalk.white('>>'), chalk.red(`Failed local: ${error}`));
        }
    };

    client.pullChanges = async function (client) {
        try {
            let github_branch = await client.mysqlSettingsRequest('github_branch');
            await client.git.pull('origin', github_branch[0].param);
            console.log(chalk.blue(chalk.bold('GitHub')), chalk.white('>>'), chalk.red('Pulled latest changes'));
        } catch (error) {
            console.log(chalk.blue(chalk.bold('GitHub')), chalk.white('>>'), chalk.red('[ERROR]'), chalk.white('>>'), chalk.red(`Failed: ${error}`));
        }
    };

    client.checkImportantFiles = async function () {
        try {
            const diff = await client.git.diff(['HEAD', '--', 'bot.js', 'LogsHandler.json', 'package.json']);
            return !!diff;
        } catch (error) {
            console.log(chalk.red('Failed to check important files:', error));
            return false;
        }
    };

    client.tryForUpdate = async function (client) {
        const remote_commit = await client.getLastCommit(client);
        const local_commit = await client.getLastLocalCommit(client);
        if (!remote_commit || !local_commit) {
            console.log(chalk.blue(chalk.bold('GitHub')), chalk.white('>>'), chalk.red('[ERROR]'), chalk.white('>>'), chalk.red('Failed version check, make sure all setted up right: remote, local and github pat'));
            global.LogsHandler.sendSimplyLog('Git', null, [{ name: 'Warning', value: `Failed version check, make sure all setted up right: remote, local and github pat` }]);
        } else if (remote_commit !== local_commit) {
            console.log(chalk.blue(chalk.bold('GitHub')), chalk.white('>>'), chalk.red('New commit found, checking changes...'));

            const full_reboot = await client.checkImportantFiles();
            await client.pullChanges(client);
            if (full_reboot) client.restartApp('Pulled new changes from GIT');
            else client.hotSwap()
        }
    };

    client.INT_modules += setInterval(
        client.tryForUpdate,
        1 * 60000, // Каждые N минут (первое число)
        client
    );
};
