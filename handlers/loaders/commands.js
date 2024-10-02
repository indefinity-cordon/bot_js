const { REST } = require('discord.js');
const { Routes } = require('discord.js');
const fs = require('fs');

module.exports = async (client) => {
    if (!client.commands) {
        console.log(`System >> [ERROR] >> No commmands module for client ${client.shard.ids[0]}`);
        return;
    }

    const commands = [];

    if (client.shard.ids[0] === 0) console.log('System >> Loading commands ...');
    if (client.shard.ids[0] === 0) console.log('\u001b[0m');

    fs.readdirSync('./interactions').forEach(dirs => {
        const commandFiles = fs.readdirSync(`./interactions/${dirs}`).filter(files => files.endsWith('.js'));

        if (client.shard.ids[0] === 0) console.log(`System >> ${commandFiles.length} commands of ${dirs} loaded`);

        for (const file of commandFiles) {
            const command = require(`${process.cwd()}/interactions/${dirs}/${file}`);
            client.commands.set(command.data.name, command);
            commands.push(command.data);
        };
    });

    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('System >> Started refreshing application (/) commands');
        const data = await rest.put(Routes.applicationCommands(process.env.DISCORD_ID), {body: commands});
        console.log(`System >> Successfully reloaded ${data.length} application (/) commands`);
    } catch (error) {
        console.log(error);
    }
}
