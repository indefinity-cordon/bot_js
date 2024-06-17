const Discord = require('discord.js');
const chalk = require('chalk');
const numberToWords = require('number-to-words');

module.exports = async (client) => {
    console.log(`\u001b[0m`);
    console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), chalk.red(`Shard #${client.shard.ids[0] + 1}`), chalk.green(`is ready!`));
    console.log(chalk.blue(chalk.bold(`Bot`)), (chalk.white(`>>`)), chalk.green(`Started on`), chalk.red(`${client.guilds.cache.size}`), chalk.green(`servers!`));

    let pigs_count = 0;
    setInterval(function () {
        pigs_count++
        client.user.setPresence({ activities: [{ name: `counting bad devs, ${numberToWords.toWords(pigs_count)}`, type: Discord.ActivityType.Playing }], status: 'online' });
    })
}

