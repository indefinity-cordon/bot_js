const Discord = require('discord.js');
const chalk = require('chalk');

module.exports = async (client) => {
    console.log('\u001b[0m');
    console.log(chalk.blue(chalk.bold('System')), chalk.white('>>'), chalk.red(`Shard #${client.shard.ids[0] + 1}`), chalk.green('is ready!'));
    console.log(chalk.blue(chalk.bold('Bot')), chalk.white('>>'), chalk.green('Started on'), chalk.red(`${client.guilds.cache.size}`), chalk.green('servers!'));
    client.user.setPresence({
        activities: [{
            name: 'Simulator of life',
            type: Discord.ActivityType.Playing,
            timestamps: { start: Date.now() }
        }],
        status: 'online'
    });
}

