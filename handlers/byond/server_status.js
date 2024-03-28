const Discord = require('discord.js');
const net = require('net');
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
    const servers = await new Promise((resolve, reject) => {
        global.database.query("SELECT name, ip, port FROM servers ORDER BY name", [], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
    if (!servers.length) {
        console.log(`Failed to find servers. Aborting.`);
        return;
    } else {
        for (const connections of handlingConnections) {
            clearInterval(connections)
        }
        for (const server of servers) {
            const statuses = await new Promise((resolve, reject) => {
                global.database.query("SELECT channel_id, message_id FROM statuses WHERE server_name = ?", [server.name], (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
            if (!statuses.length) {
                console.log(`Failed to find server related feed channels. Aborting, for ${server.name}`);
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
                            title: `${server.name} status`,
                            desc: `prepairing...`
                        }, channel).then((message) => {
                            found_message = message;
                            new Promise((resolve, reject) => {
                                global.database.query("UPDATE statuses SET message_id = ? WHERE server_name = ? AND channel_id = ?", [message.id, server.name, status.channel_id], (err, result) => {
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
                    60000,
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
        const response = await client.prepareByondAPIRequest({request: "status"});
        for (const message of messages) {
            await client.embed({
                title: `${server.name} status`,
                desc: `${response}`,
                color: `#669917`,
                type: 'edit'
            }, message)
        }
    } catch (error) {
        
        for (const message of messages) {
            await client.embed({
                title: `${server.name} status`,
                desc: `# SERVER OFFLINE`,
                color: `#a00f0f`,
                type: 'edit'
            }, message)
        }
        console.error(error);
    }
};

function decodePacket(packet) {
    const packetType = packet[0];
    if (packetType === 0x2a) {
        return packet.readFloatLE(1);
    } else if (packetType === 0x06) {
        return packet.slice(1, -1).toString('ascii');
    }
    return console.log(`Unknown BYOND data code: 0x${packetType.toString(16)}`);
}
