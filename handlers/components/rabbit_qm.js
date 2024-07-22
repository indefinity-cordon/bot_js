const amqp = require('amqplib');


module.exports = async (client) => {
    client.onMessage = async function (msg) {
        console.log(" [x] Received message %s", msg.content.toString());
        console.log("Message body is: %s", msg.content.toString());

        await new Promise(resolve => setTimeout(resolve, 5000)); // Represents async I/O operations
    }

    client.main = async function () {
        const connection = await amqp.connect("amqp://guest:guest@mar-rabbit/");
        const channel = await connection.createChannel();
        const queue = 'hello';

        await channel.assertQueue(queue, { durable: false });
        console.log(" [*] Waiting for messages.");

        channel.consume(queue, onMessage, { noAck: true });
    }

    client.main().catch(console.error);
}