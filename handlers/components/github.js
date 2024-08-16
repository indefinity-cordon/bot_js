const Discord = require('discord.js');

const chalk = require('chalk');
const simpleGit = require('simple-git');
const axios = require('axios');

const repoOwner = 'your-github-username'; // GitHub username or organization
const repoName = 'your-repo-name'; // Repository name
const branchName = 'main'; // Branch to check for new commits
const githubToken = 'your-github-token'; // GitHub Personal Access Token

// Initialize simple-git with the repo path
const git = simpleGit(process.cwd());

module.exports = async (client) => {
    setInterval(
        tryForUpdate,
        1 * 60 * 1000, // Каждые N минут (первое число)
        client);
};


async function getLastCommit() {
    try {
        const response = await axios.get(
            `https://api.github.com/repos/${repoOwner}/${repoName}/commits/${branchName}`,
            {
                headers: {
                    Authorization: `token ${githubToken}`,
                },
            }
        );
        return response.data.sha;
    } catch (error) {
        console.log(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.red(`[ERROR]`), (chalk.white(`>>`)), chalk.red(`Fetching`), chalk.red(`Failed remote: ${error}`));
        throw error;
    }
}

async function getLastLocalCommit() {
    try {
        const log = await git.log([branchName]);
        return log.latest.hash;
    } catch (error) {
        console.log(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.red(`[ERROR]`), (chalk.white(`>>`)), chalk.red(`Fetching`), chalk.red(`Failed local: ${error}`));
        throw error;
    }
}

async function pullChanges() {
    try {
        await git.pull('origin', branchName);
        console.log(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.green(`[DONE]`), (chalk.white(`>>`)), chalk.red(`Pulling`), chalk.red(`Pulled latest changes`));
    } catch (error) {
        console.error(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.red(`[ERROR]`), (chalk.white(`>>`)), chalk.red(`Pulling`), chalk.red(`Failed: ${error}`));
        throw error;
    }
}

async function tryForUpdate(client) {
    try {
        const remoteCommit = await getLastCommit();
        const localCommit = await getLastLocalCommit();

        if (remoteCommit !== localCommit) {
            console.log(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.green(`[PROGRESS]`), (chalk.white(`>>`)), chalk.red(`Pulling`), chalk.red(`New commit found, pulling changes`));
            try {
                await pullChanges();
                client.restartApp();
            } catch (error) {
                throw error;
            }
        } else {
            console.log(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.blue(`[SKIP]`), (chalk.white(`>>`)), chalk.red(`Fetching`), chalk.red(`No new commits found`));
        }
    } catch (error) {
        console.log(chalk.blue(chalk.bold(`GitHub`)), (chalk.white(`>>`)), chalk.red(`[FAILED]`), (chalk.white(`>>`)), chalk.red(`Pulling`), chalk.red(`Failed update: ${error}`));
    }
}
