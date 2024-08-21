
const git = simpleGit(process.cwd());
const chalk = require('chalk');
const simpleGit = require('simple-git');
const axios = require('axios');
require('dotenv').config('.env');

module.exports = async (client) => {
    client.getLastCommit = async function (client) {
        try {
            await git.addConfig('credential.helper', 'store');

            let github_link, github_branch, github_token;

            github_link = await client.databaseRequest({ database: client.database, query: "SELECT param FROM settings WHERE name = 'github_link'", params: [] });
            github_branch = await client.databaseRequest({ database: client.database, query: "SELECT param FROM settings WHERE name = 'github_branch'", params: [] });
            github_token = process.env.GITHUB_PAT;

            await git.remote(['set-url', 'origin', `https://${github_token}@github.com/${github_link[0].param}.git`]);
            const response = await axios.get(
                `https://api.github.com/repos/${github_link[0].param}/commits/${github_branch[0].param}`,
                {
                    headers: {
                        Authorization: `token ${github_token}`,
                    },
                }
            );
            return response.data.sha;
        } catch (error) {
            console.log(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.red(`[ERROR]`), (chalk.white(`>>`)), chalk.red(`Failed remote: ${error}`));
            throw error;
        }
    };

    client.getLastLocalCommit = async function (client) {
        try {
            let github_branch = await client.databaseRequest({ database: client.database, query: "SELECT param FROM settings WHERE name = 'github_branch'", params: [] });
            const log = await git.log([github_branch[0].param]);
            return log.latest.hash;
        } catch (error) {
            console.log(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.red(`[ERROR]`), (chalk.white(`>>`)), chalk.red(`Failed local: ${error}`));
            throw error;
        }
    };

    client.pullChanges = async function (client) {
        try {
            let github_branch = await client.databaseRequest({ database: client.database, query: "SELECT param FROM settings WHERE name = 'github_branch'", params: [] });
            await git.pull('origin', github_branch[0].param);
            console.log(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.green(`[DONE]`), (chalk.white(`>>`)), chalk.red(`Pulled latest changes`));
        } catch (error) {
            console.error(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.red(`[ERROR]`), (chalk.white(`>>`)), chalk.red(`Failed: ${error}`));
            throw error;
        }
    };

    client.tryForUpdate = async function (client) {
        try {
            const remoteCommit = await client.getLastCommit(client);
            const localCommit = await client.getLastLocalCommit(client);

            if (remoteCommit !== localCommit) {
                console.log(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.green(`[PROGRESS]`), (chalk.white(`>>`)), chalk.red(`New commit found, pulling changes`));
                try {
                    await client.pullChanges(client);
                    client.restartApp();
                } catch (error) {
                    throw error;
                }
            }
        } catch (error) {
            console.log(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.red(`[FAILED]`), (chalk.white(`>>`)), chalk.red(`Failed update: ${error}`));
        }
    };

    await client.database;

    client.git_commit = await client.getLastLocalCommit(client);

    const botLogs = new Discord.WebhookClient({
        id: process.env.WEBHOOK_ID,
        token: process.env.WEBHOOK_TOKEN,
    });

    if(botLogs) {
        const embed = new Discord.EmbedBuilder()
            .setTitle(`System`)
            .addFields([
                {
                    name: "Start",
                    value: `Commit SHA: ${client.git_commit}`,
                }
            ])
        botLogs.send({
            username: 'Bot Logs',
            embeds: [embed],
        }).catch(() => {
            console.log('Error sending start info to webhook');
        })
        console.log(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.blue(`[INFO]`), (chalk.white(`>>`)), chalk.red(`Current commit: ${client.git_commit}`));
    }
    setInterval(
        client.tryForUpdate,
        5 * 60 * 1000, // Каждые N минут (первое число)
        client
    );
}