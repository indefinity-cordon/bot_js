const Discord = require('discord.js');

const chalk = require('chalk');
const simpleGit = require('simple-git');
const axios = require('axios');

// Initialize simple-git with the repo path
const git = simpleGit(process.cwd());

module.exports = async (client) => {
    setInterval(
        tryForUpdate,
        1 * 60 * 1000, // Каждые N минут (первое число)
        client);
};

async function getLastCommit(client) {
    try {
        const github_link = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'github_link'", params: [] });
        const github_branch = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'github_branch'", params: [] });
        const github_token = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'github_token'", params: [] });
        const response = await axios.get(
            `${github_link[0].param}${github_branch[0].param}`,
            {
                headers: {
                    Authorization: `token ${github_token[0].param}`,
                },
            }
        );
        return response.data.sha;
    } catch (error) {
        console.log(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.red(`[ERROR]`), (chalk.white(`>>`)), chalk.red(`Fetching`), chalk.red(`Failed remote: ${error}`));
        throw error;
    }
}

async function getLastLocalCommit(client) {
    try {
        const github_branch = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'github_branch'", params: [] });
        const log = await git.log([github_branch[0].param]);
        return log.latest.hash;
    } catch (error) {
        console.log(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.red(`[ERROR]`), (chalk.white(`>>`)), chalk.red(`Fetching`), chalk.red(`Failed local: ${error}`));
        throw error;
    }
}

async function pullChanges(client) {
    try {
        const github_branch = await client.databaseRequest({ database: global.database, query: "SELECT param FROM settings WHERE name = 'github_branch'", params: [] });
        await git.pull('origin', github_branch[0].param);
        console.log(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.green(`[DONE]`), (chalk.white(`>>`)), chalk.red(`Pulling`), chalk.red(`Pulled latest changes`));
    } catch (error) {
        console.error(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.red(`[ERROR]`), (chalk.white(`>>`)), chalk.red(`Pulling`), chalk.red(`Failed: ${error}`));
        throw error;
    }
}

async function tryForUpdate(client) {
    try {
        const remoteCommit = await getLastCommit(client);
        const localCommit = await getLastLocalCommit(client);

        if (remoteCommit !== localCommit) {
            console.log(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.green(`[PROGRESS]`), (chalk.white(`>>`)), chalk.red(`Pulling`), chalk.red(`New commit found, pulling changes`));
            try {
                await pullChanges(client);
                client.restartApp();
            } catch (error) {
                throw error;
            }
        } else {
            console.log(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.blue(`[SKIP]`), (chalk.white(`>>`)), chalk.red(`Fetching`), chalk.red(`Not found new commits`));
        }
    } catch (error) {
        console.log(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.red(`[FAILED]`), (chalk.white(`>>`)), chalk.red(`Pulling`), chalk.red(`Failed update: ${error}`));
    }
}
