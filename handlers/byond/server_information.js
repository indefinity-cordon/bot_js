const Discord = require('discord.js');
const handlingConnections = [];

module.exports = async (client) => {
    client.on(Discord.Events.ClientReady, async () => {
        await global.database
        startListining(client);
        setInterval(
            startListining,
            1200000,
            client
        );
    });
};

async function startListining(client) {
    for (const connections of handlingConnections) {
        clearInterval(connections);
    }
    handlingConnections.length = 0;
    const servers = await new Promise((resolve, reject) => {
        global.database.query("SELECT server_name, ip, port FROM servers ORDER BY server_name", [], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
    if (!servers[0]) {
        console.log(`Failed to find servers. Aborting.`);
        return;
    } else {
        for (const server of servers) {
            const statuses = await new Promise((resolve, reject) => {
                global.database.query("SELECT channel_id, message_id FROM server_channels WHERE server_name = ? AND type = 'status'", [server.server_name], (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
            if (!statuses[0]) {
                console.log(`Failed to find server related feed channels. Aborting, for ${server.server_name}`);
                return;
            } else {
                var messages = [];
                for (const status of statuses) {
                    const channel = await client.channels.fetch(status.channel_id);
                    var found_message = null;
                    if (status.message_id) {
                        await channel.messages.fetch().then((messages) => {
                            for (const message of messages) {
                                if (message[1].id === status.message_id) {
                                    found_message = message[1];
                                }
                            }
                        });
                    }
                    if (found_message === null) {
                        await client.embed({
                            title: `${server.server_name} status`,
                            desc: `prepairing...`
                        }, channel).then((message) => {
                            found_message = message;
                            new Promise((resolve, reject) => {
                                global.database.query("UPDATE server_channels SET message_id = ? WHERE server_name = ? AND type = 'status' AND channel_id = ?", [message.id, server.server_name, status.channel_id], (err, result) => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        resolve(result);
                                    }
                                });
                            });
                        });
                    }
                    messages.push(found_message);
                }
                updateStatus(client, server, messages)
                handlingConnections.push(setInterval(
                    updateStatus,
                    30000,
                    client,
                    server,
                    messages
                ));
            }
        }
    }
};

async function updateStatus(client, server, messages) {
    try {
        const response = await client.prepareByondAPIRequest({request: "status", port: server.port, address: server.ip}); //`{"query":"status","auth":"anonymous","source":"bot"}` cm example
        for (const message of messages) {
            await client.embed({
                title: `${server.server_name} status`,
                desc: `${response}`,
                color: `#669917`,
                type: 'edit'
            }, message)
        }
    } catch (error) {
        
        for (const message of messages) {
            await client.embed({
                title: `${server.server_name} status`,
                desc: `# SERVER OFFLINE`,
                color: `#a00f0f`,
                type: 'edit'
            }, message)
        }
    }
};
