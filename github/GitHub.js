const Discord = require('discord.js');
const chalk = require('chalk');
const simpleGit = require('simple-git');
const axios = require('axios');
require('dotenv').config('.env');

module.exports = async (client) => {
    client.git = simpleGit(process.cwd());

    client.getLastCommit = async function (client) {
        try {
            await client.git.addConfig('credential.helper', 'store');

            let github_link, github_branch, github_token;

            github_link = await client.databaseSettingsRequest("github_link");
            
            github_branch = await client.databaseSettingsRequest("github_branch");
            github_token = process.env.GITHUB_PAT;

            await client.git.remote(['set-url', 'origin', `https://${github_token}@github.com/${github_link[0].param}.git`]);
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
            console.log(chalk.blue(chalk.bold(`GitHub`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Failed remote: ${error}`));
        }
    };

    client.getLastLocalCommit = async function (client) {
        try {
            let github_branch = await client.databaseSettingsRequest("github_branch");
            const log = await client.git.log([github_branch[0].param]);
            return log.latest.hash;
        } catch (error) {
            console.log(chalk.blue(chalk.bold(`GitHub`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Failed local: ${error}`));
        }
    };

    client.pullChanges = async function (client) {
        try {
            let github_branch = await client.databaseSettingsRequest("github_branch");
            await client.git.pull('origin', github_branch[0].param);
            console.log(chalk.blue(chalk.bold(`GitHub`)), chalk.white(`>>`), chalk.red(`Pulled latest changes`));
        } catch (error) {
            console.log(chalk.blue(chalk.bold(`GitHub`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Failed: ${error}`));
        }
    };

    client.tryForUpdate = async function (client) {
        const remoteCommit = await client.getLastCommit(client);
        const localCommit = await client.getLastLocalCommit(client);

        if (!remoteCommit || !localCommit) {
            console.log(chalk.blue(chalk.bold(`GitHub`)), chalk.white(`>>`), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Failed version check, make sure all setted up right: remote, local and github pat`));
            const embed = new Discord.EmbedBuilder()
            .setTitle(`Git`)
            .addFields([
                {
                    name: `Warning`,
                    value: `Failed version check, make sure all setted up right: remote, local and github pat`,
                }
            ])
            await global.LogsHandler.send_log(embed);
        } else if (remoteCommit !== localCommit) {
            console.log(chalk.blue(chalk.bold(`GitHub`)), chalk.white(`>>`), chalk.red(`New commit found, pulling changes`));
            await client.pullChanges(client);
            client.restartApp("Pulling new changes from GIT");
        }
    };

    await client.database;

    client.git_commit = await client.getLastLocalCommit(client);
    const embed = new Discord.EmbedBuilder()
        .setTitle(`System`)
        .addFields([
            {
                name: "Start",
                value: `Commit SHA: ${client.git_commit}`,
            }
        ])
    global.LogsHandler.send_log(embed);
    console.log(chalk.blue(chalk.bold(`GitHub`)), chalk.white(`>>`), chalk.green(`Current commit: ${client.git_commit}`));
    setInterval(
        client.tryForUpdate,
        1 * 60 * 1000, // Каждые N минут (первое число)
        client
    );
}