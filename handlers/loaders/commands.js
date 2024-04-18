const { REST } = require('discord.js');
const { Routes } = require('discord.js');
const chalk = require('chalk');
const fs = require('fs');

module.exports = (client) => {
    const commands = [];

    if (client.shard.ids[0] === 0) console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), (chalk.green(`Loading commands`)), (chalk.white(`...`)))
    if (client.shard.ids[0] === 0) console.log(`\u001b[0m`);

    fs.readdirSync('./interactions').forEach(dirs => {
        const commandFiles = fs.readdirSync(`./interactions/${dirs}`).filter(files => files.endsWith('.js'));

        if (client.shard.ids[0] === 0) console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), chalk.red(`${commandFiles.length}`), (chalk.green(`commands of`)), chalk.red(`${dirs}`), (chalk.green(`loaded`)));

        for (const file of commandFiles) {
            const command = require(`${process.cwd()}/interactions/${dirs}/${file}`);
            client.commands.set(command.data.name, command);
            commands.push(command.data);
        };
    });

    const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

    (async () => {
        try {
            console.log(chalk.blue(chalk.bold(`Commands`)), (chalk.white(`>>`)), chalk.green(`Started refreshing application (/) commands`))
            const data = await rest.put(Routes.applicationCommands(process.env.DISCORD_ID), {body: commands});
            console.log(chalk.blue(chalk.bold(`Commands`)), (chalk.white(`>>`)), chalk.green(`Successfully reloaded ${data.length} application (/) commands.`))
        } catch (error) {
            console.log(error);
        }
    });
}
