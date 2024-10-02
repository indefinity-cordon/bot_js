const fs = require('fs');
const Discord = require('discord.js');

module.exports = (client) => {

    if (client.shard.ids[0] === 0) console.log('\u001b[0m');
    if (client.shard.ids[0] === 0) console.log('System >> Loading events ...');
    if (client.shard.ids[0] === 0) console.log('\u001b[0m');

    const events = fs.readdirSync('./events').filter(files => files.endsWith('.js'));

    if (client.shard.ids[0] === 0) console.log(`System >> ${events.length} events loaded`);

    for (const file of events) {
        const event = require(`${process.cwd()}/events/${file}`);
        const eventName = file.split('.')[0];
        const eventUpperCase = eventName.charAt(0).toUpperCase() + eventName.slice(1);
        if (Discord.Events[eventUpperCase] === undefined){
            client.on(eventName, event.bind(null, client)).setMaxListeners(0);
        }else {
        client.on(Discord.Events[eventUpperCase], event.bind(null, client)).setMaxListeners(0);
        }
    };
}
