const Discord = require('discord.js');
const chalk = require('chalk');
const net = require('net');

module.exports = (client) => {
    client.templateEmbed = function () {
        return new Discord.EmbedBuilder()
            .setColor(client.config.colors.normal)
            .setTimestamp();
    }

    //----------------------------------------------------------------//
    //                        ERROR MESSAGES                          //
    //----------------------------------------------------------------//

    // Missing perms

    client.prepareByondAPIRequest = async function ({
        request: request,
        port: port,
        address: address
    }) {
        if (request) {
            const textEncoder = new TextEncoder();
            const encodedText = textEncoder.encode(request);
            const packet = new Uint8Array([0, 131, 0, 13, 0, 0, 0, 0, 0, 63, ...encodedText, 0]);
            return new Promise((resolve, reject) => {
                const client = net.connect(port, address, () => {
                    client.write(packet);
                });
                client.on('data', (data) => {
                    if (data.slice(0, 2).equals(Buffer.from([0x00, 0x83]))) {
                        const size = data.readUInt16BE(2);
                        const response = data.slice(4, 4 + size);
                        client.end();
                        const packetType = response[0];
                        if (packetType === 0x2a) {
                            resolve(response.readFloatLE(1));
                        } else if (packetType === 0x06) {
                            resolve(response.slice(1, -1).toString('ascii'));
                        } else {
                            reject(console.log(chalk.blue(chalk.bold(`ByondAPI`)), (chalk.white(`>>`)), chalk.red(`Request`), chalk.green(`Unknown BYOND data code: 0x${packetType.toString(16)}`)));
                        }
                    } else {
                        client.end();
                        reject(console.log(chalk.blue(chalk.bold(`ByondAPI`)), (chalk.white(`>>`)), chalk.red(`Request`), chalk.green(`BYOND server returned invalid data.`)));
                    }
                });
                client.on('error', (err) => {
                    reject(console.log(chalk.blue(chalk.bold(`ByondAPI`)), (chalk.white(`>>`)), chalk.red(`Request`), chalk.green(`Can't connect to ${address}:${port}: ${err.message}`)));
                });
            });
        } else {
            console.log(chalk.blue(chalk.bold(`ByondAPI`)), (chalk.white(`>>`)), chalk.red(`Request`), chalk.green(`Malformed ByondAPI request, with request: ${request}.`))
        }
    }
}
