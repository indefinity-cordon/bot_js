const chalk = require('chalk');
const net = require('net');

module.exports = (client) => {
    client.connections_in_proggress = [];
    client.notified = [];
    client.prepareByondAPIRequest = async function ({
        request: request,
        port: port,
        address: address,
        client
    }) {
        if (request && port && address) {
            if (client.connections_in_proggress[`${port}:${address}`]) {
                return; // Удостоверяемся что у нас не будет ошибок из-за частых попыток соединения, когда оно идет слишком долго
            }
            const textEncoder = new TextEncoder();
            const encodedText = textEncoder.encode(request);
            const length = encodedText.length + 7; // 7 байт: 2 для типа пакета (0, 131), 2 для длины, 1 для нулевого байта в конце, 1 байт для кода пакета и 1 байт для завершающего нуля

            const packet = new Uint8Array(length + 4);
            packet.set([0, 131, (length >> 8) & 0xFF, length & 0xFF, 0, 0, 0, 0, 0, 63], 0);
            packet.set(encodedText, 10);
            packet[length + 3] = 0;

            return new Promise((resolve, reject) => {
                const client_api = net.connect(port, address, () => {
                    client_api.write(packet);
                });
                client.connections_in_proggress[`${port}:${address}`] = client_api;
                client_api.on('data', (data) => {
                    if (data.slice(0, 2).equals(Buffer.from([0x00, 0x83]))) {
                        const size = data.readUInt16BE(2);
                        const response = data.slice(4, 4 + size);
                        client.connections_in_proggress[`${port}:${address}`] = null;
                        client.notified[`${port}:${address}`] = false;
                        client_api.end();
                        const packetType = response[0];
                        if (packetType === 0x2a) {
                            resolve(response.readFloatLE(1));
                        } else if (packetType === 0x06) {
                            resolve(response.slice(1, -1).toString('ascii'));
                        } else {
                            console.log(chalk.blue(chalk.bold(`ByondAPI`)), (chalk.white(`>>`)), chalk.red(`Request`), (chalk.white(`>>`)), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Unknown BYOND data code: 0x${packetType.toString(16)}`));
                            reject('Unknown data code');
                        }
                    } else {
                        client.connections_in_proggress[`${port}:${address}`] = null;
                        client_api.end();
                        console.log(chalk.blue(chalk.bold(`ByondAPI`)), (chalk.white(`>>`)), chalk.red(`Request`), (chalk.white(`>>`)), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`BYOND server returned invalid data.`));
                        reject('Failed to read data');
                    }
                });
                client_api.on('error', (err) => {
                    client.connections_in_proggress[`${port}:${address}`] = null;
                    client_api.end();
                    if(!client.notified[`${port}:${address}`])
                        client.notified[`${port}:${address}`] = true;
                        console.log(chalk.blue(chalk.bold(`ByondAPI`)), (chalk.white(`>>`)), chalk.red(`Request`), (chalk.white(`>>`)), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Can't connect to ${address}:${port}: ${err.message}`));
                    reject(err);
                });
            });
        } else {
            console.log(chalk.blue(chalk.bold(`ByondAPI`)), (chalk.white(`>>`)), chalk.red(`Request`), (chalk.white(`>>`)), chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`Malformed ByondAPI request, with request: ${request}, target: ${address}:${port}.`));
        }
    }
}
