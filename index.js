const Discord = require('discord.js');
const chalk = require('chalk');
require('dotenv').config('.env');

const manager = new Discord.ShardingManager('./bot.js', {
    totalShards: 'auto',
    token: process.env.DISCORD_TOKEN,
    respawn: true
});

console.clear();
console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), (chalk.green(`Starting up`)), (chalk.white(`...`)));
console.log(`\u001b[0m`);
console.log(chalk.red(`© Skill Issuers Incorporated 0000 - ${new Date().getFullYear()}`));
console.log(chalk.red(`All rights reserved`));
console.log(`\u001b[0m`);
console.log(`\u001b[0m`);
console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), chalk.red(`Version ${require(`${process.cwd()}/package.json`).version}`), (chalk.green(`loaded`)));
console.log(`\u001b[0m`);

manager.on('shardCreate', shard => {
    console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), (chalk.green(`Starting`)), chalk.red(`Shard #${shard.id + 1}`), (chalk.white(`...`)));
    console.log(`\u001b[0m`);

    shard.on("death", (process) => {
        console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), (chalk.green(`Death`)), chalk.red(`Shard #${shard.id + 1}`), (chalk.white(`...`)));
        if (process.exitCode === null) {
            console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), (chalk.green(`Exited With NULL`)), chalk.red(`Shard #${shard.id + 1}`), (chalk.white(`...`)));
        }
    });

    shard.on("shardDisconnect", (event) => {
        console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), (chalk.green(`Disconnected`)), chalk.red(`Shard #${shard.id + 1}`), (chalk.white(`...`)));
    });

    shard.on("shardReconnecting", () => {
        console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), (chalk.green(`Reconnecting`)), chalk.red(`Shard #${shard.id + 1}`), (chalk.white(`...`)));
    });
});

manager.spawn();

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('warning', warn => {
    console.warn("Warning:", warn);
});