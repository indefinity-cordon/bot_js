const { REST } = require('discord.js');
const { Routes } = require('discord.js');
const fs = require('fs');

module.exports = async (client) => {
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
        const bot_settings = await global.mysqlSettingsRequest('main_server');
        const dataf = await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_ID, global.servers_link[bot_settings[0].param].guild), {body: []}); // commands
        console.log(`System >> Successfully reloaded ${data.length} application (/) commands and forced reload in ${global.servers_link[bot_settings[0].param].guild} guild for ${dataf.length} application (/) commands`);
    } catch (error) {
        console.log(error);
    }
}
