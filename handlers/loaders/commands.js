const { REST } = require('discord.js');
const { Routes } = require('discord.js');
const chalk = require('chalk');
const fs = require('fs');

module.exports = async (client) => {
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

    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    try {
        console.log(chalk.blue(chalk.bold(`Commands`)), (chalk.white(`>>`)), chalk.green(`Started refreshing application (/) commands`))
        const data = await rest.put(Routes.applicationCommands(process.env.DISCORD_ID), {body: commands});
        const bot_settings = await client.databaseRequest({ database: client.database, query: "SELECT param FROM settings WHERE name = 'main_server'", params: []})
        const dataf = await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_ID, client.servers_link[bot_settings[0].param].guild), {body: []}); // commands
        console.log(chalk.blue(chalk.bold(`Commands`)), (chalk.white(`>>`)), chalk.green(`Successfully reloaded ${data.length} application (/) commands and forced reload in ${client.servers_link[bot_settings[0].param].guild} guild for ${dataf.length} application (/) commands`))
    } catch (error) {
        console.log(error);
    }
}
