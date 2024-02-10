const Discord = require('discord.js');
const net = require('net');
const handlingConnections = [];

module.exports = async (client) => {
    client.on(Discord.Events.ClientReady, async () => {
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
                global.database.query("SELECT channelid, messageid FROM discordstatus WHERE servername = ?", [server.name], (err, result) => {
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
                    const channel = await client.channels.fetch(status.channelid);
                    var found_message = null;
                    if (status.messageid) {
                        await channel.messages.fetch().then((messages) => {
                            for (const message of messages) {
                                if (message[1].id === status.messageid) {
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
                                global.database.query("UPDATE discordstatus SET messageid = ? WHERE servername = ? AND channelid = ?", [message.id, server.name, status.channelid], (err, result) => {
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
        const response = await serverTopic(server.ip, server.port);
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
                desc: `# SERVER DOWN`,
                color: `#a00f0f`,
                type: 'edit'
            }, message)
        }
        console.error(error);
    }
};

async function serverTopic(address, port) {
    const packet = new Uint8Array([0, 131, 0, 13, 0, 0, 0, 0, 0, 63, 115, 116, 97, 116, 117, 115, 0]);//b'\x00\x83\x00\r\x00\x00\x00\x00\x00?status\x00' the shitcode version of python shitcode of byond shitcode old api (lazy right now with new api)
    return new Promise((resolve, reject) => {
        const client = net.connect(port, address, () => {
            client.write(packet);
        });
        client.on('data', (data) => {
            if (data.slice(0, 2).equals(Buffer.from([0x00, 0x83]))) {
                const size = data.readUInt16BE(2);
                const response = data.slice(4, 4 + size);
                client.end();
                resolve(decodePacket(response));
            } else {
                client.end();
                reject(new Error('BYOND server returned invalid data.'));
            }
        });
        client.on('error', (err) => {
            reject(new Error(`Can't connect to ${address}:${port}: ${err.message}`));
        });
    });
}

function decodePacket(packet) {
    const packetType = packet[0];
    if (packetType === 0x2a) {
        return packet.readFloatLE(1);
    } else if (packetType === 0x06) {
        return packet.slice(1, -1).toString('ascii');
    }
    throw new Error(`Unknown BYOND data code: 0x${packetType.toString(16)}`);
}
